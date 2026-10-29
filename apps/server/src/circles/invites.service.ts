import { randomBytes, randomInt } from "node:crypto";

import { Injectable } from "@nestjs/common";
import {
  generateInviteCode,
  inviteExpireAt,
  isInviteExpired,
  isValidInviteToken,
  MAX_MEMBERS,
  parseInviteCode,
  type InviteDto,
  type InvitePreviewDto,
  type InvitePreviewStatus,
} from "@yiqi/shared";
import { and, eq } from "drizzle-orm";

import { Errors } from "../common/business-error";
import { parseId } from "../common/ids";
import { circle, circleJoinRequest, type AppUser, type Circle } from "../db/schema";
import { briefOf, CircleStore } from "./circle-store";

/** 换邀请码撞上别的群正在用的码，最多重来几次（30^6 个码，几乎撞不上） */
const MAX_CODE_ATTEMPTS = 5;

function isDuplicateKey(error: unknown): boolean {
  return (error as { code?: string } | null)?.code === "ER_DUP_ENTRY";
}

/** 加入落地页要的东西都在这一页的空结果里先定好形状，阶段 2、3 再往里填统计和计划 */
const EMPTY_STATS = { plansThisMonth: 0, formedThisMonth: 0, longestPeaceStreak: 0 };

/**
 * 邀请（docs/spec.md「邀请与加入」，决定第 26 条）：
 * 卡片和海报带 token，口头说的是 6 位邀请码，三种共用一个 7 天有效期，放在群这一行上；
 * 过期后再打开邀请页自动换新。
 */
@Injectable()
export class InvitesService {
  constructor(private readonly store: CircleStore) {}

  /** 按 token 或邀请码找群；都没有或格式不对返回 undefined */
  async findByInvite(t: string | undefined, code: string | undefined): Promise<Circle | undefined> {
    if (t && isValidInviteToken(t)) {
      const [found] = await this.store.db
        .select()
        .from(circle)
        .where(eq(circle.inviteToken, t))
        .limit(1);
      return found;
    }

    const parsed = code ? parseInviteCode(code) : null;
    if (parsed) {
      const [found] = await this.store.db
        .select()
        .from(circle)
        .where(eq(circle.inviteCode, parsed))
        .limit(1);
      return found;
    }

    return undefined;
  }

  /**
   * POST /circles/:id/invites：取当前邀请，过期了就换新。
   * 开了「仅群主可邀请」时只有群主能拿。在锁里换码，两个人同时打开邀请页也只会换一次。
   */
  async current(user: AppUser, circleId: number | null): Promise<InviteDto> {
    const { circle: found, member } = await this.store.requireMember(circleId, user.id);

    if (found.inviteOwnerOnly && member.role !== "owner") {
      throw Errors.inviteNotAllowed();
    }

    const fresh = await this.store.db.transaction(async (tx) => {
      const locked = await this.store.lockCircle(found.id, tx);
      if (!locked) throw Errors.circleNotFound();

      const now = new Date();
      if (
        locked.inviteToken &&
        locked.inviteCode &&
        locked.inviteExpireAt &&
        !isInviteExpired(locked.inviteExpireAt, now)
      ) {
        return locked;
      }

      for (let attempt = 1; ; attempt += 1) {
        const invite = {
          inviteToken: randomBytes(16).toString("base64url"),
          inviteCode: generateInviteCode((max) => randomInt(max)),
          inviteExpireAt: inviteExpireAt(now),
        };

        try {
          await tx.update(circle).set(invite).where(eq(circle.id, locked.id));
          return { ...locked, ...invite };
        } catch (error) {
          if (!isDuplicateKey(error) || attempt >= MAX_CODE_ATTEMPTS) throw error;
        }
      }
    });

    const inviter = briefOf(user, member);

    return {
      token: fresh.inviteToken as string,
      code: fresh.inviteCode as string,
      expireAt: (fresh.inviteExpireAt as Date).toISOString(),
      shareTitle: `${inviter.name}邀请你加入「${fresh.name}」`,
      sharePath: `/pages/join/index?t=${fresh.inviteToken}&from=${user.id}`,
    };
  }

  /**
   * GET /invites/preview：加入落地页，不登录也能看（docs/spec.md「邀请与加入」）。
   * 非成员只看得到群名、头像、类型、人数和最多 8 个成员头像（docs/spec.md「隐私」）。
   */
  async preview(
    query: { t?: string; code?: string; from?: string },
    viewer: AppUser | undefined,
  ): Promise<InvitePreviewDto> {
    const found = await this.findByInvite(query.t, query.code);

    if (!found) {
      return {
        status: "invalid",
        circle: null,
        inviter: null,
        stats: EMPTY_STATS,
        upcomingPlans: [],
      };
    }

    const [members, memberCount, viewerMember, viewerRequest] = await Promise.all([
      this.store.activeMembers(found.id, 8),
      this.store.activeCount(found.id),
      viewer ? this.store.membership(found.id, viewer.id) : Promise.resolve(undefined),
      viewer ? this.pendingRequestOf(found.id, viewer.id) : Promise.resolve(false),
    ]);

    // 谁发的邀请：分享卡片带着发卡人，他还在群里就显示他；邀请码不知道是谁说的，就显示群主
    const fromId = query.from ? parseId(query.from) : null;
    const inviterRow =
      (fromId !== null ? await this.store.activeMember(found.id, fromId) : undefined) ??
      (await this.store.activeMember(found.id, found.ownerId));

    let status: InvitePreviewStatus = "ok";
    if (found.status === "dissolved") status = "dissolved";
    else if (viewerMember?.status === "active") status = "member";
    else if (viewerRequest) status = "pending";
    else if (!found.inviteExpireAt || isInviteExpired(found.inviteExpireAt, new Date()))
      status = "expired";
    else if (memberCount >= MAX_MEMBERS) status = "full";

    return {
      status,
      circle: {
        id: String(found.id),
        name: found.name,
        avatar: found.avatar,
        type: found.type,
        memberCount,
        members: members.map(({ member, user }) => briefOf(user, member)),
        king: null,
        needApproval: found.needApproval,
      },
      inviter: inviterRow ? briefOf(inviterRow.user, inviterRow.member) : null,
      stats: EMPTY_STATS,
      upcomingPlans: [],
    };
  }

  private async pendingRequestOf(circleId: number, userId: number): Promise<boolean> {
    const [row] = await this.store.db
      .select({ status: circleJoinRequest.status })
      .from(circleJoinRequest)
      .where(and(eq(circleJoinRequest.circleId, circleId), eq(circleJoinRequest.userId, userId)))
      .limit(1);
    return row?.status === "pending";
  }
}

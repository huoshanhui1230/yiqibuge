import { Injectable } from "@nestjs/common";
import {
  dissolveBlocker,
  isInviteExpired,
  leaveBlocker,
  MAX_MEMBERS,
  removeBlocker,
  transferBlocker,
  type CircleDetailDto,
  type JoinResult,
  type LeavePreviewDto,
  type MemberActionBlocker,
  type MembersResult,
} from "@yiqi/shared";
import { and, eq } from "drizzle-orm";

import { Errors } from "../common/business-error";
import { parseId } from "../common/ids";
import type { Db } from "../db/db.module";
import { circle, circleJoinRequest, circleMember, type AppUser } from "../db/schema";
import { CircleStore } from "./circle-store";
import { CirclesService } from "./circles.service";
import { InvitesService } from "./invites.service";

function blockerError(blocker: MemberActionBlocker): Error {
  switch (blocker) {
    case "NOT_OWNER":
      return Errors.notOwner();
    case "TARGET_IS_SELF":
      return Errors.targetIsSelf();
    case "TARGET_NOT_MEMBER":
      return Errors.targetNotMember();
  }
}

/**
 * 进群、退群、移除、审核、转让、解散（docs/spec.md「退出、移除与解散」，决定第 26 条）。
 * 规则本身是 packages/shared 里的纯函数（有单元测试），这里负责查库、加锁、落库。
 *
 * 退群和被移出时「退出未开始的计划、24 小时内已跟的按鸽了」要等阶段 2 有了计划再接
 * （shared 的 planExitOutcome 已经写好并测过）。
 */
@Injectable()
export class MembershipService {
  constructor(
    private readonly store: CircleStore,
    private readonly circles: CirclesService,
    private readonly invites: InvitesService,
  ) {}

  /** 把一个人放进群：有旧记录（退过群）就恢复成在群里，群昵称清掉重来 */
  private async putIn(tx: Db, circleId: number, userId: number, now: Date): Promise<void> {
    await tx
      .insert(circleMember)
      .values({ circleId, userId, role: "member", status: "active", joinedAt: now })
      .onDuplicateKeyUpdate({
        set: { role: "member", status: "active", joinedAt: now, leftAt: null, groupNickname: null },
      });
  }

  /**
   * POST /circles/join：凭卡片 token 或邀请码加入。
   * 在锁里点人数，两个人同时加入也不会超过 100 人（决定第 6 条）。
   * 群主开了「加入需群主同意」，或者这个人之前被移出过，就进申请等群主同意。
   */
  async join(user: AppUser, body: { t?: string; code?: string }): Promise<JoinResult> {
    const found = await this.invites.findByInvite(body.t, body.code);

    if (!found) throw Errors.inviteInvalid();
    if (found.status === "dissolved") throw Errors.circleDissolved();

    return this.store.db.transaction(async (tx) => {
      const locked = await this.store.lockCircle(found.id, tx);
      if (!locked) throw Errors.inviteInvalid();

      const now = new Date();
      const circleId = String(locked.id);
      const existing = await this.store.membership(locked.id, user.id, tx);

      if (existing?.status === "active") {
        return { status: "already" as const, circleId };
      }
      if (!locked.inviteExpireAt || isInviteExpired(locked.inviteExpireAt, now)) {
        throw Errors.inviteExpired();
      }

      if (locked.needApproval || existing?.status === "removed") {
        await tx
          .insert(circleJoinRequest)
          .values({ circleId: locked.id, userId: user.id, status: "pending", requestedAt: now })
          .onDuplicateKeyUpdate({
            set: { status: "pending", requestedAt: now, decidedAt: null, decidedBy: null },
          });
        return { status: "pending" as const, circleId };
      }

      if ((await this.store.activeCount(locked.id, tx)) >= MAX_MEMBERS) {
        throw Errors.circleFull();
      }

      await this.putIn(tx, locked.id, user.id, now);
      return { status: "joined" as const, circleId };
    });
  }

  /** 同意入群申请：也在锁里点人数 */
  async approve(user: AppUser, circleId: number | null, rawUserId: string): Promise<MembersResult> {
    const { circle: found } = await this.store.requireOwner(circleId, user.id);
    const targetId = parseId(rawUserId);
    if (targetId === null) throw Errors.requestNotFound();

    await this.store.db.transaction(async (tx) => {
      await this.store.lockCircle(found.id, tx);

      const [request] = await tx
        .select()
        .from(circleJoinRequest)
        .where(
          and(eq(circleJoinRequest.circleId, found.id), eq(circleJoinRequest.userId, targetId)),
        )
        .limit(1);
      if (request?.status !== "pending") throw Errors.requestNotFound();

      if ((await this.store.activeCount(found.id, tx)) >= MAX_MEMBERS) {
        throw Errors.circleFull();
      }

      const now = new Date();
      await this.putIn(tx, found.id, targetId, now);
      await tx
        .update(circleJoinRequest)
        .set({ status: "approved", decidedAt: now, decidedBy: user.id })
        .where(
          and(eq(circleJoinRequest.circleId, found.id), eq(circleJoinRequest.userId, targetId)),
        );
    });

    return this.circles.membersOf(found.id, user.id, true);
  }

  async reject(user: AppUser, circleId: number | null, rawUserId: string): Promise<MembersResult> {
    const { circle: found } = await this.store.requireOwner(circleId, user.id);
    const targetId = parseId(rawUserId);
    if (targetId === null) throw Errors.requestNotFound();

    const result = await this.store.db
      .update(circleJoinRequest)
      .set({ status: "rejected", decidedAt: new Date(), decidedBy: user.id })
      .where(
        and(
          eq(circleJoinRequest.circleId, found.id),
          eq(circleJoinRequest.userId, targetId),
          eq(circleJoinRequest.status, "pending"),
        ),
      );
    if (result[0].affectedRows === 0) throw Errors.requestNotFound();

    return this.circles.membersOf(found.id, user.id, true);
  }

  /** 群主把人移出群：不计鸽（docs/spec.md「退出、移除与解散」） */
  async remove(user: AppUser, circleId: number | null, rawUserId: string): Promise<MembersResult> {
    const { circle: found, member } = await this.store.requireMember(circleId, user.id);
    const targetId = parseId(rawUserId);
    const target = targetId === null ? undefined : await this.store.membership(found.id, targetId);

    const blocker = removeBlocker({
      actorRole: member.role,
      actorId: String(user.id),
      targetId: rawUserId,
      targetStatus: target?.status ?? null,
    });
    if (blocker) throw blockerError(blocker);

    await this.store.db
      .update(circleMember)
      .set({ status: "removed", leftAt: new Date() })
      .where(and(eq(circleMember.circleId, found.id), eq(circleMember.userId, targetId as number)));

    return this.circles.membersOf(found.id, user.id, true);
  }

  /** 退群前弹窗要说明的内容：群主拦在哪；会受影响的计划阶段 2 再填 */
  async leavePreview(user: AppUser, circleId: number | null): Promise<LeavePreviewDto> {
    const { circle: found, member } = await this.store.requireMember(circleId, user.id);
    const activeMemberCount = await this.store.activeCount(found.id);

    return {
      blocker: leaveBlocker({ role: member.role, activeMemberCount }),
      flakePlans: [],
      exitPlans: [],
    };
  }

  /** 主动退群。群主不能直接退：群里还有人要先转让，只剩自己只能解散 */
  async leave(user: AppUser, circleId: number | null): Promise<void> {
    const { circle: found, member } = await this.store.requireMember(circleId, user.id);
    const blocker = leaveBlocker({
      role: member.role,
      activeMemberCount: await this.store.activeCount(found.id),
    });

    if (blocker === "OWNER_MUST_TRANSFER") throw Errors.ownerMustTransfer();
    if (blocker === "OWNER_ALONE") throw Errors.ownerAlone();

    await this.store.db
      .update(circleMember)
      .set({ status: "left", leftAt: new Date() })
      .where(and(eq(circleMember.circleId, found.id), eq(circleMember.userId, user.id)));
  }

  /** 转让群主：原群主变成普通成员 */
  async transfer(
    user: AppUser,
    circleId: number | null,
    rawUserId: string,
  ): Promise<CircleDetailDto> {
    const { circle: found, member } = await this.store.requireMember(circleId, user.id);
    const targetId = parseId(rawUserId);
    const target = targetId === null ? undefined : await this.store.membership(found.id, targetId);

    const blocker = transferBlocker({
      actorRole: member.role,
      actorId: String(user.id),
      targetId: rawUserId,
      targetStatus: target?.status ?? null,
    });
    if (blocker) throw blockerError(blocker);

    const newOwnerId = targetId as number;
    await this.store.db.transaction(async (tx) => {
      await tx
        .update(circle)
        .set({ ownerId: newOwnerId, updatedAt: new Date() })
        .where(eq(circle.id, found.id));
      await tx
        .update(circleMember)
        .set({ role: "member" })
        .where(and(eq(circleMember.circleId, found.id), eq(circleMember.userId, user.id)));
      await tx
        .update(circleMember)
        .set({ role: "owner" })
        .where(and(eq(circleMember.circleId, found.id), eq(circleMember.userId, newOwnerId)));
    });

    return this.circles.detail(user, found.id);
  }

  /**
   * 解散群组：只有群主能解散。成员记录留着，数据对原成员保留 30 天后删除（清理任务后面做）；
   * 未开始的计划全部取消并通知，阶段 2 有了计划再接。
   */
  async dissolve(user: AppUser, circleId: number | null): Promise<void> {
    const { circle: found, member } = await this.store.requireMember(circleId, user.id);
    if (dissolveBlocker({ actorRole: member.role })) throw Errors.notOwner();

    const now = new Date();
    await this.store.db
      .update(circle)
      .set({ status: "dissolved", dissolvedAt: now, updatedAt: now })
      .where(eq(circle.id, found.id));
  }
}

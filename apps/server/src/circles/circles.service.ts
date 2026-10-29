import { Inject, Injectable } from "@nestjs/common";
import {
  checkCircleName,
  checkOptionalText,
  GROUP_NICKNAME_MAX,
  isPresetAvatarString,
  isValidTimeZone,
  PENALTY_TEXT_MAX,
  trimText,
  type CircleDetailDto,
  type CircleSummaryDto,
  type MembersResult,
  type UpdateCircleBody,
} from "@yiqi/shared";
import { and, asc, eq } from "drizzle-orm";

import { Errors } from "../common/business-error";
import { ensureCleanText, isAllowedImageUrl } from "../common/content";
import { ENV, type Env } from "../config/env";
import { circle, circleMember, type AppUser, type Circle, type CircleMember } from "../db/schema";
import { CONTENT_SECURITY, type ContentSecurityPort } from "../wechat/ports";
import { briefOf, CircleStore, type MemberWithUser } from "./circle-store";
import type { CreateCircleDto, UpdateCircleDto } from "./circles.dto";

/**
 * 群组的增改查（建群、列表、主页、群设置、成员列表、群昵称）。
 * 进群、退群、移除、转让、解散在 MembershipService，邀请在 InvitesService。
 *
 * 鸽王、和平周、「进行中 N」、计划数先如实返回空值：计划在阶段 2、鸽值在阶段 3 才有。
 */
@Injectable()
export class CirclesService {
  constructor(
    private readonly store: CircleStore,
    @Inject(ENV) private readonly env: Env,
    @Inject(CONTENT_SECURITY) private readonly security: ContentSecurityPort,
  ) {}

  // ---------- 读 ----------

  private summary(
    found: Circle,
    me: CircleMember,
    memberCount: number,
    owner: MemberWithUser | undefined,
  ): CircleSummaryDto {
    return {
      id: String(found.id),
      name: found.name,
      avatar: found.avatar,
      type: found.type,
      memberCount,
      myRole: me.role,
      owner: owner
        ? briefOf(owner.user, owner.member)
        : { id: String(found.ownerId), name: "", avatarUrl: null },
      pigeonEnabled: found.pigeonEnabled,
      activePlanCount: 0,
      king: null,
      peaceStreak: 0,
    };
  }

  /** GET /circles：我在的群（群没解散、我还在里面），按加入先后 */
  async list(user: AppUser): Promise<CircleSummaryDto[]> {
    const rows = await this.store.db
      .select({ circle, member: circleMember })
      .from(circleMember)
      .innerJoin(circle, eq(circle.id, circleMember.circleId))
      .where(
        and(
          eq(circleMember.userId, user.id),
          eq(circleMember.status, "active"),
          eq(circle.status, "active"),
        ),
      )
      .orderBy(asc(circleMember.joinedAt), asc(circle.id));

    const ids = rows.map((row) => row.circle.id);
    const [counts, owners] = await Promise.all([
      this.store.activeCounts(ids),
      this.store.owners(ids),
    ]);

    return rows.map((row) =>
      this.summary(
        row.circle,
        row.member,
        counts.get(row.circle.id) ?? 0,
        owners.get(row.circle.id),
      ),
    );
  }

  /** 群组主页和群设置要的全部信息 */
  async detailOf(found: Circle, me: CircleMember): Promise<CircleDetailDto> {
    const isOwner = me.role === "owner";
    const [memberCount, owners, pendingCount] = await Promise.all([
      this.store.activeCount(found.id),
      this.store.owners([found.id]),
      isOwner ? this.store.pendingCount(found.id) : Promise.resolve(0),
    ]);

    return {
      ...this.summary(found, me, memberCount, owners.get(found.id)),
      timezone: found.timezone,
      needApproval: found.needApproval,
      inviteOwnerOnly: found.inviteOwnerOnly,
      penaltyText: found.penaltyText,
      canInvite: isOwner || !found.inviteOwnerOnly,
      pendingCount,
      planCount: 0,
      myGroupNickname: me.groupNickname,
    };
  }

  async detail(user: AppUser, circleId: number | null): Promise<CircleDetailDto> {
    const { circle: found, member } = await this.store.requireMember(circleId, user.id);
    return this.detailOf(found, member);
  }

  /** 成员列表；群主多拿到待审核的申请 */
  async members(user: AppUser, circleId: number | null): Promise<MembersResult> {
    const { circle: found, member } = await this.store.requireMember(circleId, user.id);
    return this.membersOf(found.id, user.id, member.role === "owner");
  }

  async membersOf(circleId: number, meId: number, isOwner: boolean): Promise<MembersResult> {
    const [members, pending] = await Promise.all([
      this.store.activeMembers(circleId),
      isOwner ? this.store.pendingRequests(circleId) : Promise.resolve([]),
    ]);

    return {
      members: members.map(({ member, user }) => ({
        user: briefOf(user, member),
        role: member.role,
        joinedAt: member.joinedAt.toISOString(),
        isMe: user.id === meId,
      })),
      pending: pending.map(({ request, user }) => ({
        user: briefOf(user),
        requestedAt: request.requestedAt.toISOString(),
      })),
    };
  }

  // ---------- 写 ----------

  private checkAvatar(avatar: string): void {
    if (!isPresetAvatarString(avatar) && !isAllowedImageUrl(avatar, this.env.WECHAT_DRIVER)) {
      throw Errors.badInput("群头像不对，重新选一个试试。");
    }
  }

  private checkTimezone(timezone: string): void {
    if (!isValidTimeZone(timezone)) {
      throw Errors.badInput("时区不对，重新选一个试试。");
    }
  }

  private async checkName(raw: string): Promise<string> {
    const name = trimText(raw);
    const problem = checkCircleName(name);
    if (problem) throw Errors.badInput(problem);

    await ensureCleanText(this.security, name, "circleName");
    return name;
  }

  /** POST /circles：建群，建的人是群主（docs/spec.md「创建群组」） */
  async create(user: AppUser, body: CreateCircleDto): Promise<CircleDetailDto> {
    this.checkAvatar(body.avatar);
    this.checkTimezone(body.timezone);
    const name = await this.checkName(body.name);
    const now = new Date();

    const circleId = await this.store.db.transaction(async (tx) => {
      const [created] = await tx
        .insert(circle)
        .values({
          name,
          avatar: body.avatar,
          type: body.type,
          ownerId: user.id,
          timezone: body.timezone,
          createdAt: now,
          updatedAt: now,
        })
        .$returningId();

      if (!created) throw new Error("群没建出来");

      await tx.insert(circleMember).values({
        circleId: created.id,
        userId: user.id,
        role: "owner",
        status: "active",
        joinedAt: now,
      });

      return created.id;
    });

    return this.detail(user, circleId);
  }

  /** PUT /circles/:id：群主改群设置，只改传了的字段 */
  async update(
    user: AppUser,
    circleId: number | null,
    body: UpdateCircleDto & UpdateCircleBody,
  ): Promise<CircleDetailDto> {
    const { circle: found } = await this.store.requireOwner(circleId, user.id);
    const changes: Partial<Circle> = {};

    if (body.name !== undefined) changes.name = await this.checkName(body.name);
    if (body.type !== undefined) changes.type = body.type;
    if (body.avatar !== undefined) {
      this.checkAvatar(body.avatar);
      changes.avatar = body.avatar;
    }
    if (body.timezone !== undefined) {
      // 改群时区：已发布计划的绝对时间不变，只改显示（docs/spec.md「业务规则与边界情况」）
      this.checkTimezone(body.timezone);
      changes.timezone = body.timezone;
    }
    if (body.needApproval !== undefined) changes.needApproval = body.needApproval;
    if (body.inviteOwnerOnly !== undefined) changes.inviteOwnerOnly = body.inviteOwnerOnly;
    if (body.pigeonEnabled !== undefined) changes.pigeonEnabled = body.pigeonEnabled;
    if (body.penaltyText !== undefined) {
      const text = trimText(body.penaltyText ?? "");
      const problem = checkOptionalText(text, "鸽王任务卡", PENALTY_TEXT_MAX);
      if (problem) throw Errors.badInput(problem);
      if (text) await ensureCleanText(this.security, text, "penaltyText");
      changes.penaltyText = text || null;
    }

    if (Object.keys(changes).length > 0) {
      await this.store.db
        .update(circle)
        .set({ ...changes, updatedAt: new Date() })
        .where(eq(circle.id, found.id));
    }

    return this.detail(user, found.id);
  }

  /** PUT /circles/:id/members/me：我在这个群的群昵称（比如家庭群里叫「二舅」），留空就是不用 */
  async updateGroupNickname(
    user: AppUser,
    circleId: number | null,
    raw: string | null,
  ): Promise<CircleDetailDto> {
    const { circle: found } = await this.store.requireMember(circleId, user.id);
    const nickname = trimText(raw ?? "");
    const problem = checkOptionalText(nickname, "群昵称", GROUP_NICKNAME_MAX);
    if (problem) throw Errors.badInput(problem);
    if (nickname) await ensureCleanText(this.security, nickname, "groupNickname");

    await this.store.db
      .update(circleMember)
      .set({ groupNickname: nickname || null })
      .where(and(eq(circleMember.circleId, found.id), eq(circleMember.userId, user.id)));

    return this.detail(user, found.id);
  }
}

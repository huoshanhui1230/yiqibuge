import { Inject, Injectable } from "@nestjs/common";
import { memberDisplayName, type UserBrief } from "@yiqi/shared";
import { and, asc, count, desc, eq, inArray } from "drizzle-orm";

import { Errors } from "../common/business-error";
import { DB, type Db } from "../db/db.module";
import {
  appUser,
  circle,
  circleJoinRequest,
  circleMember,
  type AppUser,
  type Circle,
  type CircleMember,
} from "../db/schema";

/** 事务里也能用：Drizzle 的 tx 和 db 有同样的查询接口 */
export type DbLike = Pick<Db, "select" | "insert" | "update">;

export interface MemberWithUser {
  member: CircleMember;
  user: AppUser;
}

/** 群里显示一个人：名字按「群昵称 > 昵称 > 微信用户」选好 */
export function briefOf(user: AppUser, member?: CircleMember | null): UserBrief {
  return {
    id: String(user.id),
    name: memberDisplayName({
      nickname: user.nickname,
      groupNickname: member?.groupNickname ?? null,
      status: member?.status,
      deleted: Boolean(user.deletedAt),
    }),
    avatarUrl: user.deletedAt ? null : user.avatarUrl,
  };
}

/**
 * 群组的读写小工具：查群、查成员、点人数，以及「必须是成员 / 必须是群主」的检查。
 * 几个 service 共用，事务里传 tx 进来。
 */
@Injectable()
export class CircleStore {
  constructor(@Inject(DB) readonly db: Db) {}

  async circle(id: number, tx: DbLike = this.db): Promise<Circle | undefined> {
    const [row] = await tx.select().from(circle).where(eq(circle.id, id)).limit(1);
    return row;
  }

  /** 加锁读（SELECT … FOR UPDATE）：加入、审核、换邀请码时串行，防止并发加入超过 100 人 */
  async lockCircle(id: number, tx: Db): Promise<Circle | undefined> {
    const [row] = await tx.select().from(circle).where(eq(circle.id, id)).limit(1).for("update");
    return row;
  }

  async membership(
    circleId: number,
    userId: number,
    tx: DbLike = this.db,
  ): Promise<CircleMember | undefined> {
    const [row] = await tx
      .select()
      .from(circleMember)
      .where(and(eq(circleMember.circleId, circleId), eq(circleMember.userId, userId)))
      .limit(1);
    return row;
  }

  async activeCount(circleId: number, tx: DbLike = this.db): Promise<number> {
    const [row] = await tx
      .select({ n: count() })
      .from(circleMember)
      .where(and(eq(circleMember.circleId, circleId), eq(circleMember.status, "active")));
    return row?.n ?? 0;
  }

  /** 多个群各有几个人 */
  async activeCounts(circleIds: number[]): Promise<Map<number, number>> {
    if (circleIds.length === 0) return new Map();

    const rows = await this.db
      .select({ circleId: circleMember.circleId, n: count() })
      .from(circleMember)
      .where(and(inArray(circleMember.circleId, circleIds), eq(circleMember.status, "active")))
      .groupBy(circleMember.circleId);

    return new Map(rows.map((row) => [row.circleId, row.n]));
  }

  /** 在群里的人：群主排第一，其余按加入先后；limit 给落地页取前 8 个用 */
  async activeMembers(circleId: number, limit?: number): Promise<MemberWithUser[]> {
    const query = this.db
      .select({ member: circleMember, user: appUser })
      .from(circleMember)
      .innerJoin(appUser, eq(appUser.id, circleMember.userId))
      .where(and(eq(circleMember.circleId, circleId), eq(circleMember.status, "active")))
      .orderBy(desc(eq(circleMember.role, "owner")), asc(circleMember.joinedAt), asc(appUser.id));

    return limit === undefined ? query : query.limit(limit);
  }

  /** 群里的某一个人（在群里才算） */
  async activeMember(circleId: number, userId: number): Promise<MemberWithUser | undefined> {
    const [row] = await this.db
      .select({ member: circleMember, user: appUser })
      .from(circleMember)
      .innerJoin(appUser, eq(appUser.id, circleMember.userId))
      .where(
        and(
          eq(circleMember.circleId, circleId),
          eq(circleMember.userId, userId),
          eq(circleMember.status, "active"),
        ),
      )
      .limit(1);
    return row;
  }

  /** 多个群的群主 */
  async owners(circleIds: number[]): Promise<Map<number, MemberWithUser>> {
    if (circleIds.length === 0) return new Map();

    const rows = await this.db
      .select({ member: circleMember, user: appUser })
      .from(circleMember)
      .innerJoin(appUser, eq(appUser.id, circleMember.userId))
      .where(and(inArray(circleMember.circleId, circleIds), eq(circleMember.role, "owner")));

    return new Map(rows.map((row) => [row.member.circleId, row]));
  }

  async pendingRequests(circleId: number) {
    return this.db
      .select({ request: circleJoinRequest, user: appUser })
      .from(circleJoinRequest)
      .innerJoin(appUser, eq(appUser.id, circleJoinRequest.userId))
      .where(and(eq(circleJoinRequest.circleId, circleId), eq(circleJoinRequest.status, "pending")))
      .orderBy(asc(circleJoinRequest.requestedAt));
  }

  async pendingCount(circleId: number): Promise<number> {
    const [row] = await this.db
      .select({ n: count() })
      .from(circleJoinRequest)
      .where(
        and(eq(circleJoinRequest.circleId, circleId), eq(circleJoinRequest.status, "pending")),
      );
    return row?.n ?? 0;
  }

  /**
   * 必须是这个群的成员。非成员一律当「找不到」（决定第 26 条：不暴露群是否存在）；
   * 群解散了，原成员看到「已解散」。
   */
  async requireMember(
    circleId: number | null,
    userId: number,
  ): Promise<{ circle: Circle; member: CircleMember }> {
    if (circleId === null) throw Errors.circleNotFound();

    const [found, member] = await Promise.all([
      this.circle(circleId),
      this.membership(circleId, userId),
    ]);

    if (!found || !member || member.status !== "active") {
      throw Errors.circleNotFound();
    }
    if (found.status === "dissolved") {
      throw Errors.circleDissolved();
    }

    return { circle: found, member };
  }

  async requireOwner(
    circleId: number | null,
    userId: number,
  ): Promise<{ circle: Circle; member: CircleMember }> {
    const access = await this.requireMember(circleId, userId);

    if (access.member.role !== "owner") {
      throw Errors.notOwner();
    }

    return access;
  }
}

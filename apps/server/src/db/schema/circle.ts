import { CIRCLE_TYPES } from "@yiqi/shared";
import {
  bigint,
  boolean,
  char,
  datetime,
  index,
  mysqlEnum,
  mysqlTable,
  primaryKey,
  tinyint,
  varchar,
} from "drizzle-orm/mysql-core";

/**
 * 群组（docs/spec.md「数据模型」circle）。
 * - 按决定第 20 条不建 currency，V1.1 做 AA 记账时再加。
 * - 卡片、海报、邀请码三种邀请共用一个有效期（决定第 26 条），所以邀请直接放在群这一行上。
 * - 比 spec 多一列 dissolved_at：解散后数据对原成员保留 30 天再删，清理任务要用。
 */
export const circle = mysqlTable(
  "circle",
  {
    id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
    /** 界面限 12 个字 */
    name: varchar("name", { length: 24 }).notNull(),
    /** preset:<key> 或图片地址（shared 的 circle/avatar.ts） */
    avatar: varchar("avatar", { length: 512 }).notNull(),
    type: mysqlEnum("type", CIRCLE_TYPES).notNull().default("other"),
    ownerId: bigint("owner_id", { mode: "number", unsigned: true }).notNull(),
    /** 群时区，IANA 名（如 Australia/Sydney）；计划时间按它显示、按它结算 */
    timezone: varchar("timezone", { length: 64 }).notNull(),
    inviteToken: char("invite_token", { length: 22 }).unique("uk_circle_invite_token"),
    inviteCode: char("invite_code", { length: 6 }).unique("uk_circle_invite_code"),
    inviteExpireAt: datetime("invite_expire_at", { mode: "date", fsp: 0 }),
    needApproval: boolean("need_approval").notNull().default(false),
    inviteOwnerOnly: boolean("invite_owner_only").notNull().default(false),
    /** 鸽子王评选，所有群默认开（决定第 3 条） */
    pigeonEnabled: boolean("pigeon_enabled").notNull().default(true),
    /** 鸽王任务卡 */
    penaltyText: varchar("penalty_text", { length: 60 }),
    status: mysqlEnum("status", ["active", "dissolved"]).notNull().default("active"),
    dissolvedAt: datetime("dissolved_at", { mode: "date", fsp: 0 }),
    createdAt: datetime("created_at", { mode: "date", fsp: 0 }).notNull(),
    updatedAt: datetime("updated_at", { mode: "date", fsp: 0 }).notNull(),
  },
  (table) => [index("idx_circle_owner").on(table.ownerId)],
);

export type Circle = typeof circle.$inferSelect;

/**
 * 群成员（docs/spec.md「数据模型」circle_member）。
 * 退群、被移出不删行，改 status：历史记录里要显示「某某（已退群）」。
 * 比 spec 多一列 left_at（退群或被移出的时间）。
 */
export const circleMember = mysqlTable(
  "circle_member",
  {
    circleId: bigint("circle_id", { mode: "number", unsigned: true }).notNull(),
    userId: bigint("user_id", { mode: "number", unsigned: true }).notNull(),
    role: mysqlEnum("role", ["owner", "member"]).notNull().default("member"),
    groupNickname: varchar("group_nickname", { length: 24 }),
    status: mysqlEnum("status", ["active", "left", "removed"]).notNull().default("active"),
    joinedAt: datetime("joined_at", { mode: "date", fsp: 0 }).notNull(),
    leftAt: datetime("left_at", { mode: "date", fsp: 0 }),
    /** 免鸽卡按月重置（阶段 3）：exempt_month 形如 2026-10 */
    exemptMonth: char("exempt_month", { length: 7 }),
    exemptUsed: tinyint("exempt_used").notNull().default(0),
  },
  (table) => [
    primaryKey({ name: "pk_circle_member", columns: [table.circleId, table.userId] }),
    index("idx_circle_member_user").on(table.userId, table.status),
    index("idx_circle_member_circle").on(table.circleId, table.status),
  ],
);

export type CircleMember = typeof circleMember.$inferSelect;

/**
 * 入群申请（spec 没有这张表，阶段 1 方案新增）：群主开了「加入需群主同意」，
 * 或者被移出的人再用邀请加入时（决定第 26 条），先进这里等群主同意或拒绝。
 * 一人一群一行，再申请就把这行改回 pending。
 */
export const circleJoinRequest = mysqlTable(
  "circle_join_request",
  {
    circleId: bigint("circle_id", { mode: "number", unsigned: true }).notNull(),
    userId: bigint("user_id", { mode: "number", unsigned: true }).notNull(),
    status: mysqlEnum("status", ["pending", "approved", "rejected"]).notNull().default("pending"),
    requestedAt: datetime("requested_at", { mode: "date", fsp: 0 }).notNull(),
    decidedAt: datetime("decided_at", { mode: "date", fsp: 0 }),
    decidedBy: bigint("decided_by", { mode: "number", unsigned: true }),
  },
  (table) => [
    primaryKey({ name: "pk_circle_join_request", columns: [table.circleId, table.userId] }),
    index("idx_circle_join_request_status").on(table.circleId, table.status),
  ],
);

export type CircleJoinRequest = typeof circleJoinRequest.$inferSelect;

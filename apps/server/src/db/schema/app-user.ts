import { THEMES } from "@yiqi/shared";
import {
  bigint,
  boolean,
  char,
  datetime,
  index,
  mysqlEnum,
  mysqlTable,
  varchar,
} from "drizzle-orm/mysql-core";

/**
 * 用户（docs/spec.md「数据模型」app_user，表名避开保留字 user）。
 *
 * 身份是云托管注入的 openid（docs/decisions.md 第 19、22 条），建用户只在 POST /auth/wechat 一处。
 * 比 spec 多一列 theme：主题选了要「保存到用户设置」（阶段 1 方案）。
 * 时间一律 datetime 存 UTC（连接层 timezone=Z，库时区 +00:00）。
 */
export const appUser = mysqlTable(
  "app_user",
  {
    id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
    openid: varchar("openid", { length: 64 }).notNull().unique("uk_app_user_openid"),
    /** 以后打通小程序和 App 账号要用；云托管注入头里有就存 */
    unionid: varchar("unionid", { length: 64 }),
    /** 界面限 12 个字；没填过资料的人（从落地页直接加入）是 null，显示成「微信用户」 */
    nickname: varchar("nickname", { length: 32 }),
    /** cloud:// 文件 ID（正式）或本机后端地址（本地联调），见决定第 23 条 */
    avatarUrl: varchar("avatar_url", { length: 512 }),
    /** 手机的 IANA 时区，显示「你的当地时间」用 */
    timezone: varchar("timezone", { length: 64 }),
    theme: mysqlEnum("theme", THEMES).notNull().default("sticker"),
    /** 免打扰时段（当地时间 HH:mm），阶段 4 做设置页 */
    quietStart: char("quiet_start", { length: 5 }).notNull().default("23:00"),
    quietEnd: char("quiet_end", { length: 5 }).notNull().default("08:00"),
    motionOff: boolean("motion_off").notNull().default(false),
    createdAt: datetime("created_at", { mode: "date", fsp: 0 }).notNull(),
    updatedAt: datetime("updated_at", { mode: "date", fsp: 0 }).notNull(),
    /** 注销时间（阶段 4），注销后显示「已注销用户」 */
    deletedAt: datetime("deleted_at", { mode: "date", fsp: 0 }),
  },
  (table) => [index("idx_app_user_unionid").on(table.unionid)],
);

export type AppUser = typeof appUser.$inferSelect;

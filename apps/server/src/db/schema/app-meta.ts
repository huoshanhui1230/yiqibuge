import { datetime, mysqlTable, varchar } from "drizzle-orm/mysql-core";

/**
 * 记账表。health 接口读它，证明「库连得上、迁移跑过了」。
 *
 * 业务表按 docs/spec.md「数据模型」各建各的，不要往这张表里塞业务字段。
 */
export const appMeta = mysqlTable("app_meta", {
  k: varchar("k", { length: 64 }).primaryKey(),
  v: varchar("v", { length: 255 }).notNull(),
  // 时间一律存 UTC：用 datetime，不用会被会话时区折算的 timestamp
  updatedAt: datetime("updated_at", { fsp: 0 }).notNull(),
});

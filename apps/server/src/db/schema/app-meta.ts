import { datetime, mysqlTable, varchar } from "drizzle-orm/mysql-core";

/**
 * 记账表。第 0 步只用它证明「迁移能跑、库能读写」，health 接口读它。
 *
 * 业务表（app_user、circle、circle_member、plan、plan_response、flake_record …）
 * 按 docs/spec.md「数据模型」在阶段 1 建，不要往这张表里塞业务字段。
 */
export const appMeta = mysqlTable("app_meta", {
  k: varchar("k", { length: 64 }).primaryKey(),
  v: varchar("v", { length: 255 }).notNull(),
  // 时间一律存 UTC：用 datetime，不用会被会话时区折算的 timestamp
  updatedAt: datetime("updated_at", { fsp: 0 }).notNull(),
});

/**
 * 跑数据库迁移：pnpm migrate
 *
 * 迁移 SQL 由 pnpm migrate:gen（drizzle-kit generate）生成，放在 drizzle/ 下并入库——
 * spec.md「数据模型」里有复合索引和唯一约束，SQL 看得见才靠得住。
 */
import { drizzle } from "drizzle-orm/mysql2";
import { migrate } from "drizzle-orm/mysql2/migrator";
import mysql from "mysql2/promise";

import { loadEnvFiles } from "../config/load-env";

async function main(): Promise<void> {
  loadEnvFiles();

  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("没有读到 DATABASE_URL。先把 .env.example 复制成 .env。");
  }

  // 迁移是一次性任务，单连接就够
  const connection = await mysql.createConnection({
    uri: url,
    timezone: "Z",
    multipleStatements: true,
  });

  try {
    await migrate(drizzle(connection, { mode: "default" }), { migrationsFolder: "./drizzle" });
    console.log("数据库迁移完成。");
  } finally {
    await connection.end();
  }
}

main().catch((error: unknown) => {
  console.error("数据库迁移失败：", error);
  process.exit(1);
});

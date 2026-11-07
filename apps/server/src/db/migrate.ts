/**
 * 跑数据库迁移：本地 pnpm migrate，线上镜像启动时 node dist/db/migrate.js（见 Dockerfile）。
 *
 * 迁移 SQL 由 pnpm migrate:gen（drizzle-kit generate）生成，放在 drizzle/ 下并入库——
 * spec.md「数据模型」里有复合索引和唯一约束，SQL 看得见才靠得住。
 */
import { drizzle } from "drizzle-orm/mysql2";
import { migrate } from "drizzle-orm/mysql2/migrator";
import mysql, { type RowDataPacket } from "mysql2/promise";

import { loadEnvFiles } from "../config/load-env";

/** 多实例同时启动时排队：不加锁的话后到的会报 Table already exists（实测过） */
const LOCK_NAME = "yiqi_migrate";
const LOCK_TIMEOUT_SECONDS = 60;

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
    const [rows] = await connection.query<RowDataPacket[]>("SELECT GET_LOCK(?, ?) AS acquired", [
      LOCK_NAME,
      LOCK_TIMEOUT_SECONDS,
    ]);

    if (rows[0]?.acquired !== 1) {
      throw new Error(`等了 ${LOCK_TIMEOUT_SECONDS} 秒没拿到迁移锁，可能有别的实例卡住了。`);
    }

    await migrate(drizzle(connection, { mode: "default" }), { migrationsFolder: "./drizzle" });
    console.log("数据库迁移完成。");
  } finally {
    // 连接断开时 MySQL 会自动释放锁
    await connection.end();
  }
}

main().catch((error: unknown) => {
  console.error("数据库迁移失败：", error);
  process.exit(1);
});

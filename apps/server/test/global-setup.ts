import { drizzle } from "drizzle-orm/mysql2";
import { migrate } from "drizzle-orm/mysql2/migrator";
import mysql from "mysql2/promise";

import { testDatabaseUrl } from "./test-db";

/**
 * 接口测试开跑前，把测试库迁到最新。
 * 库本身由 docker-compose 第一次起的时候建好（docker/mysql-init），老容器跑一次 pnpm dev:db:test-init。
 */
export default async function setup(): Promise<void> {
  const url = testDatabaseUrl();
  let connection: mysql.Connection;

  try {
    connection = await mysql.createConnection({
      uri: url,
      timezone: "Z",
      multipleStatements: true,
    });
  } catch (error) {
    throw new Error(
      `连不上接口测试库（${url}）。先 pnpm dev:db 起容器；` +
        `如果是老容器，还要跑一次 pnpm dev:db:test-init 建库。原因：${String(error)}`,
      { cause: error },
    );
  }

  try {
    await migrate(drizzle(connection, { mode: "default" }), { migrationsFolder: "./drizzle" });
  } finally {
    await connection.end();
  }
}

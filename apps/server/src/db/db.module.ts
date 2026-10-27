import { Global, Inject, Module, type OnApplicationShutdown } from "@nestjs/common";
import { drizzle, type MySql2Database } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

import { ENV, type Env } from "../config/env";
import * as schema from "./schema";

export const DB = "DB";
export const DB_POOL = "DB_POOL";

export type Db = MySql2Database<typeof schema>;

@Global()
@Module({
  providers: [
    {
      provide: DB_POOL,
      inject: [ENV],
      useFactory: (env: Env) =>
        mysql.createPool({
          uri: env.DATABASE_URL,
          // 「时间一律存 UTC」：连接层固定 UTC，不跟随机器时区
          timezone: "Z",
          waitForConnections: true,
          connectionLimit: 10,
        }),
    },
    {
      provide: DB,
      inject: [DB_POOL],
      useFactory: (pool: mysql.Pool): Db => drizzle(pool, { schema, mode: "default" }),
    },
  ],
  exports: [DB, DB_POOL],
})
export class DbModule implements OnApplicationShutdown {
  constructor(@Inject(DB_POOL) private readonly pool: mysql.Pool) {}

  async onApplicationShutdown(): Promise<void> {
    await this.pool.end();
  }
}

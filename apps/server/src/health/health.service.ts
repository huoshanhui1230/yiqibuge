import { Inject, Injectable, Logger } from "@nestjs/common";
import { APP_NAME, type DepStatus, type HealthResult } from "@yiqi/shared";
import type { Redis } from "ioredis";

import { ENV, type Env } from "../config/env";
import { DB, type Db } from "../db/db.module";
import { appMeta } from "../db/schema";
import { REDIS } from "../redis/redis.module";

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(
    @Inject(ENV) private readonly env: Env,
    @Inject(DB) private readonly db: Db,
    @Inject(REDIS) private readonly redis: Redis,
  ) {}

  async check(): Promise<HealthResult> {
    const [db, redis] = await Promise.all([this.checkDb(), this.checkRedis()]);

    return {
      ok: db === "up" && redis === "up",
      name: APP_NAME,
      role: this.env.APP_ROLE,
      deps: { db, redis },
      // 时间一律 UTC。撤回窗口和鸽值档位都按服务器时间算，这里暴露出来方便对表。
      serverTime: new Date().toISOString(),
      wechatDriver: this.env.WECHAT_DRIVER,
    };
  }

  /** 查 app_meta：既验证连得上数据库，也验证迁移跑过了（表不存在会抛错） */
  private async checkDb(): Promise<DepStatus> {
    try {
      await this.db.select().from(appMeta).limit(1);
      return "up";
    } catch (error) {
      this.logger.warn(`数据库检查没通过：${String(error)}。先跑 pnpm dev:db 和 pnpm migrate。`);
      return "down";
    }
  }

  private async checkRedis(): Promise<DepStatus> {
    try {
      return (await this.redis.ping()) === "PONG" ? "up" : "down";
    } catch (error) {
      this.logger.warn(`Redis 检查没通过：${String(error)}。先跑 pnpm dev:db。`);
      return "down";
    }
  }
}

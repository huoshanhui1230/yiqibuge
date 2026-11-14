import { Inject, Injectable, Logger } from "@nestjs/common";
import { APP_NAME, type DepStatus, type HealthResult } from "@yiqi/shared";
import type { Redis } from "ioredis";

import { ENV, type Env } from "../config/env";
import { DB, type Db } from "../db/db.module";
import { appMeta } from "../db/schema";
import { REDIS } from "../redis/redis.module";

/**
 * 每个依赖最多等这么久。连不上时 ioredis 会先重试，不设上限的话 health 要等十来秒才回
 * （REDIS_URL 填占位值时就是这样，决定第 29 条）。
 */
export const CHECK_TIMEOUT_MS = 2000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${ms}ms 内没有响应`)), ms);
  });

  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

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
      await withTimeout(this.db.select().from(appMeta).limit(1), CHECK_TIMEOUT_MS);
      return "up";
    } catch (error) {
      this.logger.warn(`数据库检查没通过：${String(error)}。先跑 pnpm dev:db 和 pnpm migrate。`);
      return "down";
    }
  }

  private async checkRedis(): Promise<DepStatus> {
    try {
      return (await withTimeout(this.redis.ping(), CHECK_TIMEOUT_MS)) === "PONG" ? "up" : "down";
    } catch (error) {
      this.logger.warn(`Redis 检查没通过：${String(error)}。先跑 pnpm dev:db。`);
      return "down";
    }
  }
}

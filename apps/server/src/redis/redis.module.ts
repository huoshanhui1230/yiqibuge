import { Global, Inject, Logger, Module, type OnApplicationShutdown } from "@nestjs/common";
import { Redis } from "ioredis";

import { ENV, type Env } from "../config/env";
import { createConnectionLog } from "./connection-log";

export const REDIS = "REDIS";

function createRedis(url: string): Redis {
  // 连不上时别无限重试同一条命令，让 health 直接报 down
  const redis = new Redis(url, { maxRetriesPerRequest: 2 });
  const log = createConnectionLog(new Logger("Redis"));
  redis.on("error", (error: Error) => log.error(error));
  redis.on("ready", () => log.ready());
  return redis;
}

@Global()
@Module({
  providers: [
    {
      provide: REDIS,
      inject: [ENV],
      useFactory: (env: Env) => createRedis(env.REDIS_URL),
    },
  ],
  exports: [REDIS],
})
export class RedisModule implements OnApplicationShutdown {
  constructor(@Inject(REDIS) private readonly redis: Redis) {}

  async onApplicationShutdown(): Promise<void> {
    await this.redis.quit();
  }
}

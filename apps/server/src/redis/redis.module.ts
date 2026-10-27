import { Global, Inject, Module, type OnApplicationShutdown } from "@nestjs/common";
import { Redis } from "ioredis";

import { ENV, type Env } from "../config/env";

export const REDIS = "REDIS";

@Global()
@Module({
  providers: [
    {
      provide: REDIS,
      inject: [ENV],
      useFactory: (env: Env) =>
        new Redis(env.REDIS_URL, {
          // 连不上时别无限重试，让 health 直接报 down
          maxRetriesPerRequest: 2,
        }),
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

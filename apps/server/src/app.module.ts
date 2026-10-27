import { Module, type DynamicModule } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import type { AppRole } from "@yiqi/shared";

import { AppConfigModule } from "./config/config.module";
import { DbModule } from "./db/db.module";
import { HealthModule } from "./health/health.module";
import { QueueModule } from "./queue/queue.module";
import { RedisModule } from "./redis/redis.module";
import { WechatModule } from "./wechat/wechat.module";

/**
 * 模块化单体。
 *
 * HTTP 进程（main.ts）和 Worker 进程（worker.ts）跑同一份代码、同一个镜像，
 * 可以分别扩容；只有 Worker 需要定时调度，所以按角色装配。
 */
@Module({})
export class AppModule {
  static forRole(role: AppRole): DynamicModule {
    return {
      module: AppModule,
      imports: [
        AppConfigModule,
        DbModule,
        RedisModule,
        QueueModule,
        WechatModule,
        HealthModule,
        ...(role === "worker" ? [ScheduleModule.forRoot()] : []),
      ],
    };
  }
}

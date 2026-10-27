import { BullModule } from "@nestjs/bullmq";
import { Global, Module } from "@nestjs/common";
import { Redis } from "ioredis";

import { ENV, type Env } from "../config/env";

/**
 * 延时和定时任务的队列。第 0 步只把队列注册出来，不放任务。
 * 任务本体（开始前提醒、未表态提醒、计划状态推进、每周结算、免打扰补发）
 * 按 docs/spec.md「定时与延时任务」在阶段 3 实现，由 Worker 进程消费。
 */
export const REMINDERS_QUEUE = "reminders";

@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [ENV],
      useFactory: (env: Env) => ({
        // BullMQ 的阻塞命令要求 maxRetriesPerRequest 为 null，所以单独一条连接，不复用 REDIS
        connection: new Redis(env.REDIS_URL, { maxRetriesPerRequest: null }),
      }),
    }),
    BullModule.registerQueue({ name: REMINDERS_QUEUE }),
  ],
  exports: [BullModule],
})
export class QueueModule {}

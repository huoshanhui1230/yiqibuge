import { BullModule, InjectQueue } from "@nestjs/bullmq";
import { Global, Logger, Module, type OnModuleInit } from "@nestjs/common";
import type { Queue } from "bullmq";

import { ENV, type Env } from "../config/env";
import { createConnectionLog } from "../redis/connection-log";

/**
 * 延时和定时任务的队列。现在只把队列注册出来，不放任务。
 * 任务本体（开始前提醒、未表态提醒、计划状态推进、每周结算、免打扰补发）
 * 按 docs/spec.md「定时与延时任务」在阶段 3 实现，由 Worker 进程消费。
 */
export const REMINDERS_QUEUE = "reminders";

@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [ENV],
      // 只给地址，让 BullMQ 自己建连接：它会自己设 maxRetriesPerRequest: null，关闭时也会断开。
      // 传现成的 ioredis 实例会被当成共享连接，app.close() 时不断开，进程退不掉（实测过）。
      useFactory: (env: Env) => ({ connection: { url: env.REDIS_URL } }),
    }),
    BullModule.registerQueue({ name: REMINDERS_QUEUE }),
  ],
  exports: [BullModule],
})
export class QueueModule implements OnModuleInit {
  constructor(@InjectQueue(REMINDERS_QUEUE) private readonly reminders: Queue) {}

  /** 不挂 error 监听的话，BullMQ 每次重连失败都会把整段错误堆栈打到控制台 */
  onModuleInit(): void {
    const log = createConnectionLog(new Logger("Queue"));
    this.reminders.on("error", (error) => log.error(error));
    this.reminders.getBackend().on("ready", () => log.ready());
  }
}

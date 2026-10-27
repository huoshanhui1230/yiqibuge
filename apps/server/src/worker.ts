import "reflect-metadata";

import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { APP_NAME } from "@yiqi/shared";

import { AppModule } from "./app.module";
import { ENV, type Env } from "./config/env";

/**
 * Worker 进程：跑定时和延时任务，没有 HTTP。
 *
 * 和 main.ts 用同一个 AppModule、同一个镜像，只是入口不同，可以单独扩容。
 * 任务本体（开始前提醒、未表态提醒、计划状态推进、每周结算、免打扰补发）
 * 按 docs/spec.md「定时与延时任务」在阶段 3 加进来。
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule.forRole("worker"));
  app.enableShutdownHooks();

  const env = app.get<Env>(ENV);

  new Logger("Worker").log(
    `${APP_NAME} Worker 已启动（微信能力：${env.WECHAT_DRIVER}）。第 0 步还没有注册任务。`,
  );
}

bootstrap().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

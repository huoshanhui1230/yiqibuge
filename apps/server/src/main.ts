import "reflect-metadata";

import { Logger, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { APP_NAME } from "@yiqi/shared";

import { AppModule } from "./app.module";
import { AllExceptionsFilter } from "./common/all-exceptions.filter";
import { ENV, type Env } from "./config/env";

/** HTTP 服务进程。Worker 进程在 worker.ts，两者同一个 AppModule。 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule.forRole("web"));
  const env = app.get<Env>(ENV);

  app.setGlobalPrefix(env.API_PREFIX);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new AllExceptionsFilter());
  // 关进程时让 DbModule / RedisModule 的 onApplicationShutdown 跑到
  app.enableShutdownHooks();

  await app.listen(env.PORT);

  new Logger("Bootstrap").log(
    `${APP_NAME} 后端已启动：http://localhost:${env.PORT}${env.API_PREFIX}` +
      `（微信能力：${env.WECHAT_DRIVER}）`,
  );
}

bootstrap().catch((error: unknown) => {
  // 环境变量校验失败之类的情况：把中文原因打出来，直接退出
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

import { Global, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { ENV, validateEnv, type Env } from "./env";

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // 仓库根的 .env 是唯一一份；apps/server/.env 只是本地临时覆盖，可以不存在
      envFilePath: ["../../.env", ".env"],
    }),
  ],
  providers: [
    {
      provide: ENV,
      // ConfigModule 已经把 .env 读进 process.env，这里统一校验一次并带上类型
      useFactory: (): Env => validateEnv(process.env),
    },
  ],
  exports: [ENV],
})
export class AppConfigModule {}

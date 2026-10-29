import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";

import { AuthController, MeController } from "./auth.controller";
import { AuthGuard } from "./auth.guard";

/** 登录、我的资料，以及全局的 AuthGuard（所有接口默认要登录，公开的标 @Public()） */
@Module({
  controllers: [AuthController, MeController],
  providers: [{ provide: APP_GUARD, useClass: AuthGuard }],
})
export class AuthModule {}

import { Global, Module } from "@nestjs/common";

import { UsersService } from "./users.service";

/** 用户：AuthGuard 每个请求都要按 openid 找人，所以全局可用 */
@Global()
@Module({
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}

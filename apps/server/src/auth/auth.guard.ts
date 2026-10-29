import { Inject, Injectable, type CanActivate, type ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";

import { Errors } from "../common/business-error";
import { UsersService } from "../users/users.service";
import { CLOUD_RUN_IDENTITY, type CloudRunIdentityPort } from "../wechat/ports";
import { IS_PUBLIC, type AuthedRequest } from "./auth.decorators";

/**
 * 全局鉴权：按云托管注入的 openid 找用户（docs/decisions.md 第 19、22 条，后端不发登录态）。
 * - 找到了就挂到 request.user；
 * - 非公开接口找不到人就 401 NOT_LOGGED_IN，小程序收到后先调 POST /auth/wechat 建用户再重试；
 * - 注销的用户当没登录。
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly users: UsersService,
    @Inject(CLOUD_RUN_IDENTITY) private readonly identity: CloudRunIdentityPort,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [
      context.getHandler(),
      context.getClass(),
    ]);
    const request = context.switchToHttp().getRequest<AuthedRequest>();
    const openid = this.identity.openidFrom(request.headers);
    const user = openid ? await this.users.findByOpenid(openid) : undefined;

    if (user && !user.deletedAt) {
      request.user = user;
    }

    if (!isPublic && !request.user) {
      throw Errors.notLoggedIn();
    }

    return true;
  }
}

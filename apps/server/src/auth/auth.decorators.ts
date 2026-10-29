import { createParamDecorator, SetMetadata, type ExecutionContext } from "@nestjs/common";

import type { AppUser } from "../db/schema";
import type { RequestHeaders } from "../wechat/ports";

export const IS_PUBLIC = "yiqi:isPublic";

/**
 * 不要求登录的接口（健康检查、加入落地页的预览、登录本身）。
 * 有身份时 AuthGuard 照样把用户挂上，接口可以按「是不是已经在群里」给不同结果。
 */
export const Public = () => SetMetadata(IS_PUBLIC, true);

export interface AuthedRequest {
  headers: RequestHeaders;
  /** AuthGuard 按云托管注入的 openid 找到的用户；公开接口上可能没有 */
  user?: AppUser;
}

/** 取当前用户。只用在非公开接口上（AuthGuard 已经保证有人） */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AppUser => {
    const request = context.switchToHttp().getRequest<AuthedRequest>();
    return request.user as AppUser;
  },
);

/** 公开接口上取当前用户，可能没有 */
export const OptionalUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AppUser | undefined =>
    context.switchToHttp().getRequest<AuthedRequest>().user,
);

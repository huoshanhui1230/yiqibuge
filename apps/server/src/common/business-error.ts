import { HttpException, HttpStatus } from "@nestjs/common";

/**
 * 业务错误：带一个给前端分辨用的 code 和一句能直接给用户看的中文提示。
 * AllExceptionsFilter 看到响应里有合法的 code 就原样透传，不再按 HTTP 状态码套通用 code。
 */
export class BusinessError extends HttpException {
  constructor(
    readonly code: string,
    message: string,
    status: HttpStatus = HttpStatus.BAD_REQUEST,
  ) {
    super({ code, message }, status);
  }
}

/** 阶段 1 用到的业务错误，code 和小程序端约好（apps/miniapp 的请求层按 code 分辨） */
export const Errors = {
  notLoggedIn: () =>
    new BusinessError("NOT_LOGGED_IN", "还没登录，先登录一下。", HttpStatus.UNAUTHORIZED),
  badInput: (message: string) => new BusinessError("BAD_REQUEST", message, HttpStatus.BAD_REQUEST),
  contentRejected: (message: string) =>
    new BusinessError("CONTENT_REJECTED", message, HttpStatus.BAD_REQUEST),
  circleNotFound: () =>
    new BusinessError(
      "CIRCLE_NOT_FOUND",
      "找不到这个群，可能已经退出或者被移出了。",
      HttpStatus.NOT_FOUND,
    ),
  circleDissolved: () =>
    new BusinessError("CIRCLE_DISSOLVED", "这个群已经解散了。", HttpStatus.GONE),
  notOwner: () =>
    new BusinessError("NOT_CIRCLE_OWNER", "只有群主能做这件事。", HttpStatus.FORBIDDEN),
  inviteNotAllowed: () =>
    new BusinessError("INVITE_NOT_ALLOWED", "群主设置了仅群主可邀请。", HttpStatus.FORBIDDEN),
  inviteInvalid: () =>
    new BusinessError(
      "INVITE_INVALID",
      "邀请不对，核对一下邀请码，或者让群友再发一次。",
      HttpStatus.NOT_FOUND,
    ),
  inviteExpired: () =>
    new BusinessError("INVITE_EXPIRED", "邀请过期了，找群友再发一次。", HttpStatus.GONE),
  circleFull: () =>
    new BusinessError("CIRCLE_FULL", "群已经满 100 人了，加不进去。", HttpStatus.CONFLICT),
  ownerMustTransfer: () =>
    new BusinessError(
      "OWNER_MUST_TRANSFER",
      "群主要先把群主转给别人，才能退群。",
      HttpStatus.CONFLICT,
    ),
  ownerAlone: () =>
    new BusinessError("OWNER_ALONE", "群里只剩你一个人了，可以直接解散群组。", HttpStatus.CONFLICT),
  targetNotMember: () =>
    new BusinessError("TARGET_NOT_MEMBER", "对方已经不在群里了。", HttpStatus.CONFLICT),
  targetIsSelf: () =>
    new BusinessError("TARGET_IS_SELF", "不能对自己这么做。", HttpStatus.BAD_REQUEST),
  requestNotFound: () =>
    new BusinessError("REQUEST_NOT_FOUND", "这条申请已经处理过了，刷新一下。", HttpStatus.CONFLICT),
};

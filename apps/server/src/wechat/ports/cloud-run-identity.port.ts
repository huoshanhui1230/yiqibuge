export const CLOUD_RUN_IDENTITY = "CLOUD_RUN_IDENTITY";

/** 请求头。Express 收到的头值可能是数组，所以类型放宽。 */
export type RequestHeaders = Record<string, string | string[] | undefined>;

/**
 * 云托管身份。
 *
 * 首版后端 100% 走 wx.cloud.callContainer（docs/decisions.md 第 19 条），
 * 微信云托管会在请求头里注入调用方的 openid，后端直接取，不自己签发登录态。
 * 本地开发读 X-Fake-Openid 头。
 */
export interface CloudRunIdentityPort {
  /** 取不到身份时返回 null，由上层决定要不要 401 */
  openidFrom(headers: RequestHeaders): string | null;
}

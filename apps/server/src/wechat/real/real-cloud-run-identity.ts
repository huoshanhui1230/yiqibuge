import type { CloudRunIdentityPort, RequestHeaders } from "../ports/cloud-run-identity.port";

/**
 * 微信云托管注入的身份头。
 *
 * 小程序用 wx.cloud.callContainer 调过来时，云托管会把调用方的 openid 放进请求头，
 * 后端直接取，不用自己签发登录态（docs/decisions.md 第 19 条）。
 *
 * 待办：接云托管时按官方文档核对一遍这两个头的名字（.claude/rules/server.md 要求「以官方文档为准」），
 * 核对结论记进 docs/progress.md。
 */
const OPENID_HEADERS = ["x-wx-openid", "x-wx-from-openid"] as const;

export class RealCloudRunIdentity implements CloudRunIdentityPort {
  openidFrom(headers: RequestHeaders): string | null {
    for (const name of OPENID_HEADERS) {
      const raw = headers[name];
      const value = (Array.isArray(raw) ? raw[0] : raw)?.trim();

      if (value && value.length > 0) {
        return value;
      }
    }

    return null;
  }
}

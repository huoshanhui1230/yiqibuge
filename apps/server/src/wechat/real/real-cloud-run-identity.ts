import type { CloudRunIdentityPort, RequestHeaders } from "../ports/cloud-run-identity.port";

/**
 * 微信云托管注入的身份头。
 *
 * 小程序用 wx.cloud.callContainer 调过来时，云托管会把调用方的 openid 放进请求头，
 * 后端直接取，不用自己签发登录态（docs/decisions.md 第 19 条）。
 *
 * 头的名字已按官方文档核对（2026-11-07）：资源复用时没有 X-WX-OPENID，要看 X-WX-FROM-OPENID；
 * UnionID 的两个头只在满足获取条件时才有。
 */
const OPENID_HEADERS = ["x-wx-openid", "x-wx-from-openid"] as const;
const UNIONID_HEADERS = ["x-wx-unionid", "x-wx-from-unionid"] as const;

function firstHeader(headers: RequestHeaders, names: readonly string[]): string | null {
  for (const name of names) {
    const raw = headers[name];
    const value = (Array.isArray(raw) ? raw[0] : raw)?.trim();

    if (value && value.length > 0) {
      return value;
    }
  }

  return null;
}

export class RealCloudRunIdentity implements CloudRunIdentityPort {
  openidFrom(headers: RequestHeaders): string | null {
    return firstHeader(headers, OPENID_HEADERS);
  }

  unionidFrom(headers: RequestHeaders): string | null {
    return firstHeader(headers, UNIONID_HEADERS);
  }
}

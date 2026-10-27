import type { Env } from "../../config/env";
import type { CloudRunIdentityPort, RequestHeaders } from "../ports/cloud-run-identity.port";

/** 本地切换测试用户用的请求头 */
export const FAKE_OPENID_HEADER = "x-fake-openid";

/**
 * 假身份。请求带 X-Fake-Openid 就用它，否则用 FAKE_DEFAULT_OPENID。
 * 阶段 2 要用两个测试用户走「发起 → 跟了 → 撤回 → 再跟 → 鸽了」，靠的就是这个头。
 */
export class FakeCloudRunIdentity implements CloudRunIdentityPort {
  constructor(private readonly env: Env) {}

  openidFrom(headers: RequestHeaders): string | null {
    const raw = headers[FAKE_OPENID_HEADER];
    const fromHeader = (Array.isArray(raw) ? raw[0] : raw)?.trim();

    return fromHeader && fromHeader.length > 0 ? fromHeader : this.env.FAKE_DEFAULT_OPENID;
  }
}

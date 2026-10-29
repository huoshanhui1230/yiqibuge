/**
 * 本地联调（local 档）用哪个测试用户。
 *
 * 后端用假驱动时按请求头 X-Fake-Openid 认人（apps/server 的 FakeCloudRunIdentity），
 * 所以在微信开发者工具里连本机后端时，切换测试用户就是换这个头。
 * 正式环境（cloud 档）身份由云托管注入，这里完全不起作用（docs/decisions.md 第 22 条）。
 */
const STORAGE_KEY = "yq.devOpenid";
const DEFAULT_OPENID = "openid_test_a";

export const FAKE_OPENID_HEADER = "x-fake-openid";

export function devOpenid(): string {
  try {
    const saved = uni.getStorageSync(STORAGE_KEY) as unknown;
    if (typeof saved === "string" && saved.length > 0) {
      return saved;
    }
  } catch {
    // 读不到缓存就用默认
  }

  return import.meta.env.VITE_FAKE_OPENID || DEFAULT_OPENID;
}

export function setDevOpenid(openid: string): void {
  uni.setStorageSync(STORAGE_KEY, openid);
}

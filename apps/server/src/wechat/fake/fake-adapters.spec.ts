import { describe, expect, it } from "vitest";

import { validateEnv } from "../../config/env";
import { FAKE_OPENID_HEADER, FakeCloudRunIdentity } from "./fake-cloud-run-identity";
import { FakeContentSecurity } from "./fake-content-security";
import { FakeWechatAuth } from "./fake-wechat-auth";

const env = validateEnv({
  DATABASE_URL: "mysql://yiqi:yiqi@127.0.0.1:3307/yiqibuge?timezone=Z",
  REDIS_URL: "redis://127.0.0.1:6379",
  FAKE_DEFAULT_OPENID: "openid_test_a",
  FAKE_USERS: "openid_test_a:小明,openid_test_b:小红",
});

describe("假身份（本地切换测试用户）", () => {
  const identity = new FakeCloudRunIdentity(env);

  it("没带头时用 FAKE_DEFAULT_OPENID", () => {
    expect(identity.openidFrom({})).toBe("openid_test_a");
  });

  it("带了 X-Fake-Openid 就换成那个用户", () => {
    expect(identity.openidFrom({ [FAKE_OPENID_HEADER]: "openid_test_b" })).toBe("openid_test_b");
  });

  it("头是空字符串时退回默认用户", () => {
    expect(identity.openidFrom({ [FAKE_OPENID_HEADER]: "   " })).toBe("openid_test_a");
  });
});

describe("假登录", () => {
  const auth = new FakeWechatAuth(env);

  it("认 FAKE_USERS 里的昵称，换成对应的 openid", async () => {
    await expect(auth.code2Session("小红")).resolves.toMatchObject({ openid: "openid_test_b" });
  });

  it("不认识的 code 就当成 openid 本身，方便临时造用户", async () => {
    await expect(auth.code2Session("openid_临时")).resolves.toMatchObject({
      openid: "openid_临时",
    });
  });
});

describe("假内容安全检测", () => {
  const security = new FakeContentSecurity();

  it("普通文本通过", async () => {
    await expect(security.checkText("周五火锅", "planTitle")).resolves.toEqual({ pass: true });
  });

  it("命中词表时不通过，提示里带上出错的位置", async () => {
    const result = await security.checkText("这是测试敏感词", "circleName");

    expect(result.pass).toBe(false);
    expect(result.reason).toContain("群名");
  });

  it("图片一律通过（真检测在阶段 4 接）", async () => {
    await expect(security.checkImage("https://example.com/a.png")).resolves.toEqual({
      pass: true,
    });
  });
});

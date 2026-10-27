import { describe, expect, it } from "vitest";

import { validateEnv } from "./env";

const base = {
  DATABASE_URL: "mysql://yiqi:yiqi@127.0.0.1:3307/yiqibuge?timezone=Z",
  REDIS_URL: "redis://127.0.0.1:6379",
};

describe("环境变量校验", () => {
  it("只给必填项时，其余用默认值", () => {
    const env = validateEnv({ ...base });

    expect(env.NODE_ENV).toBe("development");
    expect(env.APP_ROLE).toBe("web");
    expect(env.PORT).toBe(3000);
    expect(env.API_PREFIX).toBe("/api/v1");
    expect(env.WECHAT_DRIVER).toBe("fake");
  });

  it("缺少 DATABASE_URL 时报中文错误并带上字段名", () => {
    expect(() => validateEnv({ REDIS_URL: base.REDIS_URL })).toThrowError(/DATABASE_URL/);
  });

  it("PORT 是数字字符串时会转成数字", () => {
    expect(validateEnv({ ...base, PORT: "4000" }).PORT).toBe(4000);
  });

  it("把 FAKE_USERS 解析成测试用户列表", () => {
    const env = validateEnv({
      ...base,
      FAKE_USERS: "openid_test_a:小明, openid_test_b:小红 ,,openid_test_c:阿强",
    });

    expect(env.FAKE_USERS).toEqual([
      { openid: "openid_test_a", nickname: "小明" },
      { openid: "openid_test_b", nickname: "小红" },
      { openid: "openid_test_c", nickname: "阿强" },
    ]);
  });

  // 这条是硬规则：假开关不能漏进正式版（docs/prompts.md 阶段 5 要查）
  it("正式环境配假实现时拒绝启动", () => {
    expect(() =>
      validateEnv({ ...base, NODE_ENV: "production", WECHAT_DRIVER: "fake" }),
    ).toThrowError(/不允许用微信能力的假实现/);
  });

  it("用真实现但没配 AppID 或密钥时拒绝启动", () => {
    expect(() => validateEnv({ ...base, WECHAT_DRIVER: "real" })).toThrowError(/WX_APPID/);
  });

  it("正式环境配齐真实现的凭据时可以启动", () => {
    const env = validateEnv({
      ...base,
      NODE_ENV: "production",
      WECHAT_DRIVER: "real",
      WX_APPID: "wx123",
      WX_APP_SECRET: "secret",
    });

    expect(env.WECHAT_DRIVER).toBe("real");
  });
});

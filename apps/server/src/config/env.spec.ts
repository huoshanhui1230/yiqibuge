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

  it("旧 .env 里还留着已经删掉的变量时照样能启动", () => {
    const env = validateEnv({
      ...base,
      WX_APPID: "wx0000000000000000",
      WX_APP_SECRET: "x",
      FAKE_USERS: "openid_test_a:小明",
    });

    expect(env).not.toHaveProperty("WX_APP_SECRET");
  });

  // 这条是硬规则：假开关不能漏进正式版（docs/prompts.md 阶段 5 要查）
  it("正式环境配假实现时拒绝启动", () => {
    expect(() =>
      validateEnv({ ...base, NODE_ENV: "production", WECHAT_DRIVER: "fake" }),
    ).toThrowError(/不允许用微信能力的假实现/);
  });

  // 身份走云托管注入的请求头，不把 AppSecret 放进云托管（docs/decisions.md 第 30 条）
  it("正式环境用真实现时不要求 AppID 和密钥", () => {
    const env = validateEnv({ ...base, NODE_ENV: "production", WECHAT_DRIVER: "real" });

    expect(env.WECHAT_DRIVER).toBe("real");
  });
});

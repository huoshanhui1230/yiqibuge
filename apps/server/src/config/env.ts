import { z } from "zod";

/** 注入令牌：拿到校验过的、带类型的环境变量 */
export const ENV = "ENV";

/** 假身份：形如 openid_test_a:小明,openid_test_b:小红 */
const fakeUsers = z
  .string()
  .default("")
  .transform((raw) =>
    raw
      .split(",")
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0)
      .map((entry) => {
        const [openid, nickname] = entry.split(":");
        return { openid: (openid ?? "").trim(), nickname: (nickname ?? "").trim() };
      })
      .filter((user) => user.openid.length > 0),
  );

export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  // web = HTTP 服务进程，worker = 定时和延时任务进程，两者同一份代码
  APP_ROLE: z.enum(["web", "worker"]).default("web"),
  PORT: z.coerce.number().int().positive().default(3000),
  API_PREFIX: z.string().default("/api/v1"),

  DATABASE_URL: z.string().min(1, "不能为空，参考 .env.example"),
  REDIS_URL: z.string().min(1, "不能为空，参考 .env.example"),

  WECHAT_DRIVER: z.enum(["fake", "real"]).default("fake"),
  FAKE_DEFAULT_OPENID: z.string().default("openid_test_a"),
  FAKE_USERS: fakeUsers,

  WX_APPID: z.string().default(""),
  WX_APP_SECRET: z.string().default(""),
  WX_SUBSCRIBE_TEMPLATE_IDS: z.string().default(""),
});

export type Env = z.infer<typeof envSchema>;

/**
 * 校验环境变量。有问题就抛错，让后端直接起不来，而不是带着错配置跑。
 *
 * 这里还挡住一件事：正式环境不许用微信能力的假实现。
 * docs/prompts.md 阶段 5 要检查「假数据开关有没有漏进正式版」，
 * 做成启动断言就不用靠人眼查了。
 */
export function validateEnv(raw: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(raw);

  if (!parsed.success) {
    const lines = parsed.error.issues.map(
      (issue) => `  - ${issue.path.join(".") || "(根)"}：${issue.message}`,
    );
    throw new Error(`环境变量有问题，后端没有启动：\n${lines.join("\n")}`);
  }

  const env = parsed.data;

  if (env.NODE_ENV === "production" && env.WECHAT_DRIVER === "fake") {
    throw new Error(
      "正式环境（NODE_ENV=production）不允许用微信能力的假实现。" +
        "请把 WECHAT_DRIVER 改成 real，并配好 WX_APPID 和 WX_APP_SECRET。",
    );
  }

  if (env.WECHAT_DRIVER === "real" && (env.WX_APPID === "" || env.WX_APP_SECRET === "")) {
    throw new Error("WECHAT_DRIVER=real 时必须配 WX_APPID 和 WX_APP_SECRET。");
  }

  return env;
}

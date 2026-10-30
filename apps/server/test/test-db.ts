import { loadEnvFiles } from "../src/config/load-env";

/**
 * 接口测试用的库地址：TEST_DATABASE_URL，没配就把 DATABASE_URL 的库名换成 yiqibuge_test。
 * 测试会清表，所以库名必须以 _test 结尾，不是就直接报错，绝不碰开发库。
 */
export function testDatabaseUrl(): string {
  loadEnvFiles();

  const url =
    process.env.TEST_DATABASE_URL ||
    (process.env.DATABASE_URL ?? "").replace(/\/yiqibuge(?=\?|$)/, "/yiqibuge_test");
  const database = /\/([^/?]+)(?:\?|$)/.exec(url)?.[1] ?? "";

  if (!database.endsWith("_test")) {
    throw new Error(
      `接口测试会清表，库名必须以 _test 结尾，现在是「${database || "(空)"}」。` +
        "在 .env 里配 TEST_DATABASE_URL（见 .env.example）。",
    );
  }

  return url;
}

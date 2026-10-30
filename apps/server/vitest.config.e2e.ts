import swc from "unplugin-swc";
import { defineConfig } from "vitest/config";

import { testDatabaseUrl } from "./test/test-db";

export default defineConfig({
  test: {
    environment: "node",
    include: ["test/**/*.e2e-spec.ts"],
    // 接口测试连真的 MySQL 和 Redis（pnpm dev:db 起的那两个容器），但库是单独的 yiqibuge_test，
    // 测试会清表，不碰开发库。串行跑避免互相干扰。
    globalSetup: ["test/global-setup.ts"],
    env: {
      DATABASE_URL: testDatabaseUrl(),
      WECHAT_DRIVER: "fake",
      NODE_ENV: "test",
    },
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
  plugins: [swc.vite()],
});

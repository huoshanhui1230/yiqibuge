import swc from "unplugin-swc";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["test/**/*.e2e-spec.ts"],
    // 接口测试要连真的 MySQL 和 Redis（pnpm dev:db 起的那两个容器），串行跑避免互相干扰
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
  plugins: [swc.vite()],
});

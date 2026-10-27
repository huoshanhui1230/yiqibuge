import swc from "unplugin-swc";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.spec.ts"],
  },
  // NestJS 的依赖注入靠 emitDecoratorMetadata，esbuild 不生成它，所以这里用 SWC 转译（读 .swcrc）
  plugins: [swc.vite()],
});

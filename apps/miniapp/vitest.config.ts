import { defineConfig } from "vitest/config";

// 只测不依赖 uni-app 运行时的纯逻辑（请求层分档、主题生成等）。
// 页面和组件的走查靠 H5 预览加截图（pnpm shots），不在这里做。
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.spec.ts", "scripts/**/*.spec.ts"],
  },
  define: {
    __API_MODE__: JSON.stringify("mock"),
  },
});

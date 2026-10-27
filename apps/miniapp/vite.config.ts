import { resolve } from "node:path";

import uni from "@dcloudio/vite-plugin-uni";
import { defineConfig, loadEnv } from "vite";

/**
 * 请求层的三档在编译期定下来（运行时读 __API_MODE__）：
 *   H5 预览 → mock（只在开发时用，走假数据，方便截图对照设计稿）
 *   小程序 + 开发 → local（微信开发者工具连本机后端，要关掉「校验合法域名」）
 *   小程序 + 生产 → cloud（wx.cloud.callContainer，见 docs/decisions.md 第 19 条）
 * 用 .env 里的 VITE_API_MODE 可以手动覆盖。
 */
function resolveApiMode(mode: string, platform: string, fromEnv: string | undefined): string {
  if (fromEnv === "cloud" || fromEnv === "local" || fromEnv === "mock") {
    return fromEnv;
  }
  if (platform === "h5") {
    return "mock";
  }
  return mode === "production" ? "cloud" : "local";
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  const platform = process.env.UNI_PLATFORM ?? "h5";
  const apiMode = resolveApiMode(mode, platform, env.VITE_API_MODE);

  return {
    plugins: [uni()],
    define: {
      __API_MODE__: JSON.stringify(apiMode),
    },
    resolve: {
      alias: { "@": resolve(import.meta.dirname, "src") },
    },
    server: {
      port: 5173,
      strictPort: true,
    },
  };
});

/// <reference types="vite/client" />

/** 请求层档位，由 vite.config.ts 在编译期按平台和环境定下来 */
declare const __API_MODE__: "cloud" | "local" | "mock";

/**
 * 微信小程序的全局对象。@dcloudio/types 不带 wx.cloud 的类型，
 * 这里按微信云托管文档只声明用到的那部分（其余能力一律走 uni.*）。
 * 待办：接云托管时按官方文档核对字段名，结论记进 docs/progress.md。
 */
declare const wx: {
  cloud?: {
    init(options: { env: string }): void;
    callContainer(options: {
      config: { env: string };
      path: string;
      method: string;
      header: Record<string, string>;
      data?: unknown;
    }): Promise<{ statusCode: number; data: unknown }>;
  };
};

interface ImportMetaEnv {
  /** local 档用的本机后端地址 */
  readonly VITE_API_BASE: string;
  /** cloud 档用的微信云托管环境 ID */
  readonly VITE_CLOUD_ENV: string;
  /** cloud 档用的微信云托管服务名 */
  readonly VITE_CLOUD_SERVICE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

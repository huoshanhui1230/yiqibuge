/// <reference types="vite/client" />

/** 请求层档位，由 vite.config.ts 在编译期按平台和环境定下来 */
declare const __API_MODE__: "cloud" | "local" | "mock";

/**
 * 微信小程序的全局对象。@dcloudio/types 不带 wx.cloud 和隐私接口的类型，
 * 这里按微信官方文档只声明用到的那部分（其余能力一律走 uni.*）。
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
    /** 传到云托管对象存储，返回 cloud:// 文件 ID（docs/decisions.md 第 23 条） */
    uploadFile(options: {
      cloudPath: string;
      filePath: string;
      config: { env: string };
    }): Promise<{ fileID: string; statusCode: number }>;
  };
  /** 打开小程序后台填写的《隐私保护指引》 */
  openPrivacyContract(options: {
    success?: () => void;
    fail?: (err: { errMsg: string }) => void;
  }): void;
};

interface ImportMetaEnv {
  /** local 档用的本机后端地址 */
  readonly VITE_API_BASE: string;
  /** cloud 档用的微信云托管环境 ID */
  readonly VITE_CLOUD_ENV: string;
  /** cloud 档用的微信云托管服务名 */
  readonly VITE_CLOUD_SERVICE: string;
  /** 站酷快乐体文件的 https 地址（放在云存储），没配就用系统字体（docs/decisions.md 第 24 条） */
  readonly VITE_FONT_DISPLAY_URL: string;
  /** local 档默认用哪个测试用户（后端 FAKE_USERS 里的 openid） */
  readonly VITE_FAKE_OPENID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

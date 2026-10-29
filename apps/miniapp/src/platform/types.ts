import type { HttpMethod } from "../request/types";

export interface ContainerRequest {
  /** 完整路径，含 /api/v1 前缀 */
  path: string;
  method: HttpMethod;
  data?: unknown;
  requestId: string;
}

export interface ContainerResponse {
  statusCode: number;
  data: unknown;
}

export interface SharePayload {
  title: string;
  path: string;
  /** 分享配图，由 renderShareCard 现场生成 */
  imageUrl?: string;
}

export interface ShareCardPayload {
  /** 状态、时间、日期地点、已跟人数由调用方算好传进来 */
  lines: string[];
  /** 按分享人自己的主题画（docs/decisions.md 第 16 条） */
  theme: "sticker" | "cute" | "clean";
}

export type SubscribeResult = Record<string, "accept" | "reject">;

/**
 * 顶部导航要用的尺寸，单位是屏幕上的 CSS px（不是设计稿 px）。
 * 胶囊位置要实测，不能照设计稿写死（.claude/rules/miniapp.md「顶部导航」）。
 */
export interface NavMetrics {
  statusBarHeight: number;
  /** 微信右上角胶囊按钮的位置和大小 */
  menuButton: { top: number; left: number; width: number; height: number };
  windowWidth: number;
  /** 底部安全区（全面屏手机的横条） */
  safeAreaBottom: number;
}

/** 上传的图片用在哪：决定云存储里的目录 */
export type UploadKind = "avatar" | "circle";

/**
 * 只有微信才有的能力都收在这里，H5 预览用假实现，
 * 页面代码不用关心自己跑在小程序里还是浏览器里（见 .claude/rules/miniapp.md）。
 */
export interface Platform {
  /** 云托管调用。首版后端只走这条（docs/decisions.md 第 19 条）。 */
  callContainer(request: ContainerRequest): Promise<ContainerResponse>;
  /** 状态栏、胶囊、安全区，顶部导航和底部导航要用 */
  getNavMetrics(): NavMetrics;
  /**
   * 上传一张图（头像、群头像），返回存进库里的地址（docs/decisions.md 第 23 条）：
   * 正式环境传到云托管对象存储，返回 cloud:// 文件 ID；本地联调传到本机后端。
   */
  uploadImage(tempFilePath: string, kind: UploadKind): Promise<string>;
  /** 打开小程序的《隐私保护指引》 */
  openPrivacyContract(): Promise<void>;
  /** 加载站酷快乐体（docs/decisions.md 第 24 条），返回是否加载成功；失败就用系统字体 */
  loadDisplayFont(): Promise<boolean>;
  /** 分享到微信群。阶段 3 接。 */
  share(payload: SharePayload): Promise<void>;
  /** 申请订阅消息，返回每个模板的结果。阶段 3 接。 */
  requestSubscribe(templateIds: string[]): Promise<SubscribeResult>;
  /** 用画布当场生成 5:4 分享配图，返回临时文件路径。阶段 3 接。 */
  renderShareCard(payload: ShareCardPayload): Promise<string>;
}

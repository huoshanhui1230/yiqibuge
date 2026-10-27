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
 * 只有微信才有的能力都收在这里，H5 预览用假实现，
 * 页面代码不用关心自己跑在小程序里还是浏览器里（见 .claude/rules/miniapp.md）。
 */
export interface Platform {
  /** 云托管调用。首版后端只走这条（docs/decisions.md 第 19 条）。 */
  callContainer(request: ContainerRequest): Promise<ContainerResponse>;
  /** wx.login 拿 code，换登录态。阶段 1 接。 */
  login(): Promise<string>;
  /** 分享到微信群。阶段 3 接。 */
  share(payload: SharePayload): Promise<void>;
  /** 申请订阅消息，返回每个模板的结果。阶段 3 接。 */
  requestSubscribe(templateIds: string[]): Promise<SubscribeResult>;
  /** 用画布当场生成 5:4 分享配图，返回临时文件路径。阶段 3 接。 */
  renderShareCard(payload: ShareCardPayload): Promise<string>;
}

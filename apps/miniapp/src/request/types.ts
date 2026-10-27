/**
 * 注意没有 PATCH：微信的 wx.request / uni.request 只认
 * OPTIONS、GET、HEAD、POST、PUT、DELETE、TRACE、CONNECT，小程序发不出 PATCH。
 * docs/spec.md「核心接口」里写的 PATCH /plans/{id} 要改成 PUT 或者
 * POST /plans/{id}/update —— 阶段 2 做计划编辑前要定下来（见 docs/progress.md 待确认）。
 */
export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

/** 请求层档位，见 src/request/core.ts */
export type ApiMode = "cloud" | "local" | "mock";

export interface RequestOptions {
  /** 接口路径，不带 /api/v1 前缀，例如 "/health" */
  url: string;
  method?: HttpMethod;
  data?: unknown;
  /**
   * 幂等用的 request_id。表态接口必须带（docs/spec.md「核心接口」）。
   * 不传就自动生成一个。
   */
  requestId?: string;
}

/** 后端统一的错误格式，和 apps/server 的 ApiError 一一对应 */
export interface ApiErrorBody {
  code: string;
  message: string;
  requestId?: string;
}

/** message 是后端给的中文提示，可以直接显示给用户 */
export class ApiRequestError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly statusCode: number,
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

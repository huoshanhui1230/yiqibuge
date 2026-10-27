import { mockResponse } from "../mocks";
import { platform } from "../platform";
import {
  ApiRequestError,
  type ApiErrorBody,
  type ApiMode,
  type HttpMethod,
  type RequestOptions,
} from "./types";

/** 和 apps/server 的 API_PREFIX 保持一致 */
export const API_PREFIX = "/api/v1";

/**
 * 请求层三档，由 vite.config.ts 在编译期定下来：
 *   cloud → wx.cloud.callContainer（正式小程序）
 *   local → uni.request 打本机后端（微信开发者工具联调，要关掉「校验合法域名」）
 *   mock  → 本地假数据，不发网络请求（H5 预览、截图走查）
 */
export const apiMode: ApiMode = __API_MODE__;

/** 每个请求带一个 request_id：表态接口靠它做幂等，出错时也好对日志 */
export function newRequestId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

interface RawResponse {
  statusCode: number;
  data: unknown;
}

function unwrap<T>({ statusCode, data }: RawResponse): T {
  if (statusCode >= 200 && statusCode < 300) {
    return data as T;
  }

  const body = data as Partial<ApiErrorBody> | undefined;

  throw new ApiRequestError(
    body?.code ?? "UNKNOWN",
    body?.message ?? "网络不太好，稍后再试。",
    statusCode,
  );
}

function requestLocal(
  path: string,
  method: HttpMethod,
  data: unknown,
  requestId: string,
): Promise<RawResponse> {
  const origin = import.meta.env.VITE_API_BASE || "http://localhost:3000";

  return new Promise<RawResponse>((resolve, reject) => {
    uni.request({
      url: `${origin}${path}`,
      method,
      data: data as Record<string, unknown>,
      header: { "content-type": "application/json", "x-request-id": requestId },
      success: (res) => resolve({ statusCode: res.statusCode, data: res.data }),
      fail: (err) =>
        reject(
          new ApiRequestError(
            "NETWORK",
            `连不上本机后端（${origin}）。先跑 pnpm dev:server；` +
              `在微信开发者工具里还要关掉「校验合法域名」。原因：${err.errMsg}`,
            0,
          ),
        ),
    });
  });
}

export async function request<T>(options: RequestOptions): Promise<T> {
  const requestId = options.requestId ?? newRequestId();
  const method = options.method ?? "GET";
  const path = `${API_PREFIX}${options.url}`;

  if (apiMode === "mock") {
    return mockResponse<T>(options);
  }

  if (apiMode === "cloud") {
    return unwrap<T>(await platform.callContainer({ path, method, data: options.data, requestId }));
  }

  return unwrap<T>(await requestLocal(path, method, options.data, requestId));
}

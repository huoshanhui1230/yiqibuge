// 假数据只给 H5 预览用：编到小程序里时这行和下面 mock 分支都会被条件编译去掉，不进正式包
// #ifdef H5
import { mockResponse } from "../mocks";
// #endif
import { platform } from "../platform";
import { API_PREFIX } from "./constants";
import { FAKE_OPENID_HEADER, devOpenid } from "./dev-identity";
import {
  ApiRequestError,
  type ApiErrorBody,
  type ApiMode,
  type HttpMethod,
  type RequestOptions,
} from "./types";

export { API_PREFIX };

/**
 * 请求层三档，由 vite.config.ts 在编译期定下来：
 *   cloud → wx.cloud.callContainer（正式小程序）
 *   local → uni.request 打本机后端（微信开发者工具联调，要关掉「校验合法域名」）
 *   mock  → 本地假数据，不发网络请求（H5 预览、截图走查）
 */
export const apiMode: ApiMode = __API_MODE__;

/** 后端说「还没建用户」时的错误码，见 apps/server 的 AuthGuard */
const NOT_LOGGED_IN = "NOT_LOGGED_IN";
const AUTH_URL = "/auth/wechat";

/**
 * 每个请求带一个 request_id：表态接口靠它做幂等，出错时也好对日志。
 * 只能是 ASCII —— HTTP 头的值不允许非 Latin-1 字符，带中文会直接发不出去。
 */
export function newRequestId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

let onNotLoggedIn: (() => Promise<void>) | null = null;

/**
 * 登录态由 session 模块管，这里只留一个钩子：收到 NOT_LOGGED_IN 时先让它调一次
 * POST /auth/wechat 建用户，再把原请求重发一次。用钩子是为了不让请求层反过来依赖 session。
 */
export function setNotLoggedInHandler(handler: () => Promise<void>): void {
  onNotLoggedIn = handler;
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
      header: {
        "content-type": "application/json",
        "x-request-id": requestId,
        // 后端用假驱动时按这个头认人（docs/decisions.md 第 22 条）
        [FAKE_OPENID_HEADER]: devOpenid(),
      },
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

async function send<T>(options: RequestOptions, requestId: string): Promise<T> {
  const method = options.method ?? "GET";
  const path = `${API_PREFIX}${options.url}`;

  // #ifdef H5
  if (apiMode === "mock") {
    return mockResponse<T>(options);
  }
  // #endif

  if (apiMode === "cloud") {
    return unwrap<T>(await platform.callContainer({ path, method, data: options.data, requestId }));
  }

  return unwrap<T>(await requestLocal(path, method, options.data, requestId));
}

export async function request<T>(options: RequestOptions): Promise<T> {
  const requestId = options.requestId ?? newRequestId();

  try {
    return await send<T>(options, requestId);
  } catch (error) {
    const retryable =
      error instanceof ApiRequestError &&
      error.code === NOT_LOGGED_IN &&
      options.url !== AUTH_URL &&
      onNotLoggedIn !== null;

    if (!retryable) {
      throw error;
    }

    // 建好用户再重发一次；同一个 request_id，后端幂等
    await onNotLoggedIn!();
    return send<T>(options, requestId);
  }
}

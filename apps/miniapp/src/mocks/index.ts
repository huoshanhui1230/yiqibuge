import { APP_NAME, type HealthResult } from "@yiqi/shared";

import type { RequestOptions } from "../request/types";

/**
 * H5 预览用的假数据。
 * H5 只在开发时用来对照设计稿截图，不连后端，所以每加一个接口就在这里加一条。
 */
function health(): HealthResult {
  return {
    ok: true,
    name: APP_NAME,
    role: "web",
    deps: { db: "up", redis: "up" },
    serverTime: new Date().toISOString(),
    wechatDriver: "fake",
  };
}

const ROUTES: Record<string, () => unknown> = {
  "GET /health": health,
};

export function mockResponse<T>(options: RequestOptions): Promise<T> {
  const key = `${options.method ?? "GET"} ${options.url}`;
  const handler = ROUTES[key];

  if (!handler) {
    return Promise.reject(
      new Error(`H5 预览还没有「${key}」的假数据，去 src/mocks/index.ts 加一条。`),
    );
  }

  return Promise.resolve(handler() as T);
}

import type { HealthResult } from "@yiqi/shared";

import { request } from "./core";

export { API_PREFIX, apiMode, newRequestId, request } from "./core";
export * from "./types";

/**
 * 接口清单。路径和 docs/spec.md「核心接口」对齐，/api/v1 前缀由请求层加。
 * 以后每加一个接口在这里加一行，页面不直接调 request。
 */
export const api = {
  health: (): Promise<HealthResult> => request<HealthResult>({ url: "/health" }),
};

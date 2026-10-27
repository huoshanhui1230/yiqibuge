import { APP_NAME } from "@yiqi/shared";
import { describe, expect, it } from "vitest";

import { mockResponse } from "./index";

describe("H5 预览的假数据", () => {
  it("GET /health 的假数据和真接口字段一致", async () => {
    const result = await mockResponse<{
      ok: boolean;
      name: string;
      deps: { db: string; redis: string };
      serverTime: string;
    }>({ url: "/health" });

    expect(result.ok).toBe(true);
    expect(result.name).toBe(APP_NAME);
    expect(result.deps).toEqual({ db: "up", redis: "up" });
    // 时间一律 UTC
    expect(result.serverTime).toMatch(/Z$/);
  });

  it("没写假数据的接口会报一句能照着做的提示", async () => {
    await expect(mockResponse({ url: "/circles", method: "POST" })).rejects.toThrowError(
      /src\/mocks\/index\.ts/,
    );
  });
});

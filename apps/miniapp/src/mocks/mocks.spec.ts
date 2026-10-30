import { APP_NAME, type CircleSummaryDto, type InvitePreviewDto } from "@yiqi/shared";
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
    await expect(mockResponse({ url: "/plans", method: "POST" })).rejects.toThrowError(
      /src\/mocks\/index\.ts/,
    );
  });

  it("群组列表照设计稿 Groups：四个群，第一个是我当群主的大学室友", async () => {
    const list = await mockResponse<CircleSummaryDto[]>({ url: "/circles" });

    expect(list.map((c) => c.name)).toEqual(["大学室友", "家人群", "羽毛球搭子", "同事群"]);
    expect(list[0]).toMatchObject({ myRole: "owner", memberCount: 8, activePlanCount: 2 });
    expect(list[3]?.pigeonEnabled).toBe(false);
  });

  it("路径里的参数和查询参数都认", async () => {
    const preview = await mockResponse<InvitePreviewDto>({ url: "/invites/preview?code=k7q2m9" });

    expect(preview.status).toBe("ok");
    expect(preview.circle?.name).toBe("大学室友");
  });

  it("业务错误照真接口的样子抛（code + 中文 message）", async () => {
    await expect(mockResponse({ url: "/circles/nope" })).rejects.toMatchObject({
      code: "CIRCLE_NOT_FOUND",
    });
  });
});

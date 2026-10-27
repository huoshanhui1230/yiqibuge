import { describe, expect, it } from "vitest";

import { APP_NAME, LEGACY_APP_NAME } from "./brand";

describe("品牌名称", () => {
  it("正式名称是「一起不鸽」", () => {
    expect(APP_NAME).toBe("一起不鸽");
  });

  it("历史名称和正式名称不同，改名漏替换时这条会挂", () => {
    expect(LEGACY_APP_NAME).not.toBe(APP_NAME);
  });
});

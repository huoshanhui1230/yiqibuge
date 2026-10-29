import { describe, expect, it } from "vitest";

import { FLAKE_TIERS, flakeTierInfo } from "./flake/tiers";
import { DEFAULT_THEME, THEMES, THEME_META, isThemeName } from "./theme";

describe("主题", () => {
  it("三套，默认贴纸风", () => {
    expect(THEMES).toEqual(["sticker", "cute", "clean"]);
    expect(DEFAULT_THEME).toBe("sticker");
  });

  it("每套都有名字和说明", () => {
    for (const theme of THEMES) {
      expect(THEME_META[theme].name).not.toBe("");
      expect(THEME_META[theme].desc).not.toBe("");
    }
  });

  it("只认这三个名字", () => {
    expect(isThemeName("cute")).toBe(true);
    expect(isThemeName("dark")).toBe(false);
    expect(isThemeName(undefined)).toBe(false);
  });
});

describe("鸽值四档", () => {
  it("1 / 2 / 3 / 5（docs/decisions.md 第 4 条）", () => {
    expect(FLAKE_TIERS.map((tier) => tier.points)).toEqual([1, 2, 3, 5]);
    expect(flakeTierInfo("lightning").name).toBe("闪电鸽");
  });
});

import { describe, expect, it } from "vitest";

import { AVATAR_PALETTE_SIZE, avatarColorIndex, avatarLetter } from "./avatar";
import {
  CIRCLE_AVATAR_PRESETS,
  CIRCLE_AVATAR_TINT,
  DEFAULT_PRESET_BY_TYPE,
  isPresetAvatarString,
  parseCircleAvatar,
  presetAvatar,
} from "./circle/avatar";
import { CIRCLE_TYPES } from "./circle/types";

describe("字母头像底色", () => {
  it("同一个 id 永远是同一个颜色（前后端、三套主题都一样）", () => {
    expect(avatarColorIndex("1")).toBe(4);
    expect(avatarColorIndex("2")).toBe(5);
    expect(avatarColorIndex("42")).toBe(3);
    expect(avatarColorIndex("42")).toBe(avatarColorIndex("42"));
  });

  it("下标在 0–7 之间，8 个颜色都用得上", () => {
    const used = new Set<number>();

    for (let id = 1; id <= 500; id += 1) {
      const index = avatarColorIndex(String(id));
      expect(index).toBeGreaterThanOrEqual(0);
      expect(index).toBeLessThan(AVATAR_PALETTE_SIZE);
      used.add(index);
    }

    expect(used.size).toBe(AVATAR_PALETTE_SIZE);
  });
});

describe("字母头像上的字", () => {
  it("取名字的第一个字", () => {
    expect(avatarLetter("阿杰")).toBe("阿");
    expect(avatarLetter("Amy")).toBe("A");
  });

  it("emoji 开头就用那个 emoji，不会切成半个", () => {
    expect(avatarLetter("🍲火锅")).toBe("🍲");
  });

  it("先去掉首尾空白", () => {
    expect(avatarLetter("  小王")).toBe("小");
  });

  it("空名字用「?」", () => {
    expect(avatarLetter("")).toBe("?");
    expect(avatarLetter("   ")).toBe("?");
  });
});

describe("群头像", () => {
  it("预设写成 preset:<key>，能解析回来", () => {
    expect(presetAvatar("dorm")).toBe("preset:dorm");
    expect(parseCircleAvatar("preset:family")).toEqual({ kind: "preset", preset: "family" });
  });

  it("认不出来的预设退回校舍，免得页面上空一块", () => {
    expect(parseCircleAvatar("preset:nope")).toEqual({ kind: "preset", preset: "dorm" });
    expect(isPresetAvatarString("preset:nope")).toBe(false);
  });

  it("不是预设的就是图片地址", () => {
    expect(parseCircleAvatar("cloud://env-1/circle/1.jpg")).toEqual({
      kind: "image",
      url: "cloud://env-1/circle/1.jpg",
    });
  });

  it("每个预设都有底色，每种群类型都有默认预设", () => {
    for (const preset of CIRCLE_AVATAR_PRESETS) {
      expect(CIRCLE_AVATAR_TINT[preset]).toBeDefined();
    }
    for (const type of CIRCLE_TYPES) {
      expect(CIRCLE_AVATAR_PRESETS).toContain(DEFAULT_PRESET_BY_TYPE[type]);
    }
  });
});

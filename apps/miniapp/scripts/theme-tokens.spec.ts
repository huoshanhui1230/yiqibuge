import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import {
  lookup,
  pxToRpx,
  resolveTheme,
  retintShadow,
  runtimeMeta,
  splitPattern,
  toLength,
  type ThemeKey,
  type ThemeTokens,
} from "./theme-tokens";

describe("px 换成 rpx（设计稿 390 宽，乘 750/390）", () => {
  it("单个数值", () => {
    expect(pxToRpx("20px")).toBe("38.46rpx");
    expect(pxToRpx("39px")).toBe("75rpx");
  });

  it("复合值里每个 px 都换", () => {
    expect(pxToRpx("2.5px solid #2A1E16")).toBe("4.81rpx solid #2A1E16");
    expect(pxToRpx("4px 4px 0 #2A1E16")).toBe("7.69rpx 7.69rpx 0 #2A1E16");
  });

  it("1px 细线保持 px，免得在窄屏上换算成不到 1 个物理像素", () => {
    expect(pxToRpx("1px solid #ECE9E4")).toBe("1px solid #ECE9E4");
    expect(pxToRpx("0 1px 2px rgba(28,27,25,0.04)")).toBe("0 1px 3.85rpx rgba(28,27,25,0.04)");
  });

  it("999px 胶囊圆角保持原样", () => {
    expect(pxToRpx("999px")).toBe("999px");
  });

  it("百分比、颜色、none 不动", () => {
    expect(pxToRpx("50%")).toBe("50%");
    expect(pxToRpx("none")).toBe("none");
    expect(pxToRpx("#FF5B3A")).toBe("#FF5B3A");
  });

  it("数字当作设计稿 px", () => {
    expect(toLength(14)).toBe("26.92rpx");
    expect(toLength("50%")).toBe("50%");
  });
});

describe("取值和小工具", () => {
  const theme: ThemeTokens = { chip: { danger: ["#FDECE8", "#B8321A"] }, color: { bg: "#FFF" } };

  it("按路径取值，数组用下标", () => {
    expect(lookup(theme, "color.bg")).toBe("#FFF");
    expect(lookup(theme, "chip.danger.1")).toBe("#B8321A");
    expect(lookup(theme, "chip.nope.0")).toBeUndefined();
  });

  it("软糖风按底色换投影颜色；none 还是 none", () => {
    expect(retintShadow("0 3px 0 #F4C2CE", "#E2708E")).toBe("0 3px 0 #E2708E");
    expect(retintShadow("3px 3px 0 #2A1E16", "#2A1E16")).toBe("3px 3px 0 #2A1E16");
    expect(retintShadow("none", "#E2708E")).toBe("none");
    expect(retintShadow("0 3px 0 #F4C2CE", "none")).toBe("none");
  });

  it("小圆点底纹拆成图案和尺寸", () => {
    expect(splitPattern("radial-gradient(#FFD3DD 1.5px, transparent 1.8px) / 20px 20px")).toEqual({
      image: "radial-gradient(#FFD3DD 1.5px, transparent 1.8px)",
      size: "20px 20px",
    });
    expect(splitPattern(undefined)).toEqual({ image: "none", size: "auto" });
  });
});

describe("用真的 tokens.json 生成", () => {
  const tokens = JSON.parse(
    readFileSync(resolve(import.meta.dirname, "../../../docs/design/tokens.json"), "utf8"),
  ) as { themes: Record<ThemeKey, ThemeTokens> };
  const resolved = {
    sticker: resolveTheme("sticker", tokens.themes.sticker),
    cute: resolveTheme("cute", tokens.themes.cute),
    clean: resolveTheme("clean", tokens.themes.clean),
  };
  const value = (key: ThemeKey, name: string) => new Map(resolved[key].vars).get(`--yq-${name}`);

  it("三套主题一个角色都不缺", () => {
    expect(resolved.sticker.missing).toEqual([]);
    expect(resolved.cute.missing).toEqual([]);
    expect(resolved.clean.missing).toEqual([]);
  });

  it("三套主题的变量名完全一样，组件只认这一套", () => {
    const names = (key: ThemeKey) => resolved[key].vars.map(([name]) => name);

    expect(names("cute")).toEqual(names("sticker"));
    expect(names("clean")).toEqual(names("sticker"));
  });

  it("清爽风的标签取浅底深字，贴纸风取彩色底", () => {
    expect(value("clean", "chip-danger-bg")).toBe("#FDECE8");
    expect(value("sticker", "chip-danger-bg")).toBe("#FF5B3A");
  });

  it("清爽风没有描边：outline 当颜色用时是透明", () => {
    expect(value("clean", "color-outline")).toBe("transparent");
    expect(value("clean", "border-card")).toBe("none");
  });

  it("清爽风标题按阶梯缩小，贴纸风原样", () => {
    expect(value("sticker", "size-display-26")).toBe("50rpx");
    expect(value("clean", "size-display-26")).toBe("40.38rpx");
  });

  it("软糖风按钮用快乐体、字号多 1.5", () => {
    expect(value("cute", "font-button-family")).toMatch(/^"ZCOOL KuaiLe"/);
    expect(value("cute", "font-button-delta")).toBe("2.88rpx");
    // 0 算进「1px 以内不换算」，留着 0px，放进 calc() 一样能用
    expect(value("sticker", "font-button-delta")).toBe("0px");
  });

  it("软糖风主按钮的投影是深粉，清爽风没有投影", () => {
    expect(value("cute", "shadow-primary-md")).toBe("0 5.77rpx 0 #E2708E");
    expect(value("clean", "shadow-primary-md")).toBe("none");
  });

  it("字母头像底色和字色：清爽风是成对的，贴纸风字色统一", () => {
    expect(value("clean", "avatar-4-bg")).toBe("#FFE4DC");
    expect(value("clean", "avatar-4-fg")).toBe("#B23A1E");
    expect(value("sticker", "avatar-4-fg")).toBe("#2A1E16");
  });

  it("JS 用的常量：底色、头像描边比例、底栏几何", () => {
    expect(runtimeMeta(tokens.themes.cute)).toEqual({
      bg: "#FFF1F3",
      avatarRingRatio: 0.058,
      tabbar: { floating: true, height: 62, inset: 12, paddingBottom: 0 },
    });
  });
});

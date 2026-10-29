/**
 * 生成图标（定义在 icons.ts）：
 * - src/styles/icons.css：单色线性图标，每套主题一组 CSS 变量 --yq-icon-<名字>，值是 base64 的 SVG。
 *   组件 YqIcon 拿它当 mask，底色用 currentColor，所以图标颜色跟文字色走。
 *   用变量而不是按主题写类名：主题选择页里会把别的主题嵌在当前主题里预览，变量按最近的祖先取值，类名做不到。
 * - src/static/themes/<主题>/tile-<预设>.svg、dove.svg、cape.svg：带颜色的小图，每套主题一个文件。
 *
 * 跑：pnpm -F @yiqi/miniapp gen:art（先抽插画，再跑这个）
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  ART_COLORS,
  CLEAN_STROKE_RATIO,
  MONO_ICONS,
  TILE_ICONS,
  capeSvg,
  doveSvg,
  type ThemeKey,
} from "./icons";

const THEMES: ThemeKey[] = ["sticker", "cute", "clean"];
const CSS_PATH = resolve(import.meta.dirname, "../src/styles/icons.css");
const STATIC_DIR = resolve(import.meta.dirname, "../src/static/themes");

/** 和 themes.css 一样：贴纸风同时挂在 page 上当默认值 */
const SELECTORS: Record<ThemeKey, string> = {
  sticker: "page,\n.yq-theme-sticker",
  cute: ".yq-theme-cute",
  clean: ".yq-theme-clean",
};

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function monoSvg(theme: ThemeKey, name: string): string {
  const icon = MONO_ICONS[name]!;
  const override = icon.themes?.[theme];
  const body = override?.body ?? icon.body;
  const stroke =
    override?.stroke ?? (theme === "clean" ? round(icon.stroke * CLEAN_STROKE_RATIO) : icon.stroke);

  // mask 只看透明度，颜色随便写；颜色由 YqIcon 的 background-color 决定
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#000" ` +
    `stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`
  );
}

function dataUri(svg: string): string {
  return `url("data:image/svg+xml;base64,${Buffer.from(svg, "utf8").toString("base64")}")`;
}

function main(): void {
  const blocks = THEMES.map((theme) => {
    const lines = Object.keys(MONO_ICONS).map(
      (name) => `  --yq-icon-${name}: ${dataUri(monoSvg(theme, name))};`,
    );
    return `${SELECTORS[theme]} {\n${lines.join("\n")}\n}`;
  });

  writeFileSync(
    CSS_PATH,
    [
      "/* 由 scripts/gen-icons.ts 生成，不要手改。重新生成：pnpm -F @yiqi/miniapp gen:art",
      "   单色线性图标，组件 YqIcon 拿它们当 mask，颜色跟文字色走。 */",
      "",
      ...blocks,
      "",
    ].join("\n"),
    "utf8",
  );

  for (const theme of THEMES) {
    const colors = ART_COLORS[theme];
    const dir = resolve(STATIC_DIR, theme);
    mkdirSync(dir, { recursive: true });

    for (const [preset, draw] of Object.entries(TILE_ICONS)) {
      writeFileSync(
        resolve(dir, `tile-${preset}.svg`),
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${colors.line}" ` +
          `stroke-width="${colors.stroke}" stroke-linecap="round" stroke-linejoin="round">${draw(colors)}</svg>\n`,
        "utf8",
      );
    }

    writeFileSync(
      resolve(dir, "dove.svg"),
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">${doveSvg(colors, theme === "clean")}</svg>\n`,
      "utf8",
    );
    writeFileSync(
      resolve(dir, "cape.svg"),
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">${capeSvg(colors)}</svg>\n`,
      "utf8",
    );
  }

  console.log(
    `已生成 ${Object.keys(MONO_ICONS).length} 个线性图标的变量（${CSS_PATH}），` +
      `以及每套主题 ${Object.keys(TILE_ICONS).length} 个群头像图标、白鸽和披风`,
  );
}

main();

/**
 * 由 docs/design/tokens.json 生成三套主题的 CSS 变量，以及 JS 要用的几个主题常量。
 * 跑：pnpm -F @yiqi/miniapp gen:theme
 *
 * tokens.json 是唯一的样式来源（见 .claude/rules/miniapp.md）：改样式去改它再重新生成，
 * 组件和页面只用 var(--yq-*)，不写死颜色、圆角、阴影、字体。
 * 「哪个角色取哪个 token」和 px→rpx 的换算在 theme-tokens.ts，那里有测试。
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import {
  resolveTheme,
  runtimeMeta,
  type ThemeKey,
  type ThemeRuntimeMeta,
  type ThemeTokens,
} from "./theme-tokens";

const TOKENS_PATH = resolve(import.meta.dirname, "../../../docs/design/tokens.json");
const CSS_PATH = resolve(import.meta.dirname, "../src/styles/themes.css");
const META_PATH = resolve(import.meta.dirname, "../src/theme/theme-meta.generated.ts");

/** 贴纸风是默认主题，同时挂到 page 上，这样没套主题类的地方也有合理默认值 */
const SELECTORS: Record<ThemeKey, string> = {
  sticker: "page,\n.yq-theme-sticker",
  cute: ".yq-theme-cute",
  clean: ".yq-theme-clean",
};

function main(): void {
  const tokens = JSON.parse(readFileSync(TOKENS_PATH, "utf8")) as {
    themes: Record<ThemeKey, ThemeTokens>;
  };
  const keys = Object.keys(SELECTORS) as ThemeKey[];
  const problems: string[] = [];
  const blocks: string[] = [];
  const meta = {} as Record<ThemeKey, ThemeRuntimeMeta>;
  let firstNames: string[] | null = null;

  for (const key of keys) {
    const theme = tokens.themes[key];
    const { vars, missing } = resolveTheme(key, theme);

    for (const name of missing) {
      problems.push(
        `${key} 缺 ${name}：去 tokens.json 补上，或者检查 scripts/theme-tokens.ts 的角色表`,
      );
    }

    const names = vars.map(([name]) => name);
    firstNames ??= names;
    if (names.join() !== firstNames.join()) {
      problems.push(`${key} 生成的变量和第一套主题对不上`);
    }

    const label = typeof theme.name === "string" ? theme.name : key;
    blocks.push(
      `/* ${label} */\n${SELECTORS[key]} {\n${vars.map(([name, value]) => `  ${name}: ${value};`).join("\n")}\n}`,
    );
    meta[key] = runtimeMeta(theme);
  }

  if (problems.length > 0) {
    console.error(`主题变量没有生成：\n${problems.map((line) => `  - ${line}`).join("\n")}`);
    process.exit(1);
  }

  const css = [
    "/* 由 docs/design/tokens.json 生成，不要手改。",
    "   重新生成：pnpm -F @yiqi/miniapp gen:theme",
    "   组件和页面只用 var(--yq-*)，不写死颜色、圆角、阴影、字体。尺寸已按 750/390 换成 rpx。 */",
    "",
    ...blocks,
    "",
  ].join("\n");

  const ts = [
    "// 由 docs/design/tokens.json 生成，不要手改。重新生成：pnpm -F @yiqi/miniapp gen:theme",
    "// JS 读不到 CSS 变量，这里放 JS 要用的几个值（尺寸是设计稿 px）。",
    'import type { ThemeName } from "@yiqi/shared";',
    "",
    "export interface ThemeRuntimeMeta {",
    "  bg: string;",
    "  avatarRingRatio: number;",
    "  tabbar: { floating: boolean; height: number; inset: number; paddingBottom: number };",
    "}",
    "",
    `export const THEME_RUNTIME: Record<ThemeName, ThemeRuntimeMeta> = ${JSON.stringify(meta, null, 2)};`,
    "",
  ].join("\n");

  mkdirSync(dirname(CSS_PATH), { recursive: true });
  mkdirSync(dirname(META_PATH), { recursive: true });
  writeFileSync(CSS_PATH, css, "utf8");
  writeFileSync(META_PATH, ts, "utf8");

  console.log(
    `已生成 ${CSS_PATH}（${keys.length} 套主题，每套 ${firstNames?.length ?? 0} 个变量）和 ${META_PATH}`,
  );
}

main();

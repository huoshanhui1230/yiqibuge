/**
 * 由 docs/design/tokens.json 生成三套主题的 CSS 变量。
 * 跑：pnpm -F @yiqi/miniapp gen:theme
 *
 * tokens.json 是唯一的样式来源（见 .claude/rules/miniapp.md）：改样式去改它再重新生成，
 * 组件和页面只用 var(--yq-*)，不写死颜色、圆角、阴影、字体。
 *
 * 注意：这里按 tokens.json 原样输出 px。设计稿按 390 宽画，落到小程序要换成 rpx（乘 750/390），
 * 但 border 和 shadow 的值是「2.5px solid #2A1E16」这种复合字符串，要解析里面的 px 才能换。
 * 阶段 1 做主题系统时定下怎么换，结论记进 docs/progress.md。
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

type Json = string | number | boolean | null | Json[] | { [key: string]: Json };
type Theme = Record<string, Json>;

const TOKENS_PATH = resolve(import.meta.dirname, "../../../docs/design/tokens.json");
const OUT_PATH = resolve(import.meta.dirname, "../src/styles/themes.css");

/** tokens.json 里给人看的说明文字，不生成变量 */
const PROSE_KEYS = new Set(["_说明", "displayUse", "illustration", "name"]);

/** 贴纸风是默认主题，同时挂到 page 上，这样没套主题类的地方也有合理默认值 */
const SELECTORS: Record<string, string> = {
  sticker: "page,\n.yq-theme-sticker",
  cute: ".yq-theme-cute",
  clean: ".yq-theme-clean",
};

function kebab(key: string): string {
  return key.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}

function asRecord(value: Json | undefined): Record<string, Json> {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value : {};
}

function varsFor(theme: Theme): string[] {
  const lines: string[] = [];
  const push = (name: string, value: string): void => {
    lines.push(`  --yq-${name}: ${value};`);
  };

  for (const [key, value] of Object.entries(asRecord(theme.color))) {
    if (!PROSE_KEYS.has(key)) push(`color-${kebab(key)}`, String(value));
  }

  // 清爽风的标签和横幅是「浅色底 + 深色字」成对出现的
  for (const [key, value] of Object.entries(asRecord(theme.chip))) {
    if (PROSE_KEYS.has(key) || !Array.isArray(value)) continue;
    push(`chip-${kebab(key)}-bg`, String(value[0]));
    push(`chip-${kebab(key)}-fg`, String(value[1]));
  }

  for (const [key, value] of Object.entries(asRecord(theme.banner))) {
    if (!PROSE_KEYS.has(key)) push(`banner-${kebab(key)}`, String(value));
  }

  // 头像底色按用户 id 稳定取下标，三套主题用同一个下标（tokens.json 的 avatarMapping）
  if (Array.isArray(theme.avatar)) {
    theme.avatar.forEach((entry, index) => {
      if (Array.isArray(entry)) {
        push(`avatar-${index + 1}-bg`, String(entry[0]));
        push(`avatar-${index + 1}-fg`, String(entry[1]));
      } else {
        push(`avatar-${index + 1}-bg`, String(entry));
      }
    });
  }
  if (typeof theme.avatarText === "string") {
    push("avatar-text", theme.avatarText);
  }

  for (const group of ["border", "shadow"] as const) {
    for (const [key, value] of Object.entries(asRecord(theme[group]))) {
      if (!PROSE_KEYS.has(key)) push(`${group}-${kebab(key)}`, String(value));
    }
  }

  for (const [key, value] of Object.entries(asRecord(theme.radius))) {
    if (PROSE_KEYS.has(key)) continue;
    push(`radius-${kebab(key)}`, typeof value === "number" ? `${value}px` : String(value));
  }

  for (const [key, value] of Object.entries(asRecord(theme.font))) {
    if (PROSE_KEYS.has(key)) continue;

    // 清爽风有 weightMap：把设计稿里的字重映射到这套主题实际用的字重
    if (key === "weightMap") {
      for (const [from, to] of Object.entries(asRecord(value))) {
        push(`font-weight-${from}`, String(to));
      }
      continue;
    }

    // 字体名带空格要加引号，再兜一个无衬线
    if (key === "display" || key === "body" || key === "logo") {
      push(`font-${key}`, `"${String(value)}", sans-serif`);
      continue;
    }

    push(`font-${kebab(key)}`, String(value));
  }

  return lines;
}

function main(): void {
  const tokens = JSON.parse(readFileSync(TOKENS_PATH, "utf8")) as { themes: Record<string, Theme> };

  const blocks = Object.entries(tokens.themes).map(([key, theme]) => {
    const selector = SELECTORS[key] ?? `.yq-theme-${key}`;
    const label = typeof theme.name === "string" ? theme.name : key;

    return `/* ${label} */\n${selector} {\n${varsFor(theme).join("\n")}\n}`;
  });

  const css = [
    "/* 由 docs/design/tokens.json 生成，不要手改。",
    "   重新生成：pnpm -F @yiqi/miniapp gen:theme",
    "   组件和页面只用 var(--yq-*)，不写死颜色、圆角、阴影、字体。 */",
    "",
    ...blocks,
    "",
  ].join("\n");

  mkdirSync(dirname(OUT_PATH), { recursive: true });
  writeFileSync(OUT_PATH, css, "utf8");

  console.log(`已生成 ${OUT_PATH}（${Object.keys(tokens.themes).length} 套主题）`);
}

main();

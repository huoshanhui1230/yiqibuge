/**
 * 从设计稿 HTML 的 <symbol> 里抽出插画，三套主题各一份，写成独立的 SVG 文件。
 * 跑：pnpm -F @yiqi/miniapp gen:art
 *
 * 小程序页面里不能直接写 <svg>，<image> 可以显示 SVG 文件（.claude/rules/miniapp.md「主题」）。
 * 产物：src/static/themes/<主题>/<id>.svg，和 src/theme/illustrations.generated.ts（名字清单）。
 *
 * 同一个 id 在不同页面里有时画法略有不同（小尺寸页面用的简化版）：
 * 取风格说明板 Main 里那份，Main 没有就取用得最多的那份，被舍弃的版本打印出来。
 */
import { createHash } from "node:crypto";
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const THEMES = ["sticker", "cute", "clean"] as const;
type Theme = (typeof THEMES)[number];

const HTML_DIR = resolve(import.meta.dirname, "../../../docs/design/html");
const OUT_DIR = resolve(import.meta.dirname, "../src/static/themes");
const MANIFEST_PATH = resolve(import.meta.dirname, "../src/theme/illustrations.generated.ts");

/**
 * 主题选择页为了把三套画在同一页，给每套另起了 id（gg-s、dango、hoodc-back…），
 * 内容和各主题自己的 gg、hood-back 是同一份，不重复导出。
 * capsule 是微信胶囊按钮的示意，不是插画。
 */
const SKIP = new Set([
  "gg-s",
  "dango",
  "pigeonm",
  "hood-s-back",
  "hood-s-front",
  "crown-s",
  "hoodc-back",
  "hoodc-front",
  "crownc",
  "hoodm-back",
  "hoodm-front",
  "crownm",
  "capsule",
]);

interface Variant {
  viewBox: string;
  body: string;
  pages: string[];
}

function digest(text: string): string {
  return createHash("md5").update(text).digest("hex").slice(0, 8);
}

/** 读一套主题所有页面的 symbol：id → 不同画法 → 出现在哪些页面 */
function collect(theme: Theme): Map<string, Map<string, Variant>> {
  const byId = new Map<string, Map<string, Variant>>();
  const dir = resolve(HTML_DIR, theme);

  for (const file of readdirSync(dir).filter((name) => name.endsWith(".html"))) {
    const page = file.replace(/\.html$/, "");
    const html = readFileSync(resolve(dir, file), "utf8");

    for (const match of html.matchAll(
      /<symbol id="([^"]+)" viewBox="([^"]+)">([\s\S]*?)<\/symbol>/g,
    )) {
      const [, id, viewBox, rawBody] = match;
      if (!id || !viewBox || rawBody === undefined || SKIP.has(id)) continue;

      const body = rawBody.trim();
      const variants = byId.get(id) ?? new Map<string, Variant>();
      const key = digest(`${viewBox}|${body}`);
      const variant = variants.get(key) ?? { viewBox, body, pages: [] };

      variant.pages.push(page);
      variants.set(key, variant);
      byId.set(id, variants);
    }
  }

  return byId;
}

function pick(variants: Map<string, Variant>): Variant {
  const all = [...variants.values()];
  const fromMain = all.find((variant) => variant.pages.includes("Main"));

  return fromMain ?? all.sort((a, b) => b.pages.length - a.pages.length)[0]!;
}

function toSvgFile({ viewBox, body }: Variant): string {
  if (body.includes("<use")) {
    throw new Error("symbol 里又引用了别的 symbol，独立 SVG 文件显示不了，要先展开");
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">${body}</svg>\n`;
}

function main(): void {
  const names = new Set<string>();
  const notes: string[] = [];

  // 不清空目录：gen-icons.ts 也往这里写群头像图标块、白鸽和披风
  for (const theme of THEMES) {
    const outDir = resolve(OUT_DIR, theme);
    mkdirSync(outDir, { recursive: true });

    for (const [id, variants] of collect(theme)) {
      const chosen = pick(variants);
      writeFileSync(resolve(outDir, `${id}.svg`), toSvgFile(chosen), "utf8");
      names.add(id);

      for (const variant of variants.values()) {
        if (variant !== chosen) {
          notes.push(`${theme}/${id}：没用 ${variant.pages.join("、")} 里的简化版`);
        }
      }
    }
  }

  // 页面只能用三套主题都有的插画，少一套页面上就会空一块。
  // 只有某一套才有的（软糖风的心心和星星、清爽风首页的极简鸽屎）是那套主题特有的点缀，照样导出，
  // 但不进名字清单，用到它们的页面（阶段 2、3 的首页、揭晓页）要按主题单独处理。
  const perTheme = THEMES.map(
    (theme) =>
      new Set(readdirSync(resolve(OUT_DIR, theme)).map((file) => file.replace(/\.svg$/, ""))),
  );
  const sorted = [...names].filter((name) => perTheme.every((files) => files.has(name))).sort();
  const extras = [...names].filter((name) => !sorted.includes(name)).sort();
  const manifest = [
    "// 由 scripts/extract-illustrations.ts 从设计稿 <symbol> 生成，不要手改。",
    "// 重新生成：pnpm -F @yiqi/miniapp gen:art",
    "",
    "/** 每套主题都有的插画，文件在 /static/themes/<主题>/<名字>.svg */",
    `export const ILLUSTRATIONS = ${JSON.stringify(sorted)} as const;`,
    "",
    "export type IllustrationName = (typeof ILLUSTRATIONS)[number];",
    "",
  ].join("\n");

  mkdirSync(dirname(MANIFEST_PATH), { recursive: true });
  writeFileSync(MANIFEST_PATH, manifest, "utf8");

  console.log(`已导出 ${sorted.length} 个插画 × ${THEMES.length} 套主题：${sorted.join("、")}`);
  if (extras.length > 0) {
    console.log(`只有部分主题才有、没进名字清单的：${extras.join("、")}`);
  }
  if (notes.length > 0) {
    console.log(`同名的其它画法（取了 Main 或用得最多的那份）：\n  ${notes.join("\n  ")}`);
  }
}

main();

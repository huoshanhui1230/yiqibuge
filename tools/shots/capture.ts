/**
 * 给 H5 预览截图，三套主题各一张，供 /design-check 对照设计稿。
 *
 * 跑：pnpm shots（要先 pnpm dev:h5 把预览起起来）
 * 第一次用先装浏览器：pnpm -F @yiqi/tools-shots install:browser
 *
 * 产物在 .shots/<主题>/<页面>.png，不入库——走查时现生成，
 * 设计稿基准图在 docs/design/png/<主题>/，那个才是入库的。
 */
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

import { chromium, type Page } from "playwright";

import { TARGETS, THEMES, VIEWPORT, type Theme } from "./shots.config";

const BASE_URL = process.env.SHOTS_BASE_URL ?? "http://localhost:5173";
const OUT_DIR = resolve(import.meta.dirname, "../../.shots");

/**
 * 切主题：给页面根节点换掉 yq-theme-* 类。
 * 阶段 1 接了主题 store 之后改成走 store，现在直接改 class 就够截图用。
 */
async function applyTheme(page: Page, theme: Theme): Promise<void> {
  await page.evaluate((name) => {
    for (const element of document.querySelectorAll('[class*="yq-theme-"]')) {
      element.className = element.className.replace(/yq-theme-[a-z]+/g, `yq-theme-${name}`);
    }
  }, theme);
}

async function main(): Promise<void> {
  const browser = await chromium.launch();

  try {
    const context = await browser.newContext({
      viewport: VIEWPORT,
      // 设计稿截图是 1 倍图，这里也用 1 倍，方便逐像素对照
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();
    const written: string[] = [];

    for (const target of TARGETS) {
      // uni-app 的 H5 默认走 hash 路由
      await page.goto(`${BASE_URL}/#${target.route}`, { waitUntil: "networkidle" });
      // 等首屏渲染和入场动效落定
      await page.waitForTimeout(400);

      for (const theme of THEMES) {
        await applyTheme(page, theme);
        await page.waitForTimeout(100);

        const dir = resolve(OUT_DIR, theme);
        mkdirSync(dir, { recursive: true });

        const file = resolve(dir, `${target.name}.png`);
        await page.screenshot({ path: file });
        written.push(file);
      }
    }

    console.log(`截了 ${written.length} 张：`);
    for (const file of written) {
      console.log(`  ${file}`);
    }
  } finally {
    await browser.close();
  }
}

main().catch((error: unknown) => {
  console.error("截图失败：", error instanceof Error ? error.message : error);
  console.error(
    "检查两件事：pnpm dev:h5 在跑吗；浏览器装了吗（pnpm -F @yiqi/tools-shots install:browser）。",
  );
  process.exit(1);
});

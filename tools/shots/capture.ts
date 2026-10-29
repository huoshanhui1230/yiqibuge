/**
 * 给 H5 预览截图，三套主题各一张，供 /design-check 对照设计稿。
 *
 * 跑：pnpm shots（要先 pnpm dev:h5 把预览起起来）；只截其中几个：pnpm shots Main GroupHome
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

/** 切主题走主题 store（H5 开发模式下挂在 window 上的钩子），和用户点「换成软糖风」是同一条路 */
async function applyTheme(page: Page, theme: Theme): Promise<void> {
  const ok = await page.evaluate((name) => {
    const setTheme = (window as unknown as { __yqSetTheme?: (theme: string) => void }).__yqSetTheme;
    if (!setTheme) return false;
    setTheme(name);
    return true;
  }, theme);

  if (!ok) {
    throw new Error("页面上没有 __yqSetTheme：确认是 pnpm dev:h5 起的开发模式预览");
  }
}

/** 等字体和插画都加载完：主题一换，插画的地址就变了 */
async function settle(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  await page.waitForFunction(() => Array.from(document.images).every((img) => img.complete));
  await page.waitForTimeout(250);
}

async function main(): Promise<void> {
  const wanted = process.argv.slice(2);
  const targets = wanted.length > 0 ? TARGETS.filter((t) => wanted.includes(t.name)) : TARGETS;

  if (targets.length === 0) {
    throw new Error(`shots.config.ts 里没有 ${wanted.join("、")}，先在 TARGETS 里加一行`);
  }

  const browser = await chromium.launch();

  try {
    const written: string[] = [];

    for (const target of targets) {
      const context = await browser.newContext({
        viewport: target.viewport ?? VIEWPORT,
        // 设计稿截图是 1 倍图，这里也用 1 倍，方便逐像素对照
        deviceScaleFactor: 1,
      });
      const page = await context.newPage();
      const query = target.query ? `?${target.query}` : "";

      // uni-app 的 H5 默认走 hash 路由
      await page.goto(`${BASE_URL}/#${target.route}${query}`, { waitUntil: "networkidle" });
      await settle(page);

      for (const theme of THEMES) {
        await applyTheme(page, theme);
        await settle(page);

        const dir = resolve(OUT_DIR, theme);
        mkdirSync(dir, { recursive: true });

        const file = resolve(dir, `${target.name}.png`);
        await page.screenshot({ path: file });
        written.push(file);
      }

      await context.close();
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

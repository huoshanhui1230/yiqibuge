/** 三套主题，名字和 docs/design/html/<主题>/ 的目录名一致 */
export const THEMES = ["sticker", "cute", "clean"] as const;
export type Theme = (typeof THEMES)[number];

/** 手机页面按 390 × 844 画，截 1 倍图（docs/design/README.md） */
export const VIEWPORT = { width: 390, height: 844 };

export interface ShotTarget {
  /** 设计稿文件名，例如 Home、PlanDetail，对着 docs/design/README.md 的表取 */
  name: string;
  /** H5 预览里的路由，和 apps/miniapp/src/pages.json 对应 */
  route: string;
}

/**
 * 要截的页面。
 * 第 0 步只有首页；阶段 1 起每做完一个页面就往这里加一行，/design-check 才截得到。
 */
export const TARGETS: ShotTarget[] = [{ name: "Index", route: "/pages/index/index" }];

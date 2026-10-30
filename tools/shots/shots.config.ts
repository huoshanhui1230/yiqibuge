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
  /** 路由参数，例如 "id=c-dorm&tab=board"（H5 预览走假数据，id 是 src/mocks 里的） */
  query?: string;
  /** 不传就是手机尺寸；风格说明板 Main 是 1240 宽 */
  viewport?: { width: number; height: number };
}

/**
 * 要截的页面。每做完一个页面就往这里加一行，/design-check 才截得到。
 * 只截其中几个：pnpm shots Main GroupHome
 */
export const TARGETS: ShotTarget[] = [
  { name: "Main", route: "/pages/dev/components", viewport: { width: 1240, height: 844 } },
  { name: "Login", route: "/pages/login/index" },
  { name: "Groups", route: "/pages/main/index", query: "tab=groups" },
  { name: "GroupHome", route: "/pages/circle/home", query: "id=c-dorm&tab=board" },
  { name: "GroupSettings", route: "/pages/circle/settings", query: "id=c-dorm" },
  { name: "Invite", route: "/pages/circle/invite", query: "id=c-dorm" },
  { name: "JoinLanding", route: "/pages/join/index", query: "t=mockInviteTokenDorm00A&from=u-jie-9" },
  // 设计稿画的是「选中了下一套、还没换」的样子
  { name: "ThemePicker", route: "/pages/settings/theme", query: "preview=next" },
];

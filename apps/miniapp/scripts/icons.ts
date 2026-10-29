/**
 * 图标的来源：从设计稿 HTML 里的内联 SVG 摘出来（它们不是 <symbol>，抽插画的脚本拿不到）。
 * gen-icons.ts 用这里的定义生成两类东西：
 *
 * 1. 单色线性图标（返回、加号、钥匙、底部导航…）→ CSS mask，颜色跟着文字色走，一份图形三套主题都能用；
 *    三套主题的差别只在线宽（清爽风细一号）和底部导航的造型（软糖风、清爽风是圆角版）。
 * 2. 带颜色的小图（群头像图标、和平周白鸽、月度鸽王披风）→ 每套主题一个 SVG 文件，颜色写死在文件里。
 */
export type ThemeKey = "sticker" | "cute" | "clean";

/** 清爽风的线条比贴纸风细：设计稿里 2 → 1.64、2.5 → 2.05、3 → 2.46，统一按 0.82 */
export const CLEAN_STROKE_RATIO = 0.82;

export interface MonoIcon {
  /** 24×24 画布里的图形，不写颜色 */
  body: string;
  stroke: number;
  /** 某套主题造型或线宽不一样时覆盖 */
  themes?: Partial<Record<ThemeKey, { body?: string; stroke?: number }>>;
}

// 底部导航：贴纸风是直角版；软糖风、清爽风是圆角版（Groups 三套设计稿）
const NAV_ROUND = {
  home: '<path d="M3.5 11 12 4l8.5 7v8.5a1 1 0 0 1-1 1h-4.5v-5.5h-6v5.5H4.5a1 1 0 0 1-1-1z"/>',
  calendar:
    '<rect x="3.5" y="5" width="17" height="15.5" rx="4"/><path d="M8 3v4M16 3v4M3.5 10h17"/>',
  groups:
    '<circle cx="9" cy="9" r="3.5"/><circle cx="16.5" cy="10" r="2.8"/>' +
    '<path d="M3 19c.8-3.2 3.2-5 6-5s5.2 1.8 6 5M15 14.4c2.6-.3 4.8 1.2 5.5 4.6"/>',
  me: '<circle cx="12" cy="8.5" r="4"/><path d="M4.5 20c1-3.8 4-5.8 7.5-5.8s6.5 2 7.5 5.8"/>',
};

function roundNav(body: string): MonoIcon["themes"] {
  return { cute: { body, stroke: 2.1 }, clean: { body, stroke: 1.8 } };
}

export const MONO_ICONS: Record<string, MonoIcon> = {
  /** 顶部导航返回（GroupHome 等） */
  back: { body: '<path d="M15 5l-7 7 7 7"/>', stroke: 2.5 },
  /** 建个群、在本群发起、底栏中间（Groups、GroupHome） */
  plus: { body: '<path d="M12 5v14M5 12h14"/>', stroke: 3 },
  /** 输入邀请码（Groups） */
  key: {
    body: '<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M17 6l3 3M15 8l2 2"/>',
    stroke: 2.2,
  },
  /** 群主关闭了鸽子王评选（Groups）：三套线宽一样 */
  ban: {
    body: '<circle cx="12" cy="12" r="9"/><path d="M5.6 5.6l12.8 12.8"/>',
    stroke: 2.2,
    themes: { clean: { stroke: 2.2 } },
  },
  /** 加入后能看地点和详情（JoinLanding）：三套线宽一样 */
  lock: {
    body: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    stroke: 2.2,
    themes: { clean: { stroke: 2.2 } },
  },
  /** 换头像（Login） */
  camera: {
    body: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
    stroke: 2.4,
  },
  /** 勾选框（Login） */
  check: { body: '<path d="M5 12.5l4.5 4.5L19 7.5"/>', stroke: 4 },
  /** 列表行右边的箭头（GroupSettings 的 chev）：三套一样 */
  chevron: { body: '<path d="M9 6l6 6-6 6"/>', stroke: 2.6, themes: { clean: { stroke: 2.6 } } },
  /** 关闭弹层：设计稿里没有，按返回箭头的线宽画 */
  close: { body: '<path d="M6 6l12 12M18 6L6 18"/>', stroke: 2.5 },
  /** 分享卡片底部的「小程序」标（Invite）：三套一样 */
  miniprogram: {
    body: '<circle cx="8.5" cy="12" r="4.5"/><circle cx="15.5" cy="12" r="4.5"/>',
    stroke: 2.4,
    themes: { clean: { stroke: 2.4 } },
  },
  "nav-home": {
    body: '<path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/>',
    stroke: 2,
    themes: roundNav(NAV_ROUND.home),
  },
  "nav-calendar": {
    body: '<rect x="3.5" y="5" width="17" height="15" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    stroke: 2,
    themes: roundNav(NAV_ROUND.calendar),
  },
  "nav-groups": {
    body:
      '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.5-3.5 3-5.5 6.5-5.5s6 2 6.5 5.5"/>' +
      '<circle cx="17" cy="9" r="2.5"/><path d="M16 14.6c2.8.2 4.8 2 5.2 5"/>',
    stroke: 2.2,
    themes: roundNav(NAV_ROUND.groups),
  },
  "nav-me": {
    body: '<circle cx="12" cy="8" r="4"/><path d="M4 21c.8-4 4-6 8-6s7.2 2 8 6"/>',
    stroke: 2,
    themes: roundNav(NAV_ROUND.me),
  },
};

/** 带颜色的小图要用的颜色，取自三套设计稿（和 tokens.json 对得上：线条是 outline / text，点缀是 accent、formed） */
export interface ArtColors {
  line: string;
  accent: string;
  formed: string;
  dot: string;
  /** 披风的描边，清爽风没有 */
  capeStroke: string;
  stroke: number;
}

export const ART_COLORS: Record<ThemeKey, ArtColors> = {
  sticker: {
    line: "#2A1E16",
    accent: "#FF5B3A",
    formed: "#3CC48C",
    dot: "#2A1E16",
    capeStroke: "#2A1E16",
    stroke: 2,
  },
  cute: {
    line: "#6B4A3A",
    accent: "#FF9EB5",
    formed: "#6FD3A6",
    dot: "#4A3228",
    capeStroke: "#6B4A3A",
    stroke: 2,
  },
  clean: {
    line: "#1C1B19",
    accent: "#EF4B2B",
    formed: "#1F9D63",
    dot: "#1C1B19",
    capeStroke: "none",
    stroke: 1.64,
  },
};

/** 群头像预设的图标（Groups、Invite、JoinLanding），key 和 shared 的 CIRCLE_AVATAR_PRESETS 一一对应 */
export const TILE_ICONS: Record<string, (colors: ArtColors) => string> = {
  dorm: () => '<path d="M4 21V9l8-5 8 5v12"/><path d="M9 21v-6h6v6M9 11h.01M15 11h.01"/>',
  family: (colors) =>
    '<path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/>' +
    `<path d="M12 17.5s-3-1.8-3-3.6a1.6 1.6 0 0 1 3-.8 1.6 1.6 0 0 1 3 .8c0 1.8-3 3.6-3 3.6z" fill="${colors.accent}" stroke-width="1.6"/>`,
  sport: () =>
    '<path d="M12 21a3 3 0 0 1-3-3h6a3 3 0 0 1-3 3z"/><path d="M9 18 6 4M15 18l3-14M12 18V3M7.5 11h9"/>',
  work: () =>
    '<rect x="3" y="7" width="18" height="13" rx="2.5"/><path d="M8.5 7V5a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v2M3 12.5h18"/>',
  food: () =>
    '<path d="M3 11h18"/><path d="M5 11a7 7 0 0 0 14 0"/>' +
    '<path d="M8 7c0-1.5 1-1.5 1-3M12 7c0-1.5 1-1.5 1-3M16 7c0-1.5 1-1.5 1-3"/>',
  music: () =>
    '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0"/><path d="M12 18v3M9 21h6"/>',
};

/** 和平周横条上的白鸽（Groups），线宽清爽风细一号 */
export function doveSvg(colors: ArtColors, thin: boolean): string {
  const outline = thin ? 1.48 : 1.8;
  const smile = thin ? 1.31 : 1.6;

  return (
    `<path d="M3 14c2-5 7-8 13-7l4-3-1 5c1 4-2 8-7 9-4 .5-7-1.5-9-4z" fill="#FFFFFF" stroke="${colors.line}" stroke-width="${outline}" stroke-linejoin="round"/>` +
    `<path d="M9 13c2 1 4 1 6-1" fill="none" stroke="${colors.line}" stroke-width="${smile}" stroke-linecap="round"/>` +
    `<circle cx="16" cy="9" r="1" fill="${colors.dot}"/>` +
    `<path d="M20 6.5c1 .2 2 .8 2.5 1.6" fill="none" stroke="${colors.formed}" stroke-width="2" stroke-linecap="round"/>`
  );
}

/** 月度鸽王的披风（Main「头像状态」），画在 120×120 的头套画布里，垫在头套下面 */
export function capeSvg(colors: ArtColors): string {
  const stroke =
    colors.capeStroke === "none"
      ? 'stroke="none"'
      : `stroke="${colors.capeStroke}" stroke-width="3" stroke-linejoin="round"`;

  return `<path d="M24 86 L10 118 L110 118 L96 86 Z" fill="${colors.accent}" ${stroke}/>`;
}

/**
 * 主题 token → CSS 变量的纯逻辑，gen-theme-css.ts 调它，测试也测它。
 *
 * docs/design/tokens.json 是唯一的样式来源（.claude/rules/miniapp.md）：
 * 这里只决定「哪个角色取哪个 token」，值一律从 tokens.json 来。
 * 三套主题的原始 token 不完全对称（比如清爽风有 chip、没有 tint），
 * 角色表把它们映射成同一套变量名；任何一套缺了某个角色就报错，保证组件拿到的变量三套都有。
 */

export type Json = string | number | boolean | null | Json[] | { [key: string]: Json };
export type ThemeTokens = Record<string, Json>;
export type ThemeKey = "sticker" | "cute" | "clean";

/** 设计稿按 390 宽画，小程序 750rpx = 屏宽 */
export const DESIGN_WIDTH = 390;
const RPX_PER_PX = 750 / DESIGN_WIDTH;

/**
 * 把值里的 px 换成 rpx。复合值（「2.5px solid #2A1E16」「0 1px 2px rgba(…)」）里的每个 px 都换。
 * 两种保持 px：不超过 1px 的细线（换成 rpx 在窄屏上可能不到 1 个物理像素，线会消失），
 * 以及 999px 这种「胶囊圆角」的写法（只是一个足够大的数）。
 */
export function pxToRpx(value: string): string {
  return value.replace(/(-?\d*\.?\d+)px\b/g, (match, raw: string) => {
    const px = Number(raw);

    if (Math.abs(px) <= 1 || Math.abs(px) >= 999) {
      return match;
    }

    const rpx = Math.round(px * RPX_PER_PX * 100) / 100;
    return `${rpx}rpx`;
  });
}

/** 数字当作设计稿 px；字符串原样（再换 rpx）；百分比、none 之类不动 */
export function toLength(value: Json): string {
  return typeof value === "number" ? pxToRpx(`${value}px`) : pxToRpx(String(value));
}

/** 按「a.b.0」这样的路径取值，取不到返回 undefined */
export function lookup(theme: ThemeTokens, path: string): Json | undefined {
  let current: Json | undefined = theme;

  for (const key of path.split(".")) {
    if (current === null || typeof current !== "object") {
      return undefined;
    }
    current = Array.isArray(current) ? current[Number(key)] : current[key];
  }

  return current;
}

/**
 * 把投影里的颜色换成另一个颜色：软糖风彩色底的按钮，投影跟着底色走（tokens.json 的 shadowTone）。
 * 投影或颜色是 none 时就是 none。
 */
export function retintShadow(shadow: string, color: string): string {
  if (shadow === "none" || color === "none") {
    return "none";
  }

  return shadow.replace(/(#[0-9A-Fa-f]{3,8}|rgba?\([^)]*\))\s*$/, color);
}

/** tokens.json 里 cute 的 bgPattern 是「图案 / 尺寸」写在一起，拆成两个变量 */
export function splitPattern(pattern: string | undefined): { image: string; size: string } {
  if (!pattern) {
    return { image: "none", size: "auto" };
  }

  const slash = pattern.lastIndexOf("/");
  return slash === -1
    ? { image: pattern.trim(), size: "auto" }
    : { image: pattern.slice(0, slash).trim(), size: pattern.slice(slash + 1).trim() };
}

// ---------- 角色表 ----------

type Getter = (theme: ThemeTokens) => string | undefined;

/** 一个角色：同一个来源三套通用，或者按主题分别写来源 */
type Source = string | Getter;

interface Role {
  name: string;
  from: Source | Record<ThemeKey, Source>;
}

function str(value: Json | undefined): string | undefined {
  return value === undefined || value === null ? undefined : String(value);
}

/** 颜色：清爽风的 outline 是 none，当颜色用时换成透明 */
const color =
  (path: string): Getter =>
  (theme) => {
    const value = str(lookup(theme, path));
    return value === "none" ? "transparent" : value;
  };

const length =
  (path: string): Getter =>
  (theme) => {
    const value = lookup(theme, path);
    return value === undefined ? undefined : toLength(value);
  };

const raw =
  (path: string): Getter =>
  (theme) =>
    str(lookup(theme, path));

function fontStack(theme: ThemeTokens, familyPath: string): string | undefined {
  const family = str(lookup(theme, familyPath));
  const body = str(lookup(theme, "font.body"));
  const fallback = str(lookup(theme, "font.fallback"));

  if (!family || !body || !fallback) {
    return undefined;
  }

  // 快乐体没加载上（小程序里是运行时加载的）就退回正文字体
  return family === body ? `"${body}", ${fallback}` : `"${family}", "${body}", ${fallback}`;
}

/** 标题字号阶梯：清爽风按 displayScale 缩小，其余主题原样 */
export const DISPLAY_SIZES = [34, 30, 26, 24, 22, 21, 20, 17, 15, 12] as const;

const CHIP_TONES = [
  "king",
  "formed",
  "recruiting",
  "danger",
  "lavender",
  "flaked",
  "neutral",
  "dark",
] as const;
const SHADOW_TONES = ["primary", "king", "formed", "flaked"] as const;
/** 按钮投影三档：小按钮、普通按钮、大按钮 */
const CONTROL_SHADOWS = { sm: "shadow.controlSm", md: "shadow.button", lg: "shadow.controlLg" };
const AVATAR_COUNT = 8;

const ROLES: Role[] = [
  // ---- 底色和文字 ----
  { name: "color-bg", from: color("color.bg") },
  {
    name: "bg-pattern-image",
    from: (theme) => pxToRpx(splitPattern(str(lookup(theme, "color.bgPattern"))).image),
  },
  {
    name: "bg-pattern-size",
    from: (theme) => pxToRpx(splitPattern(str(lookup(theme, "color.bgPattern"))).size),
  },
  { name: "color-surface", from: color("color.surface") },
  { name: "color-surface-muted", from: color("color.surfaceMuted") },
  { name: "color-surface-inset", from: color("color.surfaceInset") },
  { name: "color-surface-king", from: color("color.surfaceKing") },
  { name: "color-track", from: color("color.track") },
  {
    name: "color-tabs-track",
    from: {
      sticker: color("color.surface"),
      cute: color("color.surface"),
      clean: color("color.track"),
    },
  },
  { name: "color-text", from: color("color.text") },
  { name: "color-text-secondary", from: color("color.textSecondary") },
  { name: "color-text-formed", from: color("color.formedText") },
  { name: "color-text-danger", from: color("color.dangerAction") },
  { name: "color-outline", from: color("color.outline") },
  { name: "color-divider", from: color("color.divider") },
  { name: "color-divider-dashed", from: color("color.dividerDashed") },

  // ---- 主题色 ----
  { name: "color-primary", from: color("color.primary") },
  { name: "color-on-primary", from: color("color.onPrimary") },
  { name: "color-king", from: color("color.king") },
  { name: "color-formed", from: color("color.formed") },
  { name: "color-recruiting", from: color("color.recruiting") },
  { name: "color-flaked", from: color("color.flaked") },
  { name: "color-danger", from: color("color.danger") },
  { name: "color-danger-text", from: color("color.dangerText") },
  { name: "color-accent", from: color("color.accent") },
  { name: "color-tint-danger", from: color("color.tintDanger") },

  // ---- 图标块（群头像）和卡片底部横条 ----
  {
    name: "tile-green",
    from: {
      sticker: color("color.tintFormed"),
      cute: color("color.tintFormed"),
      clean: color("banner.formed"),
    },
  },
  {
    name: "tile-peach",
    from: {
      sticker: color("color.tintPrimary"),
      cute: color("color.tintPrimary"),
      clean: color("banner.danger"),
    },
  },
  {
    name: "tile-blue",
    from: {
      sticker: color("color.tintRecruiting"),
      cute: color("color.tintRecruiting"),
      clean: color("banner.recruiting"),
    },
  },
  {
    name: "tile-lavender",
    from: {
      sticker: color("color.tintLavender"),
      cute: color("color.tintLavender"),
      clean: color("banner.lavender"),
    },
  },
  {
    name: "band-king",
    from: { sticker: color("color.king"), cute: color("color.king"), clean: color("banner.king") },
  },
  {
    name: "band-peace",
    from: {
      sticker: color("color.tintFormed"),
      cute: color("color.tintFormed"),
      clean: color("chip.formed.0"),
    },
  },
  { name: "band-muted", from: color("color.surfaceMuted") },

  // ---- 标签 ----
  ...CHIP_TONES.flatMap((tone) => [
    { name: `chip-${tone}-bg`, from: color(`chip.${tone}.0`) },
    { name: `chip-${tone}-fg`, from: color(`chip.${tone}.1`) },
  ]),

  // ---- 头像 ----
  ...Array.from({ length: AVATAR_COUNT }, (_, index) => [
    {
      name: `avatar-${index + 1}-bg`,
      from: (theme: ThemeTokens) =>
        str(lookup(theme, `avatar.${index}.0`) ?? lookup(theme, `avatar.${index}`)),
    },
    {
      name: `avatar-${index + 1}-fg`,
      from: (theme: ThemeTokens) =>
        str(lookup(theme, `avatar.${index}.1`) ?? lookup(theme, "avatarText")),
    },
  ]).flat(),
  { name: "avatar-ring", from: color("avatarRing.color") },
  /** 贴纸式的歪着贴乘上这个系数：贴纸风、软糖风是 1，清爽风是 0（摆正） */
  { name: "tilt-scale", from: raw("tilt.scale") },
  { name: "avatar-flaked-bg", from: color("color.flakedAvatarBg") },
  { name: "avatar-flaked-fg", from: color("color.flakedAvatarText") },
  { name: "avatar-flaked-ring", from: color("color.flakedAvatarRing") },

  // ---- 按钮、开关、悬浮按钮、底部导航的颜色 ----
  { name: "button-primary-bg", from: color("color.primary") },
  { name: "button-primary-fg", from: color("color.onPrimary") },
  { name: "button-secondary-bg", from: color("color.secondaryButton") },
  { name: "button-secondary-fg", from: color("color.text") },
  { name: "button-danger-bg", from: color("color.flakedButton") },
  { name: "button-danger-fg", from: color("color.onFlakedButton") },
  { name: "button-king-bg", from: color("color.kingButton") },
  { name: "button-king-fg", from: color("color.text") },
  { name: "switch-on", from: color("color.formed") },
  { name: "switch-off", from: color("color.surfaceMuted") },
  { name: "fab-bg", from: color("color.fab") },
  { name: "fab-fg", from: color("color.onFab") },
  { name: "tab-active", from: color("color.tabActive") },
  { name: "tab-inactive", from: color("color.textSecondary") },
  { name: "tab-pill", from: color("color.tabActivePill") },
  { name: "tab-center-bg", from: color("color.tabCenter") },
  { name: "tab-center-fg", from: color("color.onTabCenter") },
  { name: "segment-active-bg", from: color("color.segmentActive") },
  { name: "color-scrim", from: color("color.scrim") },
  { name: "color-grabber", from: color("color.grabber") },

  // ---- 描边 ----
  ...[
    "card",
    "button",
    "chip",
    "strong",
    "thin",
    "dashed",
    "dashedThin",
    "field",
    "fieldThin",
    "knob",
    "band",
    "row",
    "rowKing",
    "sheet",
  ].map((key) => ({ name: `border-${kebab(key)}`, from: length(`border.${key}`) })),

  // ---- 圆角 ----
  ...[
    "card",
    "button",
    "chip",
    "iconButton",
    "input",
    "xs",
    "2xs",
    "sm",
    "md",
    "lg",
    "xl",
    "2xl",
    "3xl",
    "bubble",
    "tabbar",
    "tabCenter",
    "tabPill",
    "sheet",
  ].map((key) => ({ name: `radius-${kebab(key)}`, from: length(`radius.${key}`) })),

  // ---- 投影 ----
  { name: "shadow-card", from: length("shadow.card") },
  { name: "shadow-icon-button", from: length("shadow.iconButton") },
  { name: "shadow-surface-sm", from: length("shadow.surfaceSm") },
  { name: "shadow-surface-md", from: length("shadow.surfaceMd") },
  { name: "shadow-surface-xl", from: length("shadow.surfaceXl") },
  { name: "shadow-control-sm", from: length(CONTROL_SHADOWS.sm) },
  { name: "shadow-control-md", from: length(CONTROL_SHADOWS.md) },
  { name: "shadow-control-lg", from: length(CONTROL_SHADOWS.lg) },
  { name: "shadow-selected", from: length("shadow.selected") },
  { name: "shadow-tabbar", from: length("shadow.tabbar") },
  { name: "shadow-tab-center", from: length("shadow.tabCenter") },
  { name: "shadow-segment-active", from: length("shadow.segmentActive") },
  ...SHADOW_TONES.flatMap((tone) =>
    (Object.entries(CONTROL_SHADOWS) as [string, string][]).map(([size, path]) => ({
      name: `shadow-${tone}-${size}`,
      from: (theme: ThemeTokens) => {
        const base = str(lookup(theme, path));
        const tint = str(lookup(theme, `shadowTone.${tone}`));
        return base === undefined || tint === undefined
          ? undefined
          : pxToRpx(retintShadow(base, tint));
      },
    })),
  ),

  // ---- 字体 ----
  { name: "font-body", from: (theme) => fontStack(theme, "font.body") },
  { name: "font-display", from: (theme) => fontStack(theme, "font.display") },
  { name: "font-logo", from: (theme) => fontStack(theme, "font.logo") },
  { name: "font-display-weight", from: raw("font.displayWeight") },
  {
    name: "font-button-family",
    from: (theme) =>
      fontStack(
        theme,
        str(lookup(theme, "font.buttonFamily")) === "display" ? "font.display" : "font.body",
      ),
  },
  { name: "font-button-weight", from: raw("font.buttonWeight") },
  { name: "font-button-delta", from: length("font.buttonSizeDelta") },
  { name: "font-weight-900", from: raw("font.weightMap.900") },
  { name: "font-weight-700", from: raw("font.weightMap.700") },
  ...DISPLAY_SIZES.map((size) => ({
    name: `size-display-${size}`,
    from: (theme: ThemeTokens) => {
      const scaled = lookup(theme, `font.displayScale.${size}`);
      return toLength(typeof scaled === "number" ? scaled : size);
    },
  })),

  // ---- 底部导航几何 ----
  ...[
    "height",
    "inset",
    "paddingBottom",
    "labelSize",
    "labelGap",
    "iconSize",
    "centerSize",
    "centerLift",
    "centerBorder",
    "pillWidth",
    "pillHeight",
    "pillBorder",
    "border",
    "borderTop",
  ].map((key) => ({ name: `tabbar-${kebab(key)}`, from: length(`tabbar.${key}`) })),
];

export function kebab(key: string): string {
  return key.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}

export interface ResolvedTheme {
  vars: [string, string][];
  /** 缺了的角色，非空就不该生成 */
  missing: string[];
}

export function resolveTheme(key: ThemeKey, theme: ThemeTokens): ResolvedTheme {
  const vars: [string, string][] = [];
  const missing: string[] = [];

  for (const role of ROLES) {
    const source: Source = typeof role.from === "object" ? role.from[key] : role.from;
    const getter: Getter = typeof source === "string" ? raw(source) : source;
    const value = getter(theme);

    if (value === undefined || value === "") {
      missing.push(role.name);
    } else {
      vars.push([`--yq-${role.name}`, value]);
    }
  }

  return { vars, missing };
}

/** JS 里要用的少数几个值（CSS 变量 JS 读不到）：页面底色、头像描边比例、底栏几何 */
export interface ThemeRuntimeMeta {
  bg: string;
  avatarRingRatio: number;
  tabbar: {
    floating: boolean;
    height: number;
    inset: number;
    paddingBottom: number;
  };
}

export function runtimeMeta(theme: ThemeTokens): ThemeRuntimeMeta {
  const number = (path: string): number => Number(lookup(theme, path) ?? 0);

  return {
    bg: String(lookup(theme, "color.bg")),
    avatarRingRatio: number("avatarRing.ratio"),
    tabbar: {
      floating: lookup(theme, "tabbar.layout") === "floating",
      height: number("tabbar.height"),
      inset: number("tabbar.inset"),
      paddingBottom: number("tabbar.paddingBottom"),
    },
  };
}

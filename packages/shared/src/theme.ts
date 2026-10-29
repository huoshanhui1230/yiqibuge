/**
 * 三套主题。名字和 docs/design/html/<主题>/ 的目录名一致。
 *
 * 主题只影响用户自己看到的样子（docs/decisions.md「主题规则」），
 * 后端只负责把用户选的主题存下来，所以名单放在共用包里两端一起认。
 */
export const THEMES = ["sticker", "cute", "clean"] as const;

export type ThemeName = (typeof THEMES)[number];

/** 默认贴纸风（docs/decisions.md 第 10、15 条） */
export const DEFAULT_THEME: ThemeName = "sticker";

export function isThemeName(value: unknown): value is ThemeName {
  return typeof value === "string" && (THEMES as readonly string[]).includes(value);
}

export interface ThemeMeta {
  /** 主题选择页上的名字 */
  name: string;
  /** 风格说明板（设计稿 Main）右上角的全称 */
  fullName: string;
  /** 主题选择页上的一句话说明 */
  desc: string;
}

/** 文案取自设计稿 ThemePicker 和 Main */
export const THEME_META: Record<ThemeName, ThemeMeta> = {
  sticker: { name: "贴纸风", fullName: "饭桌贴纸风", desc: "粗描边、硬投影，像饭桌贴纸" },
  cute: { name: "软糖风", fullName: "软糖风", desc: "圆滚滚、糖果色，鸽子也更软萌" },
  clean: { name: "清爽风", fullName: "清爽风", desc: "细线条、少装饰，信息一眼看清" },
};

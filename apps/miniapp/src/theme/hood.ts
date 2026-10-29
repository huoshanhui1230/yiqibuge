import type { ThemeName } from "@yiqi/shared";

/**
 * 鸽子王头套的几何（docs/decisions.md 第 9 条：本人头像露在头套脸洞里 + 头顶皇冠）。
 * 坐标都在 120 × 120 的头套画布里，取自三套设计稿 Main「头像状态」：
 * 清爽风的脸洞更大、位置更高；月度鸽王的皇冠更大。
 */
export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface HoodGeometry {
  /** 脸洞：露出本人头像的圆 */
  face: { cx: number; cy: number; r: number };
  crown: Box;
  crownMonth: Box;
}

export const HOOD_CANVAS = 120;

const CROWN: Box = { x: 41, y: 0, w: 38, h: 25 };
const CROWN_MONTH: Box = { x: 36, y: 0, w: 48, h: 32 };

export const HOOD_GEOMETRY: Record<ThemeName, HoodGeometry> = {
  sticker: { face: { cx: 60, cy: 72, r: 27 }, crown: CROWN, crownMonth: CROWN_MONTH },
  cute: { face: { cx: 60, cy: 72, r: 27 }, crown: CROWN, crownMonth: CROWN_MONTH },
  clean: { face: { cx: 60, cy: 70, r: 29 }, crown: CROWN, crownMonth: CROWN_MONTH },
};

/**
 * 行内样式（:style）里的尺寸。样式表里的 px 由构建插件换成 rpx（scripts/postcss-px-to-rpx.ts），
 * 行内样式不经过它，所以算出来的尺寸在这里换：设计稿 px × 750/390。
 */
const RPX_PER_PX = 750 / 390;

export function rpx(designPx: number): string {
  return `${Math.round(designPx * RPX_PER_PX * 100) / 100}rpx`;
}

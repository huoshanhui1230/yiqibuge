/**
 * 鸽值四档（docs/spec.md「鸽值计算」）。
 * 阶段 1 只有群组主页鸽榜底部的规则框用到文案；阶段 3 算鸽值时沿用这里的分值。
 */
export type FlakeTier = "small" | "medium" | "large" | "lightning";

export interface FlakeTierInfo {
  tier: FlakeTier;
  /** 叫法 */
  name: string;
  points: number;
  /** 规则框里的说明，取自设计稿 GroupHome */
  rangeText: string;
}

export const FLAKE_TIERS: readonly FlakeTierInfo[] = [
  { tier: "small", name: "小鸽", points: 1, rangeText: "提前 3 天以上" },
  { tier: "medium", name: "中鸽", points: 2, rangeText: "提前 1–3 天" },
  { tier: "large", name: "大鸽", points: 3, rangeText: "提前 2–24 小时" },
  { tier: "lightning", name: "闪电鸽", points: 5, rangeText: "不到 2 小时" },
];

export function flakeTierInfo(tier: FlakeTier): FlakeTierInfo {
  // FLAKE_TIERS 覆盖了全部四档，这里一定找得到
  return FLAKE_TIERS.find((info) => info.tier === tier) as FlakeTierInfo;
}

<script setup lang="ts">
import { computed } from "vue";

import type { ChipTone } from "./types";

/**
 * 标签（设计稿 Main「按钮与标签」、Groups「进行中 2」、GroupHome「领跑」「4 天 21 小时后揭晓」）。
 * 贴纸风、软糖风是彩色底加描边；清爽风是浅底深字、没有描边（tokens.json 的 chip）。
 * - md：Main 里的状态标签；sm：卡片右上角「进行中」、揭晓倒计时；
 *   xs：名字旁边的「领跑」「鸽王局」；badge：主题选择页的「使用中」「预览中」。
 */
const props = withDefaults(
  defineProps<{
    tone: ChipTone;
    size?: "md" | "sm" | "xs" | "badge";
    /** 字重加粗：不传时「进行中」和鸽王类默认加粗 */
    strong?: boolean;
  }>(),
  { size: "md", strong: undefined },
);

/** 标签的语义 → tokens.json chip 里的配色名 */
const PALETTE: Record<ChipTone, string> = {
  progress: "danger",
  recruiting: "recruiting",
  formed: "formed",
  king: "king",
  cancelled: "neutral",
  flaked: "flaked",
  lavender: "lavender",
  dark: "dark",
};

const style = computed(() => ({
  background: `var(--yq-chip-${PALETTE[props.tone]}-bg)`,
  color: `var(--yq-chip-${PALETTE[props.tone]}-fg)`,
}));

const isStrong = computed(
  () => props.strong ?? (props.tone === "progress" || props.tone === "king"),
);
</script>

<template>
  <view
    class="yq-chip"
    :class="[`yq-chip--${size}`, { 'yq-chip--strong': isStrong, 'yq-chip--dark': tone === 'dark' }]"
    :style="style"
  >
    <slot name="icon" />
    <text><slot /></text>
  </view>
</template>

<style scoped>
.yq-chip {
  box-sizing: border-box;
  flex: none;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: var(--yq-border-chip);
  border-radius: var(--yq-radius-chip);
  font-weight: var(--yq-font-weight-700);
  white-space: nowrap;
}

.yq-chip--strong {
  font-weight: var(--yq-font-weight-900);
}

.yq-chip--md {
  padding: 4px 12px;
  font-size: 13px;
}

.yq-chip--sm {
  padding: 2px 9px;
  font-size: 12px;
}

.yq-chip--xs {
  padding: 0 6px;
  border: var(--yq-border-thin);
  font-size: 10.5px;
  line-height: 15px;
}

.yq-chip--badge {
  padding: 0 7px;
  border: var(--yq-border-thin);
  font-size: 11px;
  line-height: 17px;
}

/* 「连任 2 周」这种深色小标签不描边 */
.yq-chip--dark {
  border: none;
  padding: 0 7px;
  font-size: 11px;
  line-height: 18px;
}
</style>

<script setup lang="ts">
import { computed } from "vue";

import { rpx } from "../utils/units";
import type { IconName } from "./types";

/**
 * 单色线性图标：SVG 当 mask，底色用 currentColor，所以图标跟着文字色走。
 * 图形在 styles/icons.css（按主题的 CSS 变量），清爽风线条细一号、底栏图标是圆角版。
 */
const props = withDefaults(
  defineProps<{
    name: IconName;
    /** 设计稿 px */
    size?: number;
    /** 不传就跟文字色 */
    color?: string;
  }>(),
  { size: 20, color: "currentColor" },
);

const style = computed(() => {
  const mask = `var(--yq-icon-${props.name})`;

  return {
    width: rpx(props.size),
    height: rpx(props.size),
    backgroundColor: props.color,
    WebkitMaskImage: mask,
    maskImage: mask,
  };
});
</script>

<template>
  <view class="yq-icon" :style="style" />
</template>

<style scoped>
.yq-icon {
  display: inline-block;
  flex: none;
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
  -webkit-mask-position: center;
  mask-position: center;
  -webkit-mask-size: contain;
  mask-size: contain;
}
</style>

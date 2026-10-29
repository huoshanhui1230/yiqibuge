<script setup lang="ts">
import type { ThemeName } from "@yiqi/shared";
import { computed } from "vue";

import { useTheme } from "../theme/useTheme";
import { rpx } from "../utils/units";
import type { ArtName } from "./types";

/**
 * 主题插画：/static/themes/<主题>/<名字>.svg，三套主题各画一版。
 * 主题选择页要在一页里同时画三套，所以可以用 theme 指定画哪一套。
 */
const props = defineProps<{
  name: ArtName;
  /** 设计稿 px */
  width: number;
  /** 不传就和宽一样 */
  height?: number;
  theme?: ThemeName;
}>();

const { theme: currentTheme } = useTheme();

const src = computed(() => `/static/themes/${props.theme ?? currentTheme.value}/${props.name}.svg`);
const style = computed(() => ({
  width: rpx(props.width),
  height: rpx(props.height ?? props.width),
}));
</script>

<template>
  <image class="yq-illustration" :src="src" :style="style" />
</template>

<style scoped>
.yq-illustration {
  display: block;
  flex: none;
}
</style>

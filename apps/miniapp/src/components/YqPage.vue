<script setup lang="ts">
import { watch } from "vue";

import { paintWindow, useTheme } from "../theme/useTheme";

/**
 * 每个页面的根节点：挂主题类（三套主题的 CSS 变量都挂在这个类上）、页面底色和软糖风的小圆点底纹、
 * 字体和文字色。动效开关（阶段 4 接设置）关掉时加 yq-motion-off，所有 .yq-anim 的动画停掉。
 */
const { theme, themeClass, motionOff } = useTheme();

// 页面一打开、主题一换，就按当前主题刷一下窗口底色（下拉回弹时露出来的那块）
watch(theme, paintWindow, { immediate: true });
</script>

<template>
  <view class="yq-page" :class="[themeClass, { 'yq-motion-off': motionOff }]">
    <slot />
  </view>
</template>

<style scoped>
.yq-page {
  box-sizing: border-box;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--yq-color-bg);
  background-image: var(--yq-bg-pattern-image);
  background-size: var(--yq-bg-pattern-size);
  color: var(--yq-color-text);
  font-family: var(--yq-font-body);
  font-size: 14px;
  line-height: 1.4;
}
</style>

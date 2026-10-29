<script setup lang="ts">
import { computed } from "vue";

import { platform } from "../platform";
import { THEME_RUNTIME } from "../theme/theme-meta.generated";
import { useTheme } from "../theme/useTheme";
import type { IconName, TabKey } from "./types";
import YqIcon from "./YqIcon.vue";

/**
 * 底部导航（docs/spec.md「底部导航」：首页、日历、＋发起、群组、我的）。
 * 三套主题几何不一样（设计稿 Groups）：贴纸风通栏、中间圆按钮上浮；软糖风是悬浮的胶囊条；
 * 清爽风通栏细线、中间是深色方块。不用原生 tabBar（docs/decisions.md 第 26 条）。
 * 自己会在页面里垫一个同样高的占位，内容不会被挡住。
 */
defineProps<{ current: TabKey }>();

const emit = defineEmits<{ change: [tab: TabKey]; create: [] }>();

const ITEMS: { key: TabKey; label: string; icon: IconName }[] = [
  { key: "home", label: "首页", icon: "nav-home" },
  { key: "calendar", label: "日历", icon: "nav-calendar" },
  { key: "groups", label: "群组", icon: "nav-groups" },
  { key: "me", label: "我的", icon: "nav-me" },
];
const LEFT = ITEMS.slice(0, 2);
const RIGHT = ITEMS.slice(2);

const { theme } = useTheme();
const metrics = platform.getNavMetrics();
/** 设计稿 px → 屏幕 px */
const scale = metrics.windowWidth / 390;

/**
 * 高度和离底距离要把底部安全区算进去：通栏的底部留白至少盖住安全区；
 * 悬浮条整体往上抬一个安全区。
 */
const geometry = computed(() => {
  const bar = THEME_RUNTIME[theme.value].tabbar;
  const designPadding = bar.paddingBottom * scale;
  const paddingBottom = bar.floating ? 0 : Math.max(designPadding, metrics.safeAreaBottom);
  const height = bar.height * scale - designPadding + paddingBottom;
  const bottom = bar.floating ? bar.inset * scale + metrics.safeAreaBottom : 0;

  return { height, bottom, paddingBottom, total: height + bottom };
});
</script>

<template>
  <view class="yq-tabbar-spacer" :style="{ height: `${geometry.total + 12}px` }" />
  <view
    class="yq-tabbar"
    :style="{
      height: `${geometry.height}px`,
      bottom: `${geometry.bottom}px`,
      paddingBottom: `${geometry.paddingBottom}px`,
    }"
  >
    <view
      v-for="item in LEFT"
      :key="item.key"
      class="yq-tabbar__item"
      :class="{ 'is-active': current === item.key }"
      @click="emit('change', item.key)"
    >
      <view class="yq-tabbar__icon">
        <YqIcon :name="item.icon" :size="22" />
      </view>
      <text class="yq-tabbar__label">{{ item.label }}</text>
    </view>

    <view class="yq-tabbar__center-cell">
      <view class="yq-tabbar__center" @click="emit('create')">
        <YqIcon name="plus" :size="26" />
      </view>
    </view>

    <view
      v-for="item in RIGHT"
      :key="item.key"
      class="yq-tabbar__item"
      :class="{ 'is-active': current === item.key }"
      @click="emit('change', item.key)"
    >
      <view class="yq-tabbar__icon">
        <YqIcon :name="item.icon" :size="22" />
      </view>
      <text class="yq-tabbar__label">{{ item.label }}</text>
    </view>
  </view>
</template>

<style scoped>
.yq-tabbar-spacer {
  flex: none;
}

.yq-tabbar {
  position: fixed;
  left: var(--yq-tabbar-inset);
  right: var(--yq-tabbar-inset);
  z-index: 50;
  box-sizing: border-box;
  padding-top: 8px;
  padding-left: 8px;
  padding-right: 8px;
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  align-items: center;
  background: var(--yq-color-surface);
  border: var(--yq-tabbar-border);
  border-top: var(--yq-tabbar-border-top);
  border-radius: var(--yq-radius-tabbar);
  box-shadow: var(--yq-shadow-tabbar);
}

.yq-tabbar__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--yq-tabbar-label-gap);
  color: var(--yq-tab-inactive);
}

.yq-tabbar__icon {
  box-sizing: border-box;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.yq-tabbar__label {
  font-size: var(--yq-tabbar-label-size);
  font-weight: var(--yq-font-weight-700);
}

.yq-tabbar__item.is-active {
  color: var(--yq-tab-active);
}

.yq-tabbar__item.is-active .yq-tabbar__label {
  font-weight: var(--yq-font-weight-900);
}

/* 当前项的底：贴纸风红色胶囊，软糖风粉色圆角块，清爽风没有（只变色） */
.yq-tabbar__item.is-active .yq-tabbar__icon {
  width: var(--yq-tabbar-pill-width);
  height: var(--yq-tabbar-pill-height);
  min-height: 28px;
  background: var(--yq-tab-pill);
  border: var(--yq-tabbar-pill-border);
  border-radius: var(--yq-radius-tab-pill);
  color: var(--yq-color-text);
}

.yq-tabbar__center-cell {
  display: flex;
  justify-content: center;
}

.yq-tabbar__center {
  box-sizing: border-box;
  width: var(--yq-tabbar-center-size);
  height: var(--yq-tabbar-center-size);
  margin-top: calc(-1 * var(--yq-tabbar-center-lift));
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--yq-tab-center-bg);
  color: var(--yq-tab-center-fg);
  border: var(--yq-tabbar-center-border);
  border-radius: var(--yq-radius-tab-center);
  box-shadow: var(--yq-shadow-tab-center);
}
</style>

<script setup lang="ts">
import { APP_NAME } from "@yiqi/shared";

import { platform } from "../platform";
import YqIcon from "./YqIcon.vue";
import YqIllustration from "./YqIllustration.vue";

/**
 * 顶部导航（docs/decisions.md 第 21 条：全局 navigationStyle custom，每页自己画）。
 * - back：左边返回按钮、中间标题（GroupHome、GroupSettings、Invite、ThemePicker）
 * - large：左边大标题（Groups「群组」）
 * - brand：左边鸽子和品牌名（JoinLanding）
 * - blank：只留出状态栏和胶囊的位置（Login）
 *
 * 高 44（设计稿 px），上面加状态栏；整行和微信胶囊垂直居中对齐，右边给胶囊让位。
 * 胶囊位置实测（.claude/rules/miniapp.md「顶部导航」），H5 预览用适配器给的固定值并画一个假胶囊。
 */
const props = withDefaults(
  defineProps<{
    variant?: "back" | "large" | "brand" | "blank";
    title?: string;
    /**
     * 返回自己处理：只发 back 事件，不做默认的返回。
     * 默认的返回是能退就退，退不了（从分享卡片直接进来的）回群组列表。
     * 不用函数类型的 prop：小程序里组件之间传函数不可靠。
     */
    customBack?: boolean;
  }>(),
  { variant: "back", title: "", customBack: false },
);

const emit = defineEmits<{ back: [] }>();

const ROW_HEIGHT = 44;
const DESIGN_WIDTH = 390;

const metrics = platform.getNavMetrics();
const menu = metrics.menuButton;
// 44 是设计稿 px，换成屏幕 px 再和胶囊中线对齐
const rowPx = (ROW_HEIGHT * metrics.windowWidth) / DESIGN_WIDTH;
const paddingTop = Math.max(metrics.statusBarHeight, menu.top + menu.height / 2 - rowPx / 2);
const capsuleSpace = metrics.windowWidth - menu.left;

function back(): void {
  emit("back");

  if (props.customBack) {
    return;
  }

  if (getCurrentPages().length > 1) {
    uni.navigateBack();
  } else {
    uni.reLaunch({ url: "/pages/main/index?tab=groups" });
  }
}
</script>

<template>
  <view class="yq-nav" :style="{ paddingTop: `${paddingTop}px` }">
    <view class="yq-nav__row" :style="{ paddingRight: `${capsuleSpace}px` }">
      <view v-if="variant === 'back'" class="yq-nav__back" @click="back">
        <YqIcon name="back" :size="20" />
      </view>
      <text v-else-if="variant === 'large'" class="yq-nav__large">{{ title }}</text>
      <view v-else-if="variant === 'brand'" class="yq-nav__brand">
        <YqIllustration name="gg" :width="32" />
        <text class="yq-nav__logo">{{ APP_NAME }}</text>
      </view>

      <text v-if="variant === 'back' && title" class="yq-nav__title">{{ title }}</text>

      <view class="yq-nav__extra">
        <slot />
      </view>
    </view>

    <!-- #ifdef H5 -->
    <!-- H5 预览没有微信胶囊：画一个示意，截图才和设计稿对得上（不是我们自己的界面） -->
    <view
      class="yq-nav__capsule"
      :style="{
        top: `${menu.top}px`,
        left: `${menu.left}px`,
        width: `${menu.width}px`,
        height: `${menu.height}px`,
      }"
    >
      <view class="yq-nav__dots">
        <view class="yq-nav__dot" />
        <view class="yq-nav__dot" />
        <view class="yq-nav__dot" />
      </view>
      <view class="yq-nav__sep" />
      <view class="yq-nav__ring-wrap">
        <view class="yq-nav__ring" />
      </view>
    </view>
    <!-- #endif -->
  </view>
</template>

<style scoped>
.yq-nav {
  position: relative;
  flex: none;
  box-sizing: border-box;
}

.yq-nav__row {
  position: relative;
  box-sizing: border-box;
  height: 44px;
  padding-left: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.yq-nav__back {
  box-sizing: border-box;
  width: 40px;
  height: 40px;
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--yq-color-surface);
  border: var(--yq-border-card);
  border-radius: var(--yq-radius-icon-button);
  box-shadow: var(--yq-shadow-icon-button);
  color: var(--yq-color-text);
}

.yq-nav__title {
  position: absolute;
  left: 0;
  right: 0;
  text-align: center;
  font-size: 16px;
  font-weight: var(--yq-font-weight-900);
  pointer-events: none;
}

.yq-nav__large {
  font-family: var(--yq-font-display);
  font-weight: var(--yq-font-display-weight);
  font-size: var(--yq-size-display-26);
  line-height: 1;
}

.yq-nav__brand {
  display: flex;
  align-items: center;
  gap: 6px;
}

.yq-nav__logo {
  font-family: var(--yq-font-logo);
  font-size: 22px;
  line-height: 1;
}

.yq-nav__extra {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* ---------- H5 预览里的假胶囊（微信的界面，不跟主题） ---------- */
.yq-nav__capsule {
  position: absolute;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  border: 1px solid rgba(42, 30, 22, 0.25);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.75);
}

.yq-nav__dots {
  flex: 1;
  display: flex;
  justify-content: center;
  gap: 3px;
}

.yq-nav__dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--yq-color-text);
}

.yq-nav__sep {
  width: 1px;
  height: 18px;
  background: rgba(42, 30, 22, 0.25);
}

.yq-nav__ring-wrap {
  flex: 1;
  display: flex;
  justify-content: center;
}

.yq-nav__ring {
  box-sizing: border-box;
  width: 15px;
  height: 15px;
  border: 2px solid var(--yq-color-text);
  border-radius: 50%;
}
</style>

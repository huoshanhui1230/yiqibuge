<script setup lang="ts">
import { computed } from "vue";

import { platform } from "../platform";
import { rpx } from "../utils/units";

/**
 * 底部弹出层的底座（设计稿 JoinSheet、Flake）：遮罩、把手、底部安全区，弹出时背景不跟着滚。
 * 确认卡（YqConfirmSheet）和各种编辑弹层都套在它上面。
 */
const props = withDefaults(
  defineProps<{
    visible: boolean;
    title?: string;
    /** 点遮罩能不能关；提交中的时候传 false */
    dismissible?: boolean;
  }>(),
  { title: "", dismissible: true },
);

const emit = defineEmits<{ close: [] }>();

const safeBottom = platform.getNavMetrics().safeAreaBottom;
// 行内样式不经过 px→rpx 插件，设计稿的 22 要自己换；安全区是屏幕 px，原样加上
const panelStyle = computed(() => ({ paddingBottom: `calc(${rpx(22)} + ${safeBottom}px)` }));

function onScrim(): void {
  if (props.dismissible) {
    emit("close");
  }
}

/** 遮罩上的滑动吃掉，背景页面就不会跟着滚 */
function swallow(): void {}
</script>

<template>
  <view v-if="visible" class="yq-sheet">
    <view class="yq-sheet__scrim" @click="onScrim" @touchmove.stop.prevent="swallow" />
    <view class="yq-sheet__panel yq-anim" :style="panelStyle">
      <view class="yq-sheet__grabber" />
      <text v-if="title" class="yq-sheet__title">{{ title }}</text>
      <slot />
      <view v-if="$slots.footer" class="yq-sheet__footer">
        <slot name="footer" />
      </view>
    </view>
  </view>
</template>

<style scoped>
.yq-sheet {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  z-index: 100;
}

.yq-sheet__scrim {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  background: var(--yq-color-scrim);
}

.yq-sheet__panel {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  max-height: 88vh;
  overflow-y: auto;
  box-sizing: border-box;
  padding: 10px 18px 22px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: var(--yq-color-surface);
  border-top: var(--yq-border-sheet);
  border-radius: var(--yq-radius-sheet) var(--yq-radius-sheet) 0 0;
  color: var(--yq-color-text);
  animation: yq-sheet-up 0.3s ease-out both;
}

.yq-sheet__grabber {
  flex: none;
  align-self: center;
  width: 44px;
  height: 5px;
  border-radius: 3px;
  background: var(--yq-color-grabber);
}

.yq-sheet__title {
  align-self: center;
  font-family: var(--yq-font-display);
  font-weight: var(--yq-font-display-weight);
  font-size: var(--yq-size-display-24);
  line-height: 1.2;
}

.yq-sheet__footer {
  flex: none;
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 4px;
}

@keyframes yq-sheet-up {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}
</style>

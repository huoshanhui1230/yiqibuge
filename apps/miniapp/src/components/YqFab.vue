<script setup lang="ts">
import { platform } from "../platform";
import YqIcon from "./YqIcon.vue";

/** 右下角悬浮按钮（设计稿 GroupHome「在本群发起」），清爽风是浅色胶囊 */
defineProps<{ text: string }>();
defineEmits<{ click: [] }>();

const safeBottom = platform.getNavMetrics().safeAreaBottom;
</script>

<template>
  <view class="yq-fab" :style="{ marginBottom: `${safeBottom}px` }" @click="$emit('click')">
    <YqIcon name="plus" :size="18" />
    <text>{{ text }}</text>
  </view>
</template>

<style scoped>
.yq-fab {
  position: fixed;
  right: 16px;
  bottom: 30px;
  z-index: 40;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px 18px;
  background: var(--yq-fab-bg);
  color: var(--yq-fab-fg);
  border: var(--yq-border-card);
  border-radius: 999px;
  box-shadow: var(--yq-shadow-primary-md);
  font-size: 15px;
  font-weight: var(--yq-font-weight-900);
}
</style>

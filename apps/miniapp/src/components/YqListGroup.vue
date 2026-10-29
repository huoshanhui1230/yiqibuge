<script setup lang="ts">
import { provide } from "vue";

/**
 * 设置页的一组行（设计稿 GroupSettings）：上面一行小标题，下面一张卡片装若干 YqListRow。
 * tone="king" 是鸽子王那组的浅黄底，行之间的分隔线也跟着变黄。
 */
const props = withDefaults(
  defineProps<{
    label?: string;
    tone?: "default" | "king";
  }>(),
  { label: "", tone: "default" },
);

provide("yqListTone", props.tone);
</script>

<template>
  <view class="yq-list">
    <text v-if="label" class="yq-list__label">{{ label }}</text>
    <view class="yq-list__card" :class="`yq-list__card--${tone}`">
      <slot />
    </view>
  </view>
</template>

<style scoped>
.yq-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.yq-list__label {
  margin-top: 4px;
  font-size: 13px;
  font-weight: var(--yq-font-weight-900);
  color: var(--yq-color-text-secondary);
}

.yq-list__card {
  box-sizing: border-box;
  padding: 0 14px;
  background: var(--yq-color-surface);
  border: var(--yq-border-card);
  border-radius: var(--yq-radius-2xl);
  box-shadow: var(--yq-shadow-surface-md);
}

.yq-list__card--king {
  background: var(--yq-color-surface-king);
  box-shadow: var(--yq-shadow-control-md);
}
</style>

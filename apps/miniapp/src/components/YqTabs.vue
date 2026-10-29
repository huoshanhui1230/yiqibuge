<script setup lang="ts">
/**
 * 分段标签（设计稿 GroupHome「计划 3 / 鸽榜 / 成员 8」）。
 * 选中项：贴纸风红底描边、软糖风粉底描边、清爽风白底浮起来。
 */
defineProps<{
  items: { key: string; label: string; count?: number }[];
  modelValue: string;
}>();

const emit = defineEmits<{ "update:modelValue": [key: string] }>();
</script>

<template>
  <view class="yq-tabs" role="tablist">
    <view
      v-for="item in items"
      :key="item.key"
      class="yq-tabs__item"
      :class="{ 'is-active': item.key === modelValue }"
      role="tab"
      :aria-selected="item.key === modelValue"
      @click="emit('update:modelValue', item.key)"
    >
      <text>{{ item.label }}</text>
      <text v-if="item.count">&nbsp;{{ item.count }}</text>
    </view>
  </view>
</template>

<style scoped>
.yq-tabs {
  box-sizing: border-box;
  flex: none;
  display: flex;
  padding: 3px;
  background: var(--yq-color-tabs-track);
  border: var(--yq-border-card);
  border-radius: var(--yq-radius-lg);
}

.yq-tabs__item {
  flex: 1;
  box-sizing: border-box;
  padding: 5px 0;
  display: flex;
  justify-content: center;
  border: 2px solid transparent;
  border-radius: var(--yq-radius-sm);
  font-size: 14px;
  font-weight: var(--yq-font-weight-700);
  color: var(--yq-color-text-secondary);
}

.yq-tabs__item.is-active {
  background: var(--yq-segment-active-bg);
  border: var(--yq-border-chip);
  box-shadow: var(--yq-shadow-segment-active);
  color: var(--yq-color-text);
  font-weight: var(--yq-font-weight-900);
}
</style>

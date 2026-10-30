<script setup lang="ts">
import YqIcon from "./YqIcon.vue";
import YqSheet from "./YqSheet.vue";

/**
 * 从一串选项里选一个的底部弹层（群类型、时区、转让给谁）。设计稿没有单独画，用弹层底座和设置行的样式拼。
 * 点一项就把它交给页面，当前选中的打勾。
 */
defineProps<{
  visible: boolean;
  title: string;
  options: { value: string; label: string; sub?: string }[];
  modelValue?: string;
}>();

const emit = defineEmits<{ select: [value: string]; close: [] }>();
</script>

<template>
  <YqSheet :visible="visible" :title="title" @close="emit('close')">
    <scroll-view class="list" scroll-y>
      <view
        v-for="option in options"
        :key="option.value"
        class="option"
        :class="{ 'is-current': option.value === modelValue }"
        @click="emit('select', option.value)"
      >
        <view class="option__text">
          <text class="option__label">{{ option.label }}</text>
          <text v-if="option.sub" class="option__sub">{{ option.sub }}</text>
        </view>
        <YqIcon v-if="option.value === modelValue" name="check" :size="16" />
      </view>
    </scroll-view>
  </YqSheet>
</template>

<style scoped>
.list {
  max-height: 60vh;
}

.option {
  box-sizing: border-box;
  min-height: 48px;
  padding: 8px 4px;
  display: flex;
  align-items: center;
  gap: 10px;
  border-bottom: var(--yq-border-row);
}

.option__text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.option__label {
  font-size: 15px;
  font-weight: var(--yq-font-weight-700);
}

.option.is-current .option__label {
  font-weight: var(--yq-font-weight-900);
}

.option__sub {
  font-size: 12px;
  color: var(--yq-color-text-secondary);
}
</style>

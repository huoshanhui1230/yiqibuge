<script setup lang="ts">
import type { ButtonVariant } from "./types";
import YqButton from "./YqButton.vue";
import YqSheet from "./YqSheet.vue";

/**
 * 确认卡（设计稿 JoinSheet「确认跟了？」、Flake「真的要鸽吗？」）：底部弹出，
 * 大标题 + 一句说明 + 时间块 + 自定义内容 + 两个按钮 + 底部小字。
 *
 * 表态（跟了、不跟、鸽了、撤回）用它时 timeBlock 必填，首行写清日期、星期和时间段
 * （CLAUDE.md「必须遵守」、docs/spec.md「确认卡必须展示的信息」），文案由 shared 的时间函数生成。
 * 阶段 1 先给退群、移除、转让群主、解散群组用。
 */
withDefaults(
  defineProps<{
    visible: boolean;
    title: string;
    subtitle?: string;
    /** date：首行大字（相对日 · 日期）；detail：时段时刻和标题；meta：倒计时和地点 */
    timeBlock?: { date: string; detail?: string; meta?: string } | null;
    confirmText: string;
    confirmVariant?: ButtonVariant;
    cancelText?: string;
    footnote?: string;
    loading?: boolean;
  }>(),
  {
    subtitle: "",
    timeBlock: null,
    confirmVariant: "primary",
    cancelText: "再看看",
    footnote: "",
    loading: false,
  },
);

defineEmits<{ confirm: []; cancel: [] }>();
</script>

<template>
  <YqSheet :visible="visible" :dismissible="!loading" @close="$emit('cancel')">
    <view class="yq-confirm__head">
      <text class="yq-confirm__title">{{ title }}</text>
      <text v-if="subtitle" class="yq-confirm__subtitle">{{ subtitle }}</text>
    </view>

    <view v-if="timeBlock" class="yq-confirm__time">
      <text class="yq-confirm__date">{{ timeBlock.date }}</text>
      <text v-if="timeBlock.detail" class="yq-confirm__detail">{{ timeBlock.detail }}</text>
      <text v-if="timeBlock.meta" class="yq-confirm__meta">{{ timeBlock.meta }}</text>
    </view>

    <slot />

    <template #footer>
      <view class="yq-confirm__actions">
        <YqButton
          class="yq-confirm__cancel"
          variant="secondary"
          size="lg"
          block
          :disabled="loading"
          @click="$emit('cancel')"
        >
          {{ cancelText }}
        </YqButton>
        <YqButton
          class="yq-confirm__ok"
          :variant="confirmVariant"
          size="lg"
          block
          :loading="loading"
          @click="$emit('confirm')"
        >
          {{ confirmText }}
        </YqButton>
      </view>
      <text v-if="footnote" class="yq-confirm__footnote">{{ footnote }}</text>
    </template>
  </YqSheet>
</template>

<style scoped>
.yq-confirm__head {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  text-align: center;
}

.yq-confirm__title {
  font-family: var(--yq-font-display);
  font-weight: var(--yq-font-display-weight);
  font-size: var(--yq-size-display-26);
  line-height: 1.2;
}

.yq-confirm__subtitle {
  font-size: 13px;
  color: var(--yq-color-text-secondary);
}

.yq-confirm__time {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 10px 14px;
  text-align: center;
  background: var(--yq-color-surface-inset);
  border: var(--yq-border-card);
  border-radius: var(--yq-radius-2xl);
}

.yq-confirm__date {
  font-family: var(--yq-font-display);
  font-weight: var(--yq-font-display-weight);
  font-size: var(--yq-size-display-24);
  line-height: 1.15;
}

.yq-confirm__detail {
  font-size: 14px;
  font-weight: var(--yq-font-weight-900);
}

.yq-confirm__meta {
  font-size: 12px;
  color: var(--yq-color-text-secondary);
}

.yq-confirm__actions {
  display: flex;
  gap: 12px;
  width: 100%;
}

.yq-confirm__cancel {
  flex: 1;
}

.yq-confirm__ok {
  flex: 1.6;
}

.yq-confirm__footnote {
  display: block;
  text-align: center;
  font-size: 12px;
  color: var(--yq-color-text-secondary);
}
</style>

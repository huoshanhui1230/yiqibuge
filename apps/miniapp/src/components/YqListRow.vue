<script setup lang="ts">
import { inject } from "vue";

import YqIcon from "./YqIcon.vue";

/**
 * 设置页的一行（设计稿 GroupSettings）：左边标题和一行小字说明，右边值、开关或箭头。
 * 行之间是分隔线：贴纸风、软糖风虚线，清爽风细实线（tokens.json 的 border.row）；最后一行传 divider=false。
 * - left 插槽：标题左边的小图（鸽子王评选前面的鸽子）
 * - right 插槽：自定义右边（开关、群头像图标块）
 * - below 插槽：标题下面的内容（鸽王任务卡的那一栏）
 */
withDefaults(
  defineProps<{
    label: string;
    sub?: string;
    value?: string;
    /** 值用标题字体（群名） */
    displayValue?: boolean;
    arrow?: boolean;
    danger?: boolean;
    /** 标题加粗（鸽子王评选） */
    strong?: boolean;
    /** md 46、lg 52、xl 60（鸽子王评选那行），auto 按内容；都不含分隔线 */
    size?: "md" | "lg" | "xl" | "auto";
    divider?: boolean;
  }>(),
  {
    sub: "",
    value: "",
    displayValue: false,
    arrow: false,
    danger: false,
    strong: false,
    size: "md",
    divider: true,
  },
);

defineEmits<{ click: [] }>();

const tone = inject<"default" | "king">("yqListTone", "default");
</script>

<template>
  <view
    class="yq-row"
    :class="[
      `yq-row--${size}`,
      { 'yq-row--divider': divider, 'yq-row--king': tone === 'king', 'yq-row--danger': danger },
    ]"
    @click="$emit('click')"
  >
    <slot name="left" />
    <view class="yq-row__main">
      <text class="yq-row__label" :class="{ 'yq-row__label--strong': strong || danger }">
        {{ label }}
      </text>
      <text v-if="sub" class="yq-row__sub">{{ sub }}</text>
      <slot name="below" />
    </view>
    <text v-if="value" class="yq-row__value" :class="{ 'yq-row__value--display': displayValue }">
      {{ value }}
    </text>
    <slot name="right" />
    <YqIcon v-if="arrow" name="chevron" :size="16" color="var(--yq-color-text-secondary)" />
  </view>
</template>

<style scoped>
/* 设计稿的行高不含底下的分隔线，所以不用 border-box */
.yq-row {
  box-sizing: content-box;
  display: flex;
  align-items: center;
  gap: 10px;
}

.yq-row--md {
  height: 46px;
}

.yq-row--lg {
  min-height: 52px;
}

.yq-row--xl {
  min-height: 60px;
}

.yq-row--auto {
  padding: 10px 0 12px;
}

.yq-row--divider {
  border-bottom: var(--yq-border-row);
}

.yq-row--divider.yq-row--king {
  border-bottom: var(--yq-border-row-king);
}

.yq-row__main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.yq-row__label {
  font-size: 14.5px;
  font-weight: var(--yq-font-weight-700);
}

.yq-row__label--strong {
  font-weight: var(--yq-font-weight-900);
}

.yq-row--danger .yq-row__label {
  color: var(--yq-color-text-danger);
}

.yq-row__sub {
  margin-top: -4px;
  font-size: 11.5px;
  color: var(--yq-color-text-secondary);
}

.yq-row__value {
  flex: none;
  max-width: 55%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13.5px;
  color: var(--yq-color-text-secondary);
}

.yq-row__value--display {
  font-family: var(--yq-font-display);
  font-weight: var(--yq-font-display-weight);
  font-size: var(--yq-size-display-17);
  color: var(--yq-color-text);
}

.yq-row--danger .yq-row__value {
  font-size: 11.5px;
}
</style>

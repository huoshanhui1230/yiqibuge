<script setup lang="ts">
import { textLength } from "@yiqi/shared";
import { computed } from "vue";

import { inputValue } from "../utils/events";

/**
 * 输入框（设计稿 Login「昵称」）：浅底、描边，右边可以带「2/12」计数，字数按「字」算（emoji 算一个）。
 * type="nickname" 时在小程序里是微信的昵称输入键盘，可以一键填微信昵称；
 * 那个键盘选了昵称不一定触发 input，所以失焦时也同步一次。
 */
const props = withDefaults(
  defineProps<{
    modelValue: string;
    placeholder?: string;
    maxlength?: number;
    counter?: boolean;
    type?: "text" | "nickname";
    /** 用标题字体、大一号（昵称、群名） */
    display?: boolean;
    focus?: boolean;
  }>(),
  { placeholder: "", maxlength: 12, counter: false, type: "text", display: false, focus: false },
);

const emit = defineEmits<{ "update:modelValue": [value: string]; confirm: [] }>();

const count = computed(() => `${textLength(props.modelValue)}/${props.maxlength}`);

function sync(event: Event): void {
  // 只截到上限：maxlength 按 UTF-16 算，emoji 会被多算，这里按「字」再截一次
  const value = Array.from(inputValue(event)).slice(0, props.maxlength).join("");
  emit("update:modelValue", value);
}
</script>

<template>
  <view class="yq-input" :class="{ 'yq-input--display': display }">
    <input
      class="yq-input__field"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :maxlength="maxlength * 2"
      :focus="focus"
      placeholder-class="yq-input__placeholder"
      confirm-type="done"
      @input="sync"
      @blur="sync"
      @confirm="emit('confirm')"
    />
    <text v-if="counter" class="yq-input__count">{{ count }}</text>
  </view>
</template>

<style scoped>
.yq-input {
  box-sizing: border-box;
  height: 44px;
  padding: 0 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--yq-color-surface-inset);
  border: var(--yq-border-field);
  border-radius: var(--yq-radius-md);
}

.yq-input__field {
  flex: 1;
  min-width: 0;
  height: 100%;
  font-size: 15px;
  color: var(--yq-color-text);
}

.yq-input--display .yq-input__field {
  font-family: var(--yq-font-display);
  font-weight: var(--yq-font-display-weight);
  font-size: var(--yq-size-display-20);
}

.yq-input__count {
  flex: none;
  font-size: 12px;
  color: var(--yq-color-text-secondary);
}
</style>

<style>
/* placeholder-class 在组件外层生效，不能 scoped */
.yq-input__placeholder {
  color: var(--yq-color-text-secondary);
  opacity: 0.7;
}
</style>

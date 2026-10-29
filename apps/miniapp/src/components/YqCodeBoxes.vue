<script setup lang="ts">
import { INVITE_CODE_LENGTH, normalizeInviteCode } from "@yiqi/shared";
import { computed, ref } from "vue";

import { inputValue } from "../utils/events";

/**
 * 6 位邀请码的格子（设计稿 Invite「③ 说邀请码」）。
 * 展示用：一格一个字；输入用（editable）：点格子弹键盘，大小写、全角、空格都会整理成标准写法。
 */
const props = withDefaults(
  defineProps<{
    modelValue: string;
    editable?: boolean;
    /** 一打开就弹键盘（输入邀请码的弹层用）；默认点了格子才弹 */
    autofocus?: boolean;
  }>(),
  { editable: false, autofocus: false },
);

const emit = defineEmits<{ "update:modelValue": [value: string]; complete: [code: string] }>();

const focused = ref(props.editable && props.autofocus);
const cells = computed(() =>
  Array.from({ length: INVITE_CODE_LENGTH }, (_, index) => props.modelValue[index] ?? ""),
);

function onInput(event: Event): void {
  const value = normalizeInviteCode(inputValue(event)).slice(0, INVITE_CODE_LENGTH);
  emit("update:modelValue", value);

  if (value.length === INVITE_CODE_LENGTH) {
    emit("complete", value);
  }
}
</script>

<template>
  <view class="yq-code" @click="focused = editable">
    <view
      v-for="(char, index) in cells"
      :key="index"
      class="yq-code__cell"
      :class="{ 'is-current': editable && index === modelValue.length }"
    >
      <text>{{ char }}</text>
    </view>
    <input
      v-if="editable"
      class="yq-code__input"
      type="text"
      :value="modelValue"
      :focus="focused"
      :maxlength="INVITE_CODE_LENGTH * 2"
      @input="onInput"
      @blur="focused = false"
    />
  </view>
</template>

<style scoped>
.yq-code {
  position: relative;
  display: flex;
  align-items: center;
  gap: 6px;
}

.yq-code__cell {
  box-sizing: border-box;
  width: 36px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--yq-color-surface-inset);
  border: var(--yq-border-card);
  border-radius: var(--yq-radius-sm);
  font-family: var(--yq-font-display);
  font-weight: var(--yq-font-display-weight);
  font-size: var(--yq-size-display-24);
}

.yq-code__cell.is-current {
  background: var(--yq-color-surface);
}

/* 真正接收输入的框盖在格子上、看不见 */
.yq-code__input {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
}
</style>

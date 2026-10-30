<script setup lang="ts">
import { ref, watch } from "vue";

import YqButton from "./YqButton.vue";
import YqInput from "./YqInput.vue";
import YqSheet from "./YqSheet.vue";

/**
 * 改一段文字的底部弹层（群名、群昵称、鸽王任务卡）。设计稿没有单独画，用弹层底座和输入框拼。
 * 打开时带上原来的值；点保存把新值交给页面（页面负责调接口、校验提示）。
 */
const props = withDefaults(
  defineProps<{
    visible: boolean;
    title: string;
    value: string;
    maxlength: number;
    placeholder?: string;
    hint?: string;
    /** 用标题字体（群名） */
    display?: boolean;
    loading?: boolean;
  }>(),
  { placeholder: "", hint: "", display: false, loading: false },
);

const emit = defineEmits<{ save: [value: string]; close: [] }>();

const draft = ref(props.value);

watch(
  () => props.visible,
  (visible) => {
    if (visible) draft.value = props.value;
  },
);
</script>

<template>
  <YqSheet :visible="visible" :title="title" :dismissible="!loading" @close="emit('close')">
    <YqInput
      v-model="draft"
      :maxlength="maxlength"
      :placeholder="placeholder"
      :display="display"
      counter
      :focus="visible"
      @confirm="emit('save', draft)"
    />
    <text v-if="hint" class="hint">{{ hint }}</text>
    <template #footer>
      <view class="actions">
        <YqButton
          class="actions__cancel"
          variant="secondary"
          size="lg"
          block
          @click="emit('close')"
        >
          算了
        </YqButton>
        <YqButton
          class="actions__ok"
          variant="primary"
          size="lg"
          block
          :loading="loading"
          @click="emit('save', draft)"
        >
          保存
        </YqButton>
      </view>
    </template>
  </YqSheet>
</template>

<style scoped>
.hint {
  font-size: 12px;
  color: var(--yq-color-text-secondary);
}

.actions {
  display: flex;
  gap: 12px;
}

.actions__cancel {
  flex: 1;
}

.actions__ok {
  flex: 1.6;
}
</style>

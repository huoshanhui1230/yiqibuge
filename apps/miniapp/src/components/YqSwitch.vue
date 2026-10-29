<script setup lang="ts">
/** 开关（设计稿 GroupSettings）：开是成局绿，关是关闭态底色；圆钮白底带描边。 */
const props = withDefaults(defineProps<{ modelValue: boolean; disabled?: boolean }>(), {
  disabled: false,
});

const emit = defineEmits<{ "update:modelValue": [value: boolean] }>();

function toggle(): void {
  if (!props.disabled) {
    emit("update:modelValue", !props.modelValue);
  }
}
</script>

<template>
  <view
    class="yq-switch"
    :class="{ 'is-on': modelValue, 'is-disabled': disabled }"
    role="switch"
    :aria-checked="modelValue"
    @click.stop="toggle"
  >
    <view class="yq-switch__knob" />
  </view>
</template>

<style scoped>
.yq-switch {
  position: relative;
  box-sizing: border-box;
  flex: none;
  width: 48px;
  height: 28px;
  padding: 2px;
  display: flex;
  align-items: center;
  background: var(--yq-switch-off);
  border: var(--yq-border-card);
  border-radius: 999px;
}

.yq-switch.is-on {
  justify-content: flex-end;
  background: var(--yq-switch-on);
}

/* 点击区补到 44 */
.yq-switch::before {
  content: "";
  position: absolute;
  left: -4px;
  right: -4px;
  top: -8px;
  bottom: -8px;
}

.yq-switch__knob {
  box-sizing: border-box;
  width: 19px;
  height: 19px;
  background: var(--yq-color-surface);
  border: var(--yq-border-knob);
  border-radius: 50%;
}

.is-disabled {
  opacity: 0.5;
}
</style>

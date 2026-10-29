<script setup lang="ts">
import type { ButtonSize, ButtonVariant } from "./types";

/**
 * 按钮（设计稿 Main「按钮与标签」）：
 * - primary：跟了、主按钮；secondary：不跟、次按钮；danger：确认鸽了这类不可逆操作（鸽子灰）；
 *   king：黄色按钮（建个群、邀请好友、复制）。
 * - 尺寸按设计稿：xl 56（登录、加入群组）、lg 50（主题选择页底部）、md 46（Main）、
 *   sm 42（群组页顶部）、xs 30（复制、保存到相册）、mini 25（群组主页的邀请好友、群设置）。
 * - 40 高以上的按钮字体跟主题走（软糖风用快乐体、大 1.5）；小按钮一律正文字体。
 * - 小按钮的点击区补到 44（.claude/rules/miniapp.md「尺寸和交互」）。
 * 用原生 button，这样 share、chooseAvatar 这些 open-type 才能用。
 */
const props = withDefaults(
  defineProps<{
    variant?: ButtonVariant;
    size?: ButtonSize;
    block?: boolean;
    disabled?: boolean;
    loading?: boolean;
    openType?: string;
  }>(),
  {
    variant: "primary",
    size: "md",
    block: false,
    disabled: false,
    loading: false,
    openType: undefined,
  },
);

const emit = defineEmits<{
  click: [];
  chooseavatar: [event: { detail: { avatarUrl: string } }];
}>();

function onClick(): void {
  if (!props.disabled && !props.loading) {
    emit("click");
  }
}
</script>

<template>
  <button
    class="yq-btn"
    :class="[
      `yq-btn--${variant}`,
      `yq-btn--${size}`,
      { 'yq-btn--block': block, 'is-disabled': disabled || loading },
    ]"
    :open-type="disabled || loading ? undefined : openType"
    :disabled="disabled || loading"
    hover-class="yq-btn--pressed"
    @click="onClick"
    @chooseavatar="emit('chooseavatar', $event)"
  >
    <slot name="icon" />
    <text class="yq-btn__label"><slot /></text>
  </button>
</template>

<style scoped>
.yq-btn {
  position: relative;
  box-sizing: border-box;
  margin: 0;
  padding: 0 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  overflow: visible;
  line-height: 1;
  white-space: nowrap;
  border: var(--yq-border-button);
  border-radius: var(--yq-radius-button);
  font-family: var(--yq-font-button-family);
  font-weight: var(--yq-font-button-weight);
}

/* 小程序 button 自带一圈边框画在 ::after 上，去掉 */
.yq-btn::after {
  border: none;
}

.yq-btn--block {
  display: flex;
  width: 100%;
}

/* ---------- 颜色 ---------- */
.yq-btn--primary {
  background: var(--yq-button-primary-bg);
  color: var(--yq-button-primary-fg);
  box-shadow: var(--yq-shadow-primary-md);
}

.yq-btn--secondary {
  background: var(--yq-button-secondary-bg);
  color: var(--yq-button-secondary-fg);
  box-shadow: var(--yq-shadow-control-md);
}

.yq-btn--danger {
  background: var(--yq-button-danger-bg);
  color: var(--yq-button-danger-fg);
  box-shadow: var(--yq-shadow-flaked-md);
}

.yq-btn--king {
  background: var(--yq-button-king-bg);
  color: var(--yq-button-king-fg);
  box-shadow: var(--yq-shadow-king-md);
}

/* ---------- 尺寸 ---------- */
.yq-btn--xl {
  height: 56px;
  border: var(--yq-border-strong);
  border-radius: var(--yq-radius-xl);
  font-size: calc(18px + var(--yq-font-button-delta));
}

.yq-btn--xl.yq-btn--primary {
  box-shadow: var(--yq-shadow-primary-lg);
}

.yq-btn--xl.yq-btn--secondary {
  box-shadow: var(--yq-shadow-control-lg);
}

.yq-btn--lg {
  height: 50px;
  font-size: calc(16px + var(--yq-font-button-delta));
}

.yq-btn--md {
  height: 46px;
  font-size: calc(16px + var(--yq-font-button-delta));
}

.yq-btn--sm {
  height: 42px;
  padding: 0 14px;
  font-size: calc(14.5px + var(--yq-font-button-delta));
}

/* 小按钮：正文字体，字重跟主题（清爽风 900 → 700） */
.yq-btn--xs,
.yq-btn--mini {
  font-family: var(--yq-font-body);
  font-weight: var(--yq-font-weight-900);
}

.yq-btn--xs {
  height: 30px;
  padding: 0 14px;
  border-radius: var(--yq-radius-md);
  font-size: 13.5px;
  box-shadow: var(--yq-shadow-control-sm);
}

.yq-btn--mini {
  height: 25px;
  padding: 0 10px;
  border: var(--yq-border-chip);
  border-radius: var(--yq-radius-sm);
  font-size: 12.5px;
  box-shadow: none;
}

/* 小号次按钮：清爽风是白底细框（Invite「保存到相册」、GroupHome「群设置」） */
.yq-btn--xs.yq-btn--secondary {
  background: var(--yq-color-surface);
  border: var(--yq-border-field);
}

.yq-btn--mini.yq-btn--secondary {
  background: var(--yq-color-surface);
  border: var(--yq-border-field-thin);
}

.yq-btn--xs.yq-btn--king {
  box-shadow: var(--yq-shadow-king-sm);
}

.yq-btn--mini.yq-btn--king {
  box-shadow: var(--yq-shadow-king-sm);
}

.yq-btn--xs.yq-btn--primary,
.yq-btn--mini.yq-btn--primary {
  box-shadow: var(--yq-shadow-primary-sm);
}

/* 小按钮的点击区往外补，凑够 44 */
.yq-btn--xs::before,
.yq-btn--mini::before {
  content: "";
  position: absolute;
  left: -4px;
  right: -4px;
  top: -10px;
  bottom: -10px;
}

.yq-btn--pressed {
  transform: translate(1px, 1px);
}

.is-disabled {
  opacity: 0.45;
}

.yq-btn__label {
  line-height: 1;
}
</style>

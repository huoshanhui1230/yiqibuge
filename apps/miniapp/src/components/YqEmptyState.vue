<script setup lang="ts">
import YqIllustration from "./YqIllustration.vue";

/**
 * 空状态。
 * - dashed：横着的虚线卡，鸽子在左（设计稿 Groups 底部「还想约别的圈子？」）
 * - plain：竖着居中，大鸽子 + 标题 + 说明 + 按钮（docs/spec.md「首页空状态」：
 *   鸽子吉祥物 +「这周还没人约，你来当局长？」+ 发起按钮）
 */
withDefaults(
  defineProps<{
    title: string;
    desc?: string;
    variant?: "dashed" | "plain";
  }>(),
  { desc: "", variant: "plain" },
);
</script>

<template>
  <view v-if="variant === 'dashed'" class="yq-empty yq-empty--dashed">
    <YqIllustration name="gg" :width="46" />
    <view class="yq-empty__text">
      <text class="yq-empty__title">{{ title }}</text>
      <text v-if="desc" class="yq-empty__desc">{{ desc }}</text>
    </view>
    <slot />
  </view>

  <view v-else class="yq-empty yq-empty--plain">
    <YqIllustration name="gg" :width="96" />
    <text class="yq-empty__headline">{{ title }}</text>
    <text v-if="desc" class="yq-empty__desc">{{ desc }}</text>
    <view v-if="$slots.default" class="yq-empty__action">
      <slot />
    </view>
  </view>
</template>

<style scoped>
.yq-empty--dashed {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border: var(--yq-border-dashed);
  border-radius: var(--yq-radius-card);
}

.yq-empty__text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.yq-empty__title {
  font-size: 14px;
  font-weight: var(--yq-font-weight-900);
}

.yq-empty__desc {
  font-size: 12px;
  color: var(--yq-color-text-secondary);
}

.yq-empty--plain {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 28px 16px;
  text-align: center;
}

.yq-empty__headline {
  margin-top: 6px;
  font-family: var(--yq-font-display);
  font-weight: var(--yq-font-display-weight);
  font-size: var(--yq-size-display-20);
}

.yq-empty--plain .yq-empty__desc {
  font-size: 13px;
}

.yq-empty__action {
  margin-top: 10px;
}
</style>

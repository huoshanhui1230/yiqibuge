<script setup lang="ts">
/**
 * 卡片。
 * - size：md 是普通卡片（Groups 群卡片、Invite 三张卡）；lg 是大卡（Login「先认识一下」、
 *   JoinLanding 群卡片），圆角和投影都大一档；sm 是设置页那种一组行（GroupSettings）。
 * - variant：king 是鸽子王的浅黄区；dashed 是虚线框（Groups 底部「还想约别的圈子？」、
 *   GroupHome 鸽值规则）；dashed 默认没底色，fill 才填白。
 * - band 插槽：卡片底部的横条（群卡片的本周鸽子王、和平周、已关闭），bandTone 决定底色。
 */
withDefaults(
  defineProps<{
    size?: "sm" | "md" | "lg";
    variant?: "default" | "king" | "dashed";
    padding?: "none" | "sm" | "md" | "lg";
    /** dashed 时也填白底 */
    fill?: boolean;
    /** 大卡用粗描边（风格说明板 Main 的分区卡片） */
    strong?: boolean;
    bandTone?: "king" | "peace" | "muted";
  }>(),
  { size: "md", variant: "default", padding: "md", fill: false, strong: false, bandTone: "king" },
);

defineEmits<{ click: [] }>();
</script>

<template>
  <view
    class="yq-card"
    :class="[
      `yq-card--${size}`,
      `yq-card--${variant}`,
      { 'yq-card--fill': fill, 'yq-card--strong': strong },
    ]"
    @click="$emit('click')"
  >
    <view class="yq-card__body" :class="`yq-card__body--${padding}`">
      <slot />
    </view>
    <view v-if="$slots.band" class="yq-card__band" :class="`yq-card__band--${bandTone}`">
      <slot name="band" />
    </view>
  </view>
</template>

<style scoped>
.yq-card {
  box-sizing: border-box;
  flex: none;
  overflow: hidden;
  background: var(--yq-color-surface);
  border: var(--yq-border-card);
  border-radius: var(--yq-radius-card);
  box-shadow: var(--yq-shadow-card);
}

.yq-card--lg {
  border-radius: var(--yq-radius-3xl);
  box-shadow: var(--yq-shadow-surface-xl);
}

.yq-card--sm {
  border-radius: var(--yq-radius-2xl);
  box-shadow: var(--yq-shadow-surface-md);
}

.yq-card--strong {
  border: var(--yq-border-strong);
}

/* 浅黄底的鸽子王区，清爽风不带投影 */
.yq-card--king {
  background: var(--yq-color-surface-king);
  box-shadow: var(--yq-shadow-control-md);
}

.yq-card--dashed {
  background: transparent;
  border: var(--yq-border-dashed);
  box-shadow: none;
}

.yq-card--dashed.yq-card--fill {
  background: var(--yq-color-surface);
}

.yq-card__body--none {
  padding: 0;
}

.yq-card__body--sm {
  padding: 10px 14px;
}

.yq-card__body--md {
  padding: 12px 14px;
}

.yq-card__body--lg {
  padding: 16px;
}

.yq-card__band {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  border-top: var(--yq-border-band);
  font-size: 13px;
  font-weight: var(--yq-font-weight-900);
}

.yq-card__band--king {
  background: var(--yq-band-king);
}

.yq-card__band--peace {
  background: var(--yq-band-peace);
}

.yq-card__band--muted {
  padding: 9px 14px;
  background: var(--yq-band-muted);
  color: var(--yq-color-text-secondary);
  font-size: 12.5px;
  font-weight: var(--yq-font-weight-700);
}
</style>

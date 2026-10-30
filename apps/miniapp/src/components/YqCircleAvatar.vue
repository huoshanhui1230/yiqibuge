<script setup lang="ts">
import { CIRCLE_AVATAR_TINT, parseCircleAvatar, type ThemeName } from "@yiqi/shared";
import { computed } from "vue";

import { useTheme } from "../theme/useTheme";
import { rpx } from "../utils/units";

/**
 * 群头像：彩色底的方块图标（预设）或上传的图片（docs/spec.md「创建群组」）。
 * 尺寸都是设计稿上出现过的：34（群设置）、48（群组列表）、62（群组主页）、76（加入落地页，歪一点）。
 */
type TileSize = 22 | 30 | 34 | 48 | 62 | 76;

const props = withDefaults(
  defineProps<{
    /** 库里存的字符串：preset:<key> 或图片地址 */
    avatar: string;
    size?: TileSize;
    /** 歪一点（加入落地页） */
    tilt?: boolean;
    /** 白底版（邀请卡片里叠在彩色底上那个） */
    plain?: boolean;
    theme?: ThemeName;
  }>(),
  { size: 48, tilt: false, plain: false, theme: undefined },
);

const { theme: currentTheme } = useTheme();
const parsed = computed(() => parseCircleAvatar(props.avatar));

/** 图标在方块里的大小，按设计稿：48 的方块放 26 的图标 */
const ICON_SIZE: Record<TileSize, number> = { 22: 14, 30: 18, 34: 20, 48: 26, 62: 34, 76: 42 };

const tileStyle = computed(() => {
  const tint = parsed.value.kind === "preset" ? CIRCLE_AVATAR_TINT[parsed.value.preset] : "green";
  return {
    width: rpx(props.size),
    height: rpx(props.size),
    background: props.plain ? "var(--yq-color-surface)" : `var(--yq-tile-${tint})`,
  };
});

const iconSrc = computed(() =>
  parsed.value.kind === "preset"
    ? `/static/themes/${props.theme ?? currentTheme.value}/tile-${parsed.value.preset}.svg`
    : "",
);
const iconStyle = computed(() => ({
  width: rpx(ICON_SIZE[props.size]),
  height: rpx(ICON_SIZE[props.size]),
}));
</script>

<template>
  <view
    class="yq-tile"
    :class="[`yq-tile--${size}`, { 'yq-tile--tilt': tilt, 'yq-tile--formed': !plain }]"
    :style="tileStyle"
  >
    <image
      v-if="parsed.kind === 'image'"
      class="yq-tile__photo"
      :src="parsed.url"
      mode="aspectFill"
    />
    <image v-else class="yq-tile__icon" :src="iconSrc" :style="iconStyle" />
  </view>
</template>

<style scoped>
.yq-tile {
  box-sizing: border-box;
  flex: none;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  border: var(--yq-border-card);
}

.yq-tile__photo {
  width: 100%;
  height: 100%;
}

.yq-tile__icon {
  display: block;
}

.yq-tile--22 {
  border: var(--yq-border-thin);
  border-radius: var(--yq-radius-xs);
}

.yq-tile--30,
.yq-tile--34 {
  border: var(--yq-border-chip);
  border-radius: var(--yq-radius-sm);
}

.yq-tile--48 {
  border-radius: var(--yq-radius-lg);
}

.yq-tile--62 {
  border-radius: var(--yq-radius-2xl);
  box-shadow: var(--yq-shadow-control-md);
}

.yq-tile--76 {
  border: var(--yq-border-strong);
  border-radius: var(--yq-radius-3xl);
  box-shadow: var(--yq-shadow-control-md);
}

/* 大图标块的投影在软糖风跟着绿底变绿（设计稿只画了绿色那块） */
.yq-tile--62.yq-tile--formed,
.yq-tile--76.yq-tile--formed {
  box-shadow: var(--yq-shadow-formed-md);
}

/* 歪着贴，清爽风摆正（--yq-tilt-scale 是 0） */
.yq-tile--tilt {
  transform: rotate(calc(-4deg * var(--yq-tilt-scale)));
}
</style>

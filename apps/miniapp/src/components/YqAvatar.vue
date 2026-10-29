<script setup lang="ts">
import { avatarColorIndex, avatarLetter, type ThemeName } from "@yiqi/shared";
import { computed } from "vue";

import { HOOD_CANVAS, HOOD_GEOMETRY, type Box } from "../theme/hood";
import { THEME_RUNTIME } from "../theme/theme-meta.generated";
import { useTheme } from "../theme/useTheme";
import { rpx } from "../utils/units";
import type { AvatarPerson, AvatarState, KingKind } from "./types";
import YqIcon from "./YqIcon.vue";

/**
 * 头像（设计稿 Main「头像状态」「小尺寸也认得出」）。
 * - 有照片显示照片，没有就是字母头像：底色按 id 稳定取 8 色之一，三套主题同一个下标。
 * - 跟了：右下角一个勾；鸽了：变灰、虚线圈、一只鸽子飞走。
 * - 鸽子王：本人头像露在头套脸洞里，头顶戴皇冠；连任加墨镜，月度加披风和大皇冠。
 *   四层叠起来（披风、头套后片、脸、头套前片、墨镜、皇冠），每层都是当前主题的插画。
 *
 * 尺寸按设计稿：字母头像的圆在 60 的画布里半径 26、描边 3.5（清爽风是白圈 2.6），
 * 头套在 120 的画布里，脸洞位置每套主题不一样（theme/hood.ts）。
 */
const props = withDefaults(
  defineProps<{
    user: AvatarPerson | null;
    /** 设计稿 px：整个头像占的方框 */
    size?: number;
    state?: AvatarState;
    /** 不传就看 user.king */
    king?: KingKind | null;
    /** 主题选择页里画别的主题时用 */
    theme?: ThemeName;
  }>(),
  { size: 40, state: "normal", king: undefined, theme: undefined },
);

const { theme: currentTheme } = useTheme();
const theme = computed(() => props.theme ?? currentTheme.value);
const kingKind = computed(() =>
  props.king === undefined ? (props.user?.king ?? null) : props.king,
);
const colorVar = computed(() => avatarColorIndex(props.user?.id ?? "0") + 1);
const letter = computed(() => avatarLetter(props.user?.name ?? ""));
const photo = computed(() => props.user?.avatarUrl ?? "");
const art = (name: string) => `/static/themes/${theme.value}/${name}.svg`;

const boxStyle = computed(() => ({ width: rpx(props.size), height: rpx(props.size) }));

// ---------- 普通头像 ----------

const ringRatio = computed(() => THEME_RUNTIME[theme.value].avatarRingRatio);

const circleStyle = computed(() => {
  const ring = props.size * ringRatio.value;
  // 圆半径 26（60 画布）再加半个描边，外沿占方框的 (52/60 + 描边比例)
  const diameter = props.size * (52 / 60 + ringRatio.value);
  const flaked = props.state === "flaked";

  return {
    width: rpx(diameter),
    height: rpx(diameter),
    borderWidth: rpx(ring),
    borderStyle: flaked ? "dashed" : "solid",
    borderColor: flaked ? "var(--yq-avatar-flaked-ring)" : "var(--yq-avatar-ring)",
    background: flaked ? "var(--yq-avatar-flaked-bg)" : `var(--yq-avatar-${colorVar.value}-bg)`,
    color: flaked ? "var(--yq-avatar-flaked-fg)" : `var(--yq-avatar-${colorVar.value}-fg)`,
    fontSize: rpx(props.size * (26 / 60)),
  };
});

/** 跟了的勾：60 画布里圆心 (47, 47)、半径 9、描边 2.5 */
const badgeStyle = computed(() => {
  const diameter = props.size * (20.5 / 60);
  const offset = props.size * ((47 - 10.25) / 60);

  return {
    left: rpx(offset),
    top: rpx(offset),
    width: rpx(diameter),
    height: rpx(diameter),
    borderWidth: rpx(props.size * (2.5 / 60)),
  };
});

/** 飞走的鸽子：60 画布里 x 30、y 40、宽 30、高 19 */
const flyStyle = computed(() => ({
  left: rpx(props.size * 0.5),
  top: rpx(props.size * (40 / 60)),
  width: rpx(props.size * 0.5),
  height: rpx(props.size * (19 / 60)),
}));

// ---------- 鸽子王 ----------

const hood = computed(() => HOOD_GEOMETRY[theme.value]);

function boxToStyle(box: Box) {
  const scale = props.size / HOOD_CANVAS;

  return {
    left: rpx(box.x * scale),
    top: rpx(box.y * scale),
    width: rpx(box.w * scale),
    height: rpx(box.h * scale),
  };
}

const faceStyle = computed(() => {
  const { cx, cy, r } = hood.value.face;

  return {
    ...boxToStyle({ x: cx - r, y: cy - r, w: r * 2, h: r * 2 }),
    background: `var(--yq-avatar-${colorVar.value}-bg)`,
    fontSize: rpx(props.size * (27 / HOOD_CANVAS)),
  };
});

const crownStyle = computed(() =>
  boxToStyle(kingKind.value === "month" ? hood.value.crownMonth : hood.value.crown),
);
</script>

<template>
  <view class="yq-avatar" :style="boxStyle">
    <template v-if="kingKind">
      <image v-if="kingKind === 'month'" class="yq-avatar__layer" :src="art('cape')" />
      <image class="yq-avatar__layer" :src="art('hood-back')" />
      <view class="yq-avatar__face" :style="faceStyle">
        <image v-if="photo" class="yq-avatar__photo" :src="photo" mode="aspectFill" />
        <text v-else class="yq-avatar__letter">{{ letter }}</text>
      </view>
      <image class="yq-avatar__layer" :src="art('hood-front')" />
      <image v-if="kingKind === 'streak'" class="yq-avatar__layer" :src="art('shades')" />
      <image class="yq-avatar__crown" :src="art('crown')" :style="crownStyle" />
    </template>

    <template v-else>
      <view class="yq-avatar__circle" :style="circleStyle">
        <image v-if="photo" class="yq-avatar__photo" :src="photo" mode="aspectFill" />
        <text v-else class="yq-avatar__letter">{{ letter }}</text>
      </view>
      <view v-if="state === 'in'" class="yq-avatar__badge" :style="badgeStyle">
        <YqIcon name="check" :size="size * 0.17" color="var(--yq-color-text)" />
      </view>
      <image v-if="state === 'flaked'" class="yq-avatar__fly" :src="art('fly')" :style="flyStyle" />
    </template>
  </view>
</template>

<style scoped>
.yq-avatar {
  position: relative;
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
}

.yq-avatar__circle {
  box-sizing: border-box;
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.yq-avatar__letter {
  font-family: var(--yq-font-body);
  font-weight: var(--yq-font-weight-900);
  line-height: 1;
}

.yq-avatar__photo {
  width: 100%;
  height: 100%;
}

.yq-avatar__badge {
  position: absolute;
  box-sizing: border-box;
  border-style: solid;
  border-color: var(--yq-avatar-ring);
  border-radius: 50%;
  background: var(--yq-color-accent);
  display: flex;
  align-items: center;
  justify-content: center;
}

.yq-avatar__fly,
.yq-avatar__crown {
  position: absolute;
}

.yq-avatar__layer {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
}

.yq-avatar__face {
  position: absolute;
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--yq-color-text);
}
</style>

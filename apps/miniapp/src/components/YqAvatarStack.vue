<script setup lang="ts">
import { computed } from "vue";

import { rpx } from "../utils/units";
import type { AvatarPerson } from "./types";
import YqAvatar from "./YqAvatar.vue";

/**
 * 叠放的头像（JoinLanding 成员墙、Invite 卡片、GroupHome「其余 6 人本周零鸽」）。
 * 鸽子王戴头套，头套版画得比别人大一圈（设计稿里 36 的头像墙，鸽王是 44）。
 */
const props = withDefaults(
  defineProps<{
    users: AvatarPerson[];
    /** 最多显示几个，多出来的写「+N」 */
    max?: number;
    /** 设计稿 px */
    size?: number;
    /** 后一个压住前一个多少，设计稿 px */
    overlap?: number;
    /** 鸽王头像的尺寸，不传就是 size × 1.22 */
    kingSize?: number;
  }>(),
  { max: 8, size: 36, overlap: 8, kingSize: undefined },
);

const shown = computed(() => props.users.slice(0, props.max));
const extra = computed(() => Math.max(0, props.users.length - props.max));

function itemStyle(user: AvatarPerson, index: number) {
  const size = user.king ? (props.kingSize ?? props.size * 1.22) : props.size;
  return {
    marginLeft: index === 0 ? "0" : rpx(-props.overlap),
    zIndex: user.king ? props.users.length + 1 : index,
    width: rpx(size),
    height: rpx(size),
  };
}

const extraStyle = computed(() => ({
  width: rpx(props.size),
  height: rpx(props.size),
  marginLeft: rpx(-props.overlap),
  fontSize: rpx(props.size * 0.36),
}));
</script>

<template>
  <view class="yq-stack">
    <view
      v-for="(user, index) in shown"
      :key="user.id"
      class="yq-stack__item"
      :style="itemStyle(user, index)"
    >
      <YqAvatar :user="user" :size="user.king ? (kingSize ?? size * 1.22) : size" />
    </view>
    <view v-if="extra > 0" class="yq-stack__extra" :style="extraStyle">+{{ extra }}</view>
  </view>
</template>

<style scoped>
.yq-stack {
  display: flex;
  align-items: flex-end;
}

.yq-stack__item {
  position: relative;
  flex: none;
}

.yq-stack__extra {
  position: relative;
  flex: none;
  box-sizing: border-box;
  border: var(--yq-border-chip);
  border-radius: 50%;
  background: var(--yq-color-surface-muted);
  color: var(--yq-color-text);
  font-weight: var(--yq-font-weight-900);
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>

<script setup lang="ts">
import { onLoad } from "@dcloudio/uni-app";
import { THEMES, THEME_META, type ThemeName } from "@yiqi/shared";
import { computed, ref, watch } from "vue";

import YqAvatar from "../../components/YqAvatar.vue";
import YqButton from "../../components/YqButton.vue";
import YqChip from "../../components/YqChip.vue";
import YqIllustration from "../../components/YqIllustration.vue";
import YqNavBar from "../../components/YqNavBar.vue";
import YqPage from "../../components/YqPage.vue";
import type { AvatarPerson } from "../../components/types";
import { platform } from "../../platform";
import { setTheme, useTheme } from "../../theme/useTheme";
import { toast } from "../../utils/feedback";
import { rpx } from "../../utils/units";

/**
 * 主题选择（设计稿 ThemePicker）。入口阶段 4 接到「设置 › 外观 › 主题」，现在从「我的」进来。
 * 点一张卡只是选中（「预览中」），页面不跟着换；点底部按钮才真的换，存到本地和用户设置。
 *
 * 每张卡左边的小样、色块和底下三只鸽子王，都包在那套主题的类名里：
 * CSS 变量按那套主题取值，插画按那套主题取文件，所以不管当前是哪套，小样都是它自己的样子。
 */
const { theme } = useTheme();
const picked = ref<ThemeName>(theme.value);
const saving = ref(false);

/** 小样右下角那只鸽子的大小，照设计稿 */
const MASCOT_WIDTH: Record<ThemeName, number> = { sticker: 34, cute: 36, clean: 30 };
/** 三只鸽子王的大小，照设计稿 */
const KING_SIZE: Record<ThemeName, number> = { sticker: 52, cute: 56, clean: 52 };
/** 色块：底色、强调色、鸽王黄、成局绿、鸽子灰 */
const SWATCHES = ["bg", "accent", "king", "formed", "flaked"] as const;
/** 鸽子王示范用的人，id 取了一个字母头像是浅蓝底的 */
const SAMPLE_KING: AvatarPerson = { id: "u-wang-8", name: "小王", king: "week" };

function nextTheme(name: ThemeName): ThemeName {
  return THEMES[(THEMES.indexOf(name) + 1) % THEMES.length] ?? name;
}

/**
 * 截图走查用：?preview=next 时选中当前主题的下一套，和设计稿画的状态一样。
 * 截图工具在同一页里依次换三套主题，所以要跟着当前主题变；用户一点就不再跟。
 */
const previewNext = ref(false);

onLoad((query) => {
  if (query?.preview === "next") {
    previewNext.value = true;
    picked.value = nextTheme(theme.value);
  }
});

watch(theme, (current) => {
  if (previewNext.value) picked.value = nextTheme(current);
});

function pick(name: ThemeName): void {
  previewNext.value = false;
  picked.value = name;
}

const pickedName = computed(() => THEME_META[picked.value].name);
const unchanged = computed(() => picked.value === theme.value);

// 行内样式不经过 px→rpx 插件：设计稿的 24 自己换，安全区是屏幕 px 原样加
const barStyle = { paddingBottom: `calc(${rpx(24)} + ${platform.getNavMetrics().safeAreaBottom}px)` };

async function apply(): Promise<void> {
  if (unchanged.value || saving.value) return;
  previewNext.value = false;
  const name = pickedName.value;
  saving.value = true;
  try {
    await setTheme(picked.value);
    toast(`换成${name}了`);
  } catch {
    // 本地已经换好了，只是没存到账号上；下次换主题或重新登录时再存
    toast(`换成${name}了，同步到账号没成功，下次再试`);
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <YqPage>
    <YqNavBar title="主题" />

    <view class="body">
      <view class="intro">
        <text class="intro__title">换身皮肤</text>
        <text class="intro__desc">只改你自己看到的样子，群友看到的是他们自己选的</text>
      </view>

      <view class="options" role="radiogroup" aria-label="主题">
        <view
          v-for="name in THEMES"
          :key="name"
          class="option"
          :class="{ 'is-picked': name === picked }"
          role="radio"
          :aria-checked="name === picked"
          @click="pick(name)"
        >
          <view class="thumb" :class="`yq-theme-${name}`" aria-hidden="true">
            <view class="thumb__card">
              <view class="thumb__line thumb__line--strong" />
              <view class="thumb__line thumb__line--soft" />
            </view>
            <view class="thumb__button" />
            <view v-if="name === 'sticker'" class="thumb__sticker" />
            <view class="thumb__mascot" :class="{ 'yq-anim thumb__mascot--bob': name === 'cute' }">
              <YqIllustration name="gg" :theme="name" :width="MASCOT_WIDTH[name]" />
            </view>
          </view>

          <view class="option__text">
            <view class="option__head">
              <text class="option__name">{{ THEME_META[name].name }}</text>
              <YqChip v-if="name === theme" tone="formed" size="badge" strong>使用中</YqChip>
              <YqChip v-else-if="name === picked" tone="king" size="badge" strong>预览中</YqChip>
            </view>
            <text class="option__desc">{{ THEME_META[name].desc }}</text>
            <view class="swatches" :class="`yq-theme-${name}`" aria-hidden="true">
              <view
                v-for="swatch in SWATCHES"
                :key="swatch"
                class="swatch"
                :class="`swatch--${swatch}`"
              />
            </view>
          </view>

          <view class="radio" :class="{ 'is-on': name === picked }">
            <view v-if="name === picked" class="radio__dot" />
          </view>
        </view>
      </view>

      <view class="kings">
        <text class="kings__title">换哪套，鸽子王都戴头套</text>
        <view class="kings__row" aria-hidden="true">
          <view v-for="name in THEMES" :key="name" class="kings__item">
            <view :class="`yq-theme-${name}`">
              <YqAvatar :user="SAMPLE_KING" :size="KING_SIZE[name]" :theme="name" />
            </view>
            <text class="kings__label">{{ THEME_META[name].name }}</text>
          </view>
        </view>
      </view>
    </view>

    <view class="bar-spacer" />
    <view class="bar" :style="barStyle">
      <YqButton variant="primary" size="lg" block :disabled="unchanged" :loading="saving" @click="apply">
        {{ unchanged ? `正在用${pickedName}` : `换成${pickedName}` }}
      </YqButton>
      <text class="bar__hint">随时能换回来，不影响任何数据</text>
    </view>
  </YqPage>
</template>

<style scoped>
.body {
  padding: 12px 16px 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.intro {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.intro__title {
  font-family: var(--yq-font-display);
  font-weight: var(--yq-font-display-weight);
  font-size: var(--yq-size-display-26);
  line-height: 1.2;
}

.intro__desc {
  font-size: 12.5px;
  color: var(--yq-color-text-secondary);
}

.options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.option {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px 10px 10px;
  background: var(--yq-color-surface);
  border: var(--yq-border-card);
  border-radius: var(--yq-radius-card);
  box-shadow: var(--yq-shadow-surface-md);
}

.option.is-picked {
  border: var(--yq-border-strong);
  box-shadow: var(--yq-shadow-selected);
  transform: translate(-1px, -1px);
}

/* 小样：变量取的是它自己那套主题 */
.thumb {
  position: relative;
  box-sizing: border-box;
  flex: none;
  width: 84px;
  height: 104px;
  padding: 8px 7px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 6px;
  background-color: var(--yq-color-bg);
  background-image: var(--yq-bg-pattern-image);
  background-size: var(--yq-bg-pattern-size);
  border: var(--yq-border-field-thin);
  border-radius: var(--yq-radius-lg);
}

.thumb__card {
  box-sizing: border-box;
  height: 30px;
  padding: 5px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: var(--yq-color-surface);
  border: var(--yq-border-chip);
  border-radius: var(--yq-radius-2xs);
  box-shadow: var(--yq-shadow-surface-sm);
}

.thumb__line {
  height: 4px;
  border-radius: 999px;
}

.thumb__line--strong {
  width: 70%;
  background: var(--yq-color-text);
}

.thumb__line--soft {
  width: 45%;
  background: var(--yq-color-divider-dashed);
}

.thumb__button {
  box-sizing: border-box;
  height: 16px;
  background: var(--yq-color-accent);
  border: var(--yq-border-chip);
  border-radius: var(--yq-radius-xs);
  box-shadow: var(--yq-shadow-primary-sm);
}

/* 贴纸风小样左下角的黄色小贴纸 */
.thumb__sticker {
  position: absolute;
  left: 7px;
  bottom: 9px;
  box-sizing: border-box;
  width: 18px;
  height: 10px;
  background: var(--yq-color-king);
  border: var(--yq-border-thin);
  border-radius: 999px;
  transform: rotate(-6deg);
}

.thumb__mascot {
  position: absolute;
  right: 3px;
  bottom: 2px;
}

.thumb__mascot--bob {
  animation: yq-bob 2.2s ease-in-out infinite;
}

@keyframes yq-bob {
  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-3px);
  }
}

.option__text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.option__head {
  display: flex;
  align-items: center;
  gap: 6px;
}

.option__name {
  font-family: var(--yq-font-display);
  font-weight: var(--yq-font-display-weight);
  font-size: var(--yq-size-display-21);
}

.option__desc {
  font-size: 12.5px;
  color: var(--yq-color-text-secondary);
}

.swatches {
  margin-top: 2px;
  display: flex;
  gap: 4px;
}

.swatch {
  box-sizing: border-box;
  width: 14px;
  height: 14px;
  border: var(--yq-border-thin);
  border-radius: 50%;
}

.swatch--bg {
  background: var(--yq-color-bg);
  border: var(--yq-border-knob);
}

.swatch--accent {
  background: var(--yq-color-accent);
}

.swatch--king {
  background: var(--yq-color-king);
}

.swatch--formed {
  background: var(--yq-color-formed);
}

.swatch--flaked {
  background: var(--yq-color-flaked);
}

.radio {
  box-sizing: border-box;
  flex: none;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--yq-color-surface);
  border: var(--yq-border-field);
  border-radius: 50%;
}

.radio.is-on {
  background: var(--yq-color-primary);
  border: var(--yq-border-card);
}

.radio__dot {
  box-sizing: border-box;
  width: 8px;
  height: 8px;
  background: var(--yq-color-surface);
  border: var(--yq-border-thin);
  border-radius: 50%;
}

.kings {
  box-sizing: border-box;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: var(--yq-color-surface);
  border: var(--yq-border-dashed-thin);
  border-radius: var(--yq-radius-2xl);
}

.kings__title {
  font-size: 13px;
  font-weight: var(--yq-font-weight-900);
}

.kings__row {
  display: flex;
  justify-content: space-around;
  align-items: flex-end;
}

.kings__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.kings__label {
  font-size: 11.5px;
  font-weight: var(--yq-font-weight-700);
}

.bar-spacer {
  height: 120px;
}

.bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  box-sizing: border-box;
  padding: 10px 16px 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  background: var(--yq-color-surface);
  border-top: var(--yq-border-band);
}

.bar__hint {
  font-size: 12px;
  color: var(--yq-color-text-secondary);
  text-align: center;
}
</style>

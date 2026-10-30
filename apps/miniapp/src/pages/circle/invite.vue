<script setup lang="ts">
import { onLoad, onShareAppMessage, onShow } from "@dcloudio/uni-app";
import {
  APP_NAME,
  CIRCLE_AVATAR_TINT,
  INVITE_TTL_DAYS,
  formatMonthDay,
  parseCircleAvatar,
  type CircleDetailDto,
  type InviteDto,
  type UserBrief,
} from "@yiqi/shared";
import { computed, ref } from "vue";

import YqAvatarStack from "../../components/YqAvatarStack.vue";
import YqButton from "../../components/YqButton.vue";
import YqCard from "../../components/YqCard.vue";
import YqCircleAvatar from "../../components/YqCircleAvatar.vue";
import YqCodeBoxes from "../../components/YqCodeBoxes.vue";
import YqEmptyState from "../../components/YqEmptyState.vue";
import YqIcon from "../../components/YqIcon.vue";
import YqIllustration from "../../components/YqIllustration.vue";
import YqNavBar from "../../components/YqNavBar.vue";
import YqPage from "../../components/YqPage.vue";
import { api } from "../../request";
import { errorCode, errorMessage, toast, toastError } from "../../utils/feedback";

/**
 * 邀请好友（设计稿 Invite）：发微信卡片、存邀请海报、说邀请码，三种共用一个 7 天有效期，
 * 过期了打开这页后端自动换新的（docs/decisions.md 第 26 条）。
 * - 卡片走按钮的 open-type="share" 加页面的 onShareAppMessage；本阶段不画配图，微信用页面截图
 *   （阶段 3 和计划分享图一起做），页面上那张是卡片的示意。
 * - 海报（带小程序码）后面的阶段做，先占位。
 * - 复制邀请码要在隐私保护指引里声明剪贴板（docs/platform-checklist.md）。
 */
const id = ref("");
const circle = ref<CircleDetailDto | null>(null);
const invite = ref<InviteDto | null>(null);
const members = ref<UserBrief[]>([]);
/** 开了「仅群主可邀请」而我不是群主，或者群没了 */
const blocked = ref("");

onLoad((query) => {
  id.value = String(query?.id ?? "");
});

onShow(() => {
  void load();
});

async function load(): Promise<void> {
  try {
    const [detail, current, roster] = await Promise.all([
      api.circle(id.value),
      api.invite(id.value),
      api.members(id.value),
    ]);
    circle.value = detail;
    invite.value = current;
    members.value = roster.members.map((member) => member.user);
    blocked.value = "";
  } catch (error) {
    const code = errorCode(error);
    if (code === "INVITE_NOT_ALLOWED" || code === "CIRCLE_NOT_FOUND" || code === "CIRCLE_DISSOLVED") {
      blocked.value = errorMessage(error);
      return;
    }
    toastError(error);
  }
}

onShareAppMessage(() =>
  invite.value
    ? { title: invite.value.shareTitle, path: invite.value.sharePath }
    : { title: APP_NAME, path: "/pages/main/index" },
);

const meta = computed(() => {
  if (!circle.value || !invite.value) return "";
  const expire = formatMonthDay(invite.value.expireAt, circle.value.timezone);

  return `现在 ${circle.value.memberCount} 人 · 邀请 ${INVITE_TTL_DAYS} 天内有效（${expire}到期）`;
});

/** 卡片示意的底色跟群头像的颜色走；传了照片的群用绿色 */
const cardTint = computed(() => {
  const parsed = circle.value ? parseCircleAvatar(circle.value.avatar) : null;
  const tint = parsed?.kind === "preset" ? CIRCLE_AVATAR_TINT[parsed.preset] : "green";

  return `var(--yq-tile-${tint})`;
});

/** 卡片上只露 4 个头像，不写「+N」，人数在旁边的字里 */
const cardPeople = computed(() => members.value.slice(0, 4));

const cardStats = computed(() => {
  if (!circle.value) return "";
  const plans = circle.value.activePlanCount;

  return plans > 0
    ? `${circle.value.memberCount} 人 · ${plans} 个局在约`
    : `${circle.value.memberCount} 人`;
});

function onShareTap(): void {
  // #ifdef H5
  toast("H5 预览发不了微信卡片，到微信开发者工具里试");
  // #endif
}

function savePoster(): void {
  toast("邀请海报在后面的阶段上线，先发卡片或说邀请码");
}

function copyCode(): void {
  if (!invite.value) return;
  // 微信会自己弹「内容已复制」
  uni.setClipboardData({ data: invite.value.code });
}
</script>

<template>
  <YqPage>
    <YqNavBar title="邀请好友" />

    <view v-if="blocked" class="body">
      <YqEmptyState title="现在没法邀请" :desc="blocked" />
    </view>

    <view v-else-if="circle && invite" class="body">
      <view class="hero">
        <view class="hero__art">
          <view class="hero__bird"><YqIllustration name="gg" :width="70" /></view>
          <view class="hero__sign yq-anim">
            <text class="hero__board">人多{{ "\n" }}才好约</text>
            <view class="hero__stick" />
          </view>
        </view>
        <view class="hero__text">
          <text class="hero__title">拉朋友进「{{ circle.name }}」</text>
          <text class="hero__meta">{{ meta }}</text>
        </view>
      </view>

      <YqCard>
        <view class="way">
          <view class="way__head">
            <text class="way__title">① 发微信卡片</text>
            <text class="way__desc">最快，点开就是加入页</text>
          </view>

          <view class="card" aria-hidden="true">
            <view class="card__brand">
              <YqIllustration name="gg" :width="16" />
              <text>{{ APP_NAME }}</text>
            </view>
            <text class="card__title">{{ invite.shareTitle }}</text>
            <view class="card__image" :style="{ background: cardTint }">
              <view class="card__circle">
                <YqCircleAvatar :avatar="circle.avatar" :size="30" plain />
                <text class="card__name">{{ circle.name }}</text>
              </view>
              <view class="card__people">
                <YqAvatarStack :users="cardPeople" :size="20" :overlap="6" />
                <text class="card__stats">{{ cardStats }}</text>
              </view>
            </view>
            <view class="card__foot">
              <YqIcon name="miniprogram" :size="11" />
              <text>小程序</text>
            </view>
          </view>

          <YqButton variant="primary" size="md" block open-type="share" @click="onShareTap">
            发给微信好友或群
          </YqButton>
        </view>
      </YqCard>

      <YqCard>
        <view class="poster-row">
          <view class="poster" aria-hidden="true">
            <text class="poster__brand">{{ APP_NAME }}</text>
            <YqCircleAvatar :avatar="circle.avatar" :size="22" />
            <text class="poster__name">{{ circle.name }}</text>
            <view class="poster__code">
              <view class="poster__ring">
                <view class="poster__dot" />
              </view>
            </view>
          </view>
          <view class="poster-row__text">
            <text class="way__title">② 存邀请海报</text>
            <text class="way__desc">带群名和成员头像，扫码就能加入</text>
            <view class="poster-row__action">
              <YqButton variant="secondary" size="xs" @click="savePoster">保存到相册</YqButton>
            </view>
          </view>
        </view>
      </YqCard>

      <YqCard>
        <view class="way">
          <view class="way__head">
            <text class="way__title">③ 说邀请码</text>
            <text class="way__desc">适合口头告诉长辈</text>
          </view>
          <view class="code">
            <YqCodeBoxes :model-value="invite.code" />
            <view class="code__copy">
              <YqButton variant="king" size="xs" @click="copyCode">复制</YqButton>
            </view>
          </view>
        </view>
      </YqCard>
    </view>
  </YqPage>
</template>

<style scoped>
.body {
  padding: 12px 16px 32px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.hero {
  display: flex;
  align-items: center;
  gap: 12px;
}

.hero__art {
  position: relative;
  flex: none;
  width: 92px;
  height: 86px;
}

.hero__bird {
  position: absolute;
  left: 0;
  bottom: 0;
}

.hero__sign {
  position: absolute;
  right: 0;
  top: 0;
  transform-origin: 20% 100%;
  animation: yq-wave 1.6s ease-in-out infinite;
}

@keyframes yq-wave {
  0%,
  100% {
    transform: rotate(-6deg);
  }

  50% {
    transform: rotate(6deg);
  }
}

.hero__board {
  display: block;
  padding: 3px 7px;
  background: var(--yq-color-surface);
  border: var(--yq-border-field);
  border-radius: var(--yq-radius-xs);
  box-shadow: var(--yq-shadow-control-sm);
  font-family: var(--yq-font-display);
  font-weight: var(--yq-font-display-weight);
  font-size: var(--yq-size-display-12);
  line-height: 1.25;
  text-align: center;
  white-space: pre-line;
}

.hero__stick {
  width: 3px;
  height: 22px;
  margin-left: 14px;
  background: var(--yq-color-text);
}

.hero__text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.hero__title {
  font-family: var(--yq-font-display);
  font-weight: var(--yq-font-display-weight);
  font-size: var(--yq-size-display-22);
  line-height: 1.25;
}

.hero__meta {
  font-size: 12px;
  color: var(--yq-color-text-secondary);
}

.way {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.way__head {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.way__title {
  font-size: 15px;
  font-weight: var(--yq-font-weight-900);
}

.way__desc {
  font-size: 12px;
  color: var(--yq-color-text-secondary);
}

/* 微信卡片的示意 */
.card {
  align-self: center;
  box-sizing: border-box;
  width: 214px;
  padding: 8px 10px 6px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  background: var(--yq-color-surface);
  border: var(--yq-border-field-thin);
  border-radius: var(--yq-radius-md);
  transform: rotate(-1.5deg);
}

.card__brand {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  color: var(--yq-color-text-secondary);
}

.card__title {
  font-size: 13px;
  font-weight: var(--yq-font-weight-900);
}

.card__image {
  box-sizing: border-box;
  height: 86px;
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  border: var(--yq-border-chip);
  border-radius: var(--yq-radius-2xs);
}

.card__circle,
.card__people {
  display: flex;
  align-items: center;
}

.card__circle {
  gap: 8px;
}

.card__people {
  gap: 6px;
}

.card__name {
  font-family: var(--yq-font-display);
  font-weight: var(--yq-font-display-weight);
  font-size: var(--yq-size-display-17);
}

.card__stats {
  font-size: 10.5px;
  font-weight: var(--yq-font-weight-700);
}

.card__foot {
  display: flex;
  align-items: center;
  gap: 4px;
  padding-top: 4px;
  border-top: 1px solid var(--yq-color-divider);
  font-size: 10px;
  color: var(--yq-color-text-secondary);
}

/* 海报的示意 */
.poster-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.poster {
  box-sizing: border-box;
  flex: none;
  width: 66px;
  height: 92px;
  padding: 6px 5px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  background: var(--yq-color-surface-inset);
  border: var(--yq-border-field-thin);
  border-radius: var(--yq-radius-2xs);
  transform: rotate(-3deg);
}

.poster__brand {
  font-family: var(--yq-font-logo);
  font-size: 9px;
}

.poster__name {
  font-size: 8px;
  font-weight: var(--yq-font-weight-900);
}

.poster__code {
  box-sizing: border-box;
  width: 28px;
  height: 28px;
  margin-top: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--yq-color-surface);
  border: var(--yq-border-knob);
  border-radius: 50%;
}

.poster__ring {
  box-sizing: border-box;
  width: 19px;
  height: 19px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: var(--yq-border-dashed-thin);
  border-radius: 50%;
}

.poster__dot {
  box-sizing: border-box;
  width: 9px;
  height: 9px;
  background: var(--yq-color-flaked);
  border: var(--yq-border-thin);
  border-radius: 50%;
}

.poster-row__text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.poster-row__action {
  margin-top: 4px;
  display: flex;
}

.code {
  display: flex;
  align-items: center;
  gap: 6px;
}

.code__copy {
  margin-left: auto;
}
</style>

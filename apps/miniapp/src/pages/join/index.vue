<script setup lang="ts">
import { onLoad } from "@dcloudio/uni-app";
import {
  CIRCLE_TYPE_LABELS,
  INVITE_TTL_DAYS,
  MAX_MEMBERS,
  parseInviteCode,
  type InvitePreviewDto,
  type JoinBody,
} from "@yiqi/shared";
import { computed, ref } from "vue";

import YqAvatar from "../../components/YqAvatar.vue";
import YqAvatarStack from "../../components/YqAvatarStack.vue";
import YqButton from "../../components/YqButton.vue";
import YqCircleAvatar from "../../components/YqCircleAvatar.vue";
import YqEmptyState from "../../components/YqEmptyState.vue";
import YqNavBar from "../../components/YqNavBar.vue";
import YqPage from "../../components/YqPage.vue";
import type { AvatarPerson } from "../../components/types";
import { platform } from "../../platform";
import { api } from "../../request";
import { ensureLogin } from "../../session/useSession";
import { errorCode, toast, toastError } from "../../utils/feedback";
import { rpx } from "../../utils/units";

/**
 * 加入落地页（设计稿 JoinLanding）：从微信卡片（?t=&from=）或邀请码（?code=）进来，还不是群成员。
 * - 看群信息不用登录（GET /invites/preview 是公开的）；点「加入群组」才登录、建用户
 *   （docs/spec.md「邀请与加入」：减少流失）。不用先填资料，没昵称就显示「微信用户」（决定第 26 条）。
 * - 「群里在约」要用阶段 2 的计划时间文案，计划做好之前不显示。
 * - 过期、满员、已在群里、审核中、已解散、邀请不对，这些状态没有设计稿，用同一张卡片换按钮和提示。
 */
const query = ref<JoinBody & { from?: string }>({});
const preview = ref<InvitePreviewDto | null>(null);
const joining = ref(false);
// 行内样式不经过 px→rpx 插件：设计稿的 24 自己换，安全区是屏幕 px 原样加
const ctaStyle = {
  paddingBottom: `calc(${rpx(24)} + ${platform.getNavMetrics().safeAreaBottom}px)`,
};

onLoad((options) => {
  const code = parseInviteCode(String(options?.code ?? ""));
  query.value = code
    ? { code }
    : { t: String(options?.t ?? ""), from: options?.from ? String(options.from) : undefined };
  void load();
});

async function load(): Promise<void> {
  try {
    preview.value = await api.invitePreview(query.value);
  } catch (error) {
    toastError(error);
  }
}

const circle = computed(() => preview.value?.circle ?? null);
const status = computed(() => preview.value?.status ?? "invalid");

const inviterText = computed(() =>
  preview.value?.inviter ? `${preview.value.inviter.name}邀请你加入` : "邀请你加入",
);

const meta = computed(() => {
  const info = circle.value;
  if (!info || !preview.value) return "";
  const plans = preview.value.upcomingPlans.length;
  const parts = [`${info.memberCount} 人`];
  if (plans > 0) parts.push(`近期 ${plans} 个计划`);
  parts.push(`${CIRCLE_TYPE_LABELS[info.type]}群`);

  return parts.join(" · ");
});

/** 当周鸽子王在头像里戴上头套 */
const people = computed<AvatarPerson[]>(() => {
  const info = circle.value;
  if (!info) return [];
  const kings = new Set(info.king?.users.map((user) => user.id) ?? []);

  return info.members.map((user) => ({ ...user, king: kings.has(user.id) ? "week" : null }));
});

const kingNames = computed(
  () => circle.value?.king?.users.map((user) => user.name).join("、") ?? "",
);

const stats = computed(() => {
  const value = preview.value?.stats;
  if (!value) return [];
  // 新群没数据时三格都是 0，不如不放
  if (value.plansThisMonth + value.formedThisMonth + value.longestPeaceStreak === 0) return [];

  return [
    { value: `${value.plansThisMonth} 局`, label: "这个月约了" },
    { value: `${value.formedThisMonth} 局`, label: "真的成局了" },
    { value: `${value.longestPeaceStreak} 周`, label: "最长和平周" },
  ];
});

/** 底部按钮和下面那行小字，按状态换 */
const action = computed(() => {
  switch (status.value) {
    case "ok":
      return circle.value?.needApproval
        ? {
            text: "申请加入",
            hint: "这个群要群主同意才能进；点了用微信一键登录，不用填资料",
            enabled: true,
          }
        : { text: "加入群组", hint: "点「加入群组」时用微信一键登录，不用填资料", enabled: true };
    case "member":
      return { text: "进入群组", hint: "你已经在这个群里了", enabled: true };
    case "pending":
      return {
        text: "已申请，等群主同意",
        hint: "群主同意后，群组列表里就能看到这个群",
        enabled: false,
      };
    case "expired":
      return {
        text: "邀请过期了",
        hint: `邀请 ${INVITE_TTL_DAYS} 天内有效，找群友重新发一个`,
        enabled: false,
      };
    case "full":
      return {
        text: "群满了",
        hint: `一个群最多 ${MAX_MEMBERS} 人，找群主腾个位置`,
        enabled: false,
      };
    default:
      return null;
  }
});

function openCircle(circleId: string): void {
  uni.reLaunch({ url: `/pages/circle/home?id=${circleId}` });
}

async function join(): Promise<void> {
  const info = circle.value;
  if (!info || joining.value) return;
  if (status.value === "member") {
    openCircle(info.id);
    return;
  }

  joining.value = true;
  try {
    await ensureLogin();
    const body: JoinBody = query.value.code ? { code: query.value.code } : { t: query.value.t };
    const result = await api.join(body);
    if (result.status === "pending") {
      toast("申请发出去了，等群主同意");
      await load();
      return;
    }
    toast(result.status === "joined" ? `欢迎加入「${info.name}」` : "你已经在这个群里了");
    openCircle(result.circleId);
  } catch (error) {
    toastError(error);
    // 过期、满员、解散了：刷新一下，按新状态显示
    if (
      ["INVITE_EXPIRED", "CIRCLE_FULL", "CIRCLE_DISSOLVED", "INVITE_INVALID"].includes(
        errorCode(error),
      )
    ) {
      await load();
    }
  } finally {
    joining.value = false;
  }
}

function goHome(): void {
  uni.reLaunch({ url: "/pages/main/index?tab=groups" });
}
</script>

<template>
  <YqPage>
    <YqNavBar variant="brand" />

    <view
      v-if="preview && (status === 'invalid' || status === 'dissolved' || !circle)"
      class="body"
    >
      <YqEmptyState
        :title="status === 'dissolved' ? '这个群已经解散了' : '这个邀请不对'"
        :desc="
          status === 'dissolved' ? '找朋友再拉你进别的群吧' : '核对一下邀请码，或者让群友再发一次'
        "
      >
        <YqButton variant="secondary" size="md" @click="goHome">去我的群组</YqButton>
      </YqEmptyState>
    </view>

    <view v-else-if="circle" class="body">
      <view class="inviter">
        <YqAvatar v-if="preview?.inviter" :user="preview.inviter" :size="30" />
        <text class="inviter__text">{{ inviterText }}</text>
      </view>

      <view class="landing">
        <view class="landing__tile">
          <YqCircleAvatar :avatar="circle.avatar" :size="76" tilt />
        </view>
        <view class="landing__card">
          <view class="landing__info">
            <text class="landing__name">{{ circle.name }}</text>
            <text class="landing__meta">{{ meta }}</text>
            <view class="landing__people">
              <YqAvatarStack :users="people" :size="36" :overlap="8" :max="8" />
            </view>
          </view>
          <view v-if="circle.king" class="landing__band">
            <YqAvatar :user="circle.king.users[0] ?? null" :size="28" king="week" />
            <text class="landing__band-text">本周鸽子王：{{ kingNames }}</text>
            <text class="landing__band-side">加入就能围观</text>
          </view>
        </view>
      </view>

      <view v-if="stats.length > 0" class="stats">
        <view v-for="item in stats" :key="item.label" class="stats__cell">
          <text class="stats__value">{{ item.value }}</text>
          <text class="stats__label">{{ item.label }}</text>
        </view>
      </view>
    </view>

    <template v-if="circle && action">
      <view class="cta-spacer" />
      <view class="cta" :style="ctaStyle">
        <view :class="{ 'yq-anim cta__pulse': action.enabled && status === 'ok' }">
          <YqButton
            variant="primary"
            size="xl"
            block
            :disabled="!action.enabled"
            :loading="joining"
            @click="join"
          >
            {{ action.text }}
          </YqButton>
        </view>
        <text class="cta__hint">{{ action.hint }}</text>
      </view>
    </template>
  </YqPage>
</template>

<style scoped>
.body {
  padding: 14px 16px 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.inviter {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.inviter__text {
  font-size: 15px;
  font-weight: var(--yq-font-weight-900);
}

.landing {
  position: relative;
  margin-top: 30px;
}

.landing__tile {
  position: absolute;
  left: 50%;
  top: -40px;
  z-index: 1;
  margin-left: -38px;
}

.landing__card {
  overflow: hidden;
  background: var(--yq-color-surface);
  border: var(--yq-border-card);
  border-radius: var(--yq-radius-3xl);
  box-shadow: var(--yq-shadow-surface-xl);
}

.landing__info {
  padding: 46px 16px 14px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  text-align: center;
}

.landing__name {
  font-family: var(--yq-font-display);
  font-weight: var(--yq-font-display-weight);
  font-size: var(--yq-size-display-30);
  line-height: 1.15;
}

.landing__meta {
  font-size: 12.5px;
  color: var(--yq-color-text-secondary);
}

.landing__people {
  margin-top: 8px;
}

.landing__band {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  background: var(--yq-band-king);
  border-top: var(--yq-border-band);
  font-size: 13px;
  font-weight: var(--yq-font-weight-900);
}

.landing__band-text {
  flex: 1;
  min-width: 0;
}

.landing__band-side {
  font-size: 12px;
}

.stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.stats__cell {
  padding: 7px 4px;
  display: flex;
  flex-direction: column;
  text-align: center;
  background: var(--yq-color-surface);
  border: var(--yq-border-card);
  border-radius: var(--yq-radius-lg);
  box-shadow: var(--yq-shadow-control-sm);
}

.stats__value {
  font-family: var(--yq-font-display);
  font-weight: var(--yq-font-display-weight);
  font-size: var(--yq-size-display-22);
  line-height: 1.2;
}

.stats__label {
  font-size: 11.5px;
  color: var(--yq-color-text-secondary);
}

.cta-spacer {
  height: 130px;
}

.cta {
  position: fixed;
  left: 16px;
  right: 16px;
  bottom: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.cta__pulse {
  animation: yq-pulse 2.2s ease-in-out infinite;
}

@keyframes yq-pulse {
  0%,
  100% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.03);
  }
}

.cta__hint {
  font-size: 12px;
  color: var(--yq-color-text-secondary);
  text-align: center;
}
</style>

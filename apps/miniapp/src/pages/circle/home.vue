<script setup lang="ts">
import { onLoad, onShow } from "@dcloudio/uni-app";
import {
  FLAKE_TIERS,
  flakeTierInfo,
  formatMonthDay,
  formatRevealCountdown,
  formatWeekRange,
  timeZoneLabel,
  type CircleDetailDto,
  type MemberDto,
  type MembersResult,
  type PigeonBoardRowDto,
} from "@yiqi/shared";
import { computed, ref } from "vue";

import YqAvatar from "../../components/YqAvatar.vue";
import YqAvatarStack from "../../components/YqAvatarStack.vue";
import YqButton from "../../components/YqButton.vue";
import YqCard from "../../components/YqCard.vue";
import YqChip from "../../components/YqChip.vue";
import YqCircleAvatar from "../../components/YqCircleAvatar.vue";
import YqConfirmSheet from "../../components/YqConfirmSheet.vue";
import YqEmptyState from "../../components/YqEmptyState.vue";
import YqFab from "../../components/YqFab.vue";
import YqIllustration from "../../components/YqIllustration.vue";
import YqListGroup from "../../components/YqListGroup.vue";
import YqListRow from "../../components/YqListRow.vue";
import YqNavBar from "../../components/YqNavBar.vue";
import YqPage from "../../components/YqPage.vue";
import YqTabs from "../../components/YqTabs.vue";
import { fakePigeonBoard } from "../../fakes/pigeon-board";
import { api } from "../../request";
import { errorCode, toast, toastError } from "../../utils/feedback";

/**
 * 群组主页（设计稿 GroupHome）：头图、本周鸽子王横幅、计划 / 鸽榜 / 成员三个 tab、「在本群发起」。
 * - 计划 tab 阶段 2 才有内容，先放空状态。
 * - 鸽榜按群里真成员生成假数据（fakes/pigeon-board.ts，阶段 3 换真接口）；群主关了评选就没有这个 tab。
 * - 成员 tab 没有设计稿：群主在这里同意、拒绝入群申请，把人移出群。
 */
type TabKey = "plans" | "board" | "members";

const id = ref("");
const tab = ref<TabKey>("plans");
const circle = ref<CircleDetailDto | null>(null);
const roster = ref<MembersResult>({ members: [], pending: [] });
/** 群没了（解散了，或者我已经不在群里） */
const gone = ref(false);
const now = ref(new Date());

const removing = ref<MemberDto | null>(null);
const busy = ref(false);

onLoad((query) => {
  id.value = String(query?.id ?? "");
  if (query?.tab === "board" || query?.tab === "members" || query?.tab === "plans") {
    tab.value = query.tab;
  }
});

onShow(() => {
  now.value = new Date();
  void load();
});

async function load(): Promise<void> {
  try {
    const [detail, members] = await Promise.all([api.circle(id.value), api.members(id.value)]);
    circle.value = detail;
    roster.value = members;
    gone.value = false;
    if (!detail.pigeonEnabled && tab.value === "board") tab.value = "plans";
  } catch (error) {
    if (errorCode(error) === "CIRCLE_NOT_FOUND" || errorCode(error) === "CIRCLE_DISSOLVED") {
      gone.value = true;
      return;
    }
    toastError(error);
  }
}

const tabs = computed(() => {
  const detail = circle.value;
  if (!detail) return [];

  return [
    { key: "plans", label: "计划", count: detail.planCount },
    ...(detail.pigeonEnabled ? [{ key: "board", label: "鸽榜" }] : []),
    { key: "members", label: "成员", count: detail.memberCount },
  ];
});

function switchTab(key: string): void {
  tab.value = key as TabKey;
}

const meta = computed(() => {
  const detail = circle.value;
  if (!detail) return "";

  return `${detail.memberCount} 人 · 群主 ${detail.owner.name} · ${timeZoneLabel(detail.timezone)}`;
});

const king = computed(() => (circle.value?.pigeonEnabled ? circle.value.king : null));
const kingNames = computed(() => king.value?.users.map((user) => user.name).join("、") ?? "");
const peaceStreak = computed(() =>
  circle.value?.pigeonEnabled && !king.value ? circle.value.peaceStreak : 0,
);

// ---------- 鸽榜（假数据） ----------

const board = computed(() =>
  circle.value
    ? fakePigeonBoard(
        circle.value.timezone,
        roster.value.members.map((member) => member.user),
        now.value,
      )
    : null,
);

const weekRange = computed(() =>
  board.value && circle.value ? formatWeekRange(board.value.weekStart, circle.value.timezone) : "",
);
const revealText = computed(() =>
  board.value ? formatRevealCountdown(now.value, board.value.revealAt) : "",
);
const topPoints = computed(() =>
  Math.max(1, ...(board.value?.rows.map((row) => row.points) ?? [])),
);

function rowSub(row: PigeonBoardRowDto): string {
  const last = row.lastFlake;
  const head = `鸽 ${row.flakeCount} 次`;

  return last ? `${head} · ${last.planTitle}（${flakeTierInfo(last.tier).name}）` : head;
}

function barWidth(row: PigeonBoardRowDto): string {
  return `${Math.round((row.points / topPoints.value) * 100)}%`;
}

const zeroText = computed(() => {
  if (!board.value) return "";
  const count = board.value.zeroUsers.length;

  return board.value.rows.length > 0 ? `其余 ${count} 人本周零鸽` : `${count} 人本周都零鸽`;
});

const bubble = computed(() => {
  const leader = board.value?.rows[0];

  return leader
    ? `${leader.user.name}暂时领跑，周日 24:00 前谁都可能后来居上`
    : "这周还没人鸽，保持住！";
});

// ---------- 成员 ----------

const isOwner = computed(() => circle.value?.myRole === "owner");

function memberSub(member: MemberDto): string {
  if (member.role === "owner") return "群主";

  return circle.value ? `${formatMonthDay(member.joinedAt, circle.value.timezone)}加入` : "";
}

function requestSub(requestedAt: string): string {
  return circle.value ? `${formatMonthDay(requestedAt, circle.value.timezone)}申请加入` : "";
}

async function decide(userId: string, approve: boolean): Promise<void> {
  if (busy.value) return;
  busy.value = true;
  try {
    roster.value = approve
      ? await api.approveRequest(id.value, userId)
      : await api.rejectRequest(id.value, userId);
    toast(approve ? "已同意，欢迎新群友" : "已拒绝");
    circle.value = await api.circle(id.value);
  } catch (error) {
    toastError(error);
  } finally {
    busy.value = false;
  }
}

async function confirmRemove(): Promise<void> {
  const target = removing.value;
  if (!target || busy.value) return;
  busy.value = true;
  try {
    roster.value = await api.removeMember(id.value, target.user.id);
    removing.value = null;
    toast(`已把${target.user.name}移出群`);
    circle.value = await api.circle(id.value);
  } catch (error) {
    toastError(error);
  } finally {
    busy.value = false;
  }
}

// ---------- 跳转 ----------

function go(path: "invite" | "settings"): void {
  uni.navigateTo({ url: `/pages/circle/${path}?id=${id.value}` });
}

function backToGroups(): void {
  uni.reLaunch({ url: "/pages/main/index?tab=groups" });
}

function soon(what: string): void {
  toast(`${what}在下个阶段上线`);
}
</script>

<template>
  <YqPage>
    <YqNavBar title="群组主页" />

    <view v-if="gone" class="body">
      <YqEmptyState title="这个群找不到了" desc="可能已经解散，或者你已经不在这个群里">
        <YqButton variant="secondary" size="md" @click="backToGroups">回群组列表</YqButton>
      </YqEmptyState>
    </view>

    <view v-else-if="circle" class="body">
      <view class="head">
        <YqCircleAvatar :avatar="circle.avatar" :size="62" />
        <view class="head__text">
          <text class="head__name">{{ circle.name }}</text>
          <text class="head__meta">{{ meta }}</text>
        </view>
        <view class="head__actions">
          <YqButton v-if="circle.canInvite" variant="king" size="mini" @click="go('invite')">
            邀请好友
          </YqButton>
          <YqButton variant="secondary" size="mini" @click="go('settings')">群设置</YqButton>
        </view>
      </view>

      <view v-if="king" class="banner banner--king" @click="soon('鸽子王揭晓页')">
        <YqAvatar
          :user="king.users[0] ?? null"
          :size="54"
          :king="king.streakWeeks >= 2 ? 'streak' : 'week'"
          bob
        />
        <view class="banner__text">
          <text class="banner__label">本周鸽子王 · 头套戴到周日</text>
          <text class="banner__title">{{ kingNames }} · 鸽值 {{ king.points }}</text>
          <text v-if="circle.penaltyText" class="banner__task">任务：{{ circle.penaltyText }}</text>
        </view>
        <text class="banner__side">围观 ›</text>
      </view>

      <view v-else-if="peaceStreak > 0" class="banner banner--peace">
        <YqIllustration name="dove" :width="48" />
        <view class="banner__text">
          <text class="banner__label">和平周</text>
          <text class="banner__title">连续 {{ peaceStreak }} 周零鸽</text>
        </view>
        <text class="banner__side">全员靠谱</text>
      </view>

      <YqTabs :items="tabs" :model-value="tab" @update:model-value="switchTab" />

      <!-- 计划：阶段 2 -->
      <YqEmptyState
        v-if="tab === 'plans'"
        title="本群还没有计划"
        desc="发起计划在下个阶段上线，到时候点右下角就能约"
      />

      <!-- 鸽榜 -->
      <template v-else-if="tab === 'board' && board">
        <view class="board-head">
          <view class="board-head__title">
            <text class="board-head__name">本周鸽榜</text>
            <text class="board-head__range">{{ weekRange }}</text>
          </view>
          <YqChip tone="recruiting" size="sm" strong>{{ revealText }}</YqChip>
        </view>

        <YqCard padding="none">
          <view class="board">
            <view v-for="(row, index) in board.rows" :key="row.user.id" class="board__row">
              <text class="board__rank" :class="{ 'is-first': index === 0 }">{{ index + 1 }}</text>
              <YqAvatar :user="row.user" :size="40" />
              <view class="board__main">
                <view class="board__name-line">
                  <text class="board__name">{{ row.user.name }}</text>
                  <YqChip v-if="index === 0" tone="progress" size="xs">领跑</YqChip>
                </view>
                <text class="board__sub">{{ rowSub(row) }}</text>
                <view class="board__bar">
                  <view class="board__bar-fill" :style="{ width: barWidth(row) }" />
                </view>
              </view>
              <text class="board__points">{{ row.points }}</text>
            </view>

            <view v-if="board.zeroUsers.length > 0" class="board__row board__row--zero">
              <YqAvatarStack :users="board.zeroUsers" :size="24" :overlap="7" :max="6" />
              <text class="board__zero">{{ zeroText }}</text>
              <text class="board__ok">靠谱！</text>
            </view>
          </view>
        </YqCard>

        <view class="bubble">
          <YqIllustration name="gg" :width="40" />
          <text class="bubble__text">{{ bubble }}</text>
        </view>

        <view class="rules">
          <text class="rules__title">鸽值怎么算？鸽得越晚分越高</text>
          <view class="rules__grid">
            <view
              v-for="info in FLAKE_TIERS"
              :key="info.tier"
              class="rules__cell"
              :class="{ 'rules__cell--hot': info.tier === 'lightning' }"
            >
              <text>{{ info.rangeText }}</text>
              <text class="rules__points">{{ info.name }} +{{ info.points }}</text>
            </view>
          </view>
          <text class="rules__note">用免鸽卡不计分，但照样通知全群；开始前回归，这次作废</text>
        </view>
      </template>

      <!-- 成员（没有设计稿，用设置行拼） -->
      <template v-else-if="tab === 'members'">
        <YqListGroup
          v-if="isOwner && roster.pending.length > 0"
          :label="`等你同意（${roster.pending.length}）`"
        >
          <YqListRow
            v-for="(request, index) in roster.pending"
            :key="request.user.id"
            size="lg"
            :label="request.user.name"
            :sub="requestSub(request.requestedAt)"
            :divider="index < roster.pending.length - 1"
          >
            <template #left><YqAvatar :user="request.user" :size="36" /></template>
            <template #right>
              <view class="decide">
                <YqButton variant="secondary" size="mini" @click="decide(request.user.id, false)">
                  拒绝
                </YqButton>
                <YqButton variant="king" size="mini" @click="decide(request.user.id, true)">
                  同意
                </YqButton>
              </view>
            </template>
          </YqListRow>
        </YqListGroup>

        <YqListGroup :label="`成员（${roster.members.length}）`">
          <YqListRow
            v-for="(member, index) in roster.members"
            :key="member.user.id"
            size="lg"
            :label="member.isMe ? `${member.user.name}（我）` : member.user.name"
            :sub="memberSub(member)"
            :divider="index < roster.members.length - 1"
          >
            <template #left><YqAvatar :user="member.user" :size="36" /></template>
            <template #right>
              <YqButton
                v-if="isOwner && !member.isMe"
                variant="secondary"
                size="mini"
                @click="removing = member"
              >
                移出
              </YqButton>
            </template>
          </YqListRow>
        </YqListGroup>
      </template>
    </view>

    <YqFab v-if="circle && !gone" text="在本群发起" @click="soon('发起计划')" />

    <YqConfirmSheet
      :visible="removing !== null"
      :title="removing ? `把${removing.user.name}移出群？` : ''"
      :subtitle="
        removing
          ? `${removing.user.name}会退出本群所有计划，不算鸽。以后再用邀请加入，要你同意。`
          : ''
      "
      confirm-text="移出"
      :loading="busy"
      @confirm="confirmRemove"
      @cancel="removing = null"
    />
  </YqPage>
</template>

<style scoped>
.body {
  padding: 12px 16px 96px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.head {
  display: flex;
  align-items: center;
  gap: 12px;
}

.head__text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.head__name {
  font-family: var(--yq-font-display);
  font-weight: var(--yq-font-display-weight);
  font-size: var(--yq-size-display-26);
  line-height: 1.1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.head__meta {
  font-size: 12px;
  color: var(--yq-color-text-secondary);
}

.head__actions {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.banner {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border: var(--yq-border-card);
  border-radius: var(--yq-radius-2xl);
}

.banner--king {
  background: var(--yq-band-king);
  box-shadow: var(--yq-shadow-king-md);
}

.banner--peace {
  background: var(--yq-band-peace);
  box-shadow: var(--yq-shadow-formed-md);
}

.banner__text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.banner__label {
  font-size: 12px;
  font-weight: var(--yq-font-weight-900);
}

.banner__title {
  font-family: var(--yq-font-display);
  font-weight: var(--yq-font-display-weight);
  font-size: var(--yq-size-display-20);
  line-height: 1.15;
}

.banner__task {
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.banner__side {
  flex: none;
  font-size: 13px;
  font-weight: var(--yq-font-weight-900);
}

.board-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.board-head__title {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.board-head__name {
  font-family: var(--yq-font-display);
  font-weight: var(--yq-font-display-weight);
  font-size: var(--yq-size-display-21);
}

.board-head__range {
  font-size: 12px;
  color: var(--yq-color-text-secondary);
}

.board {
  padding: 4px 14px;
}

.board__row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 0;
  border-bottom: var(--yq-border-row);
}

.board__row:last-child {
  border-bottom: none;
}

.board__rank {
  box-sizing: border-box;
  flex: none;
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--yq-color-surface);
  border: var(--yq-border-knob);
  border-radius: 50%;
  font-family: var(--yq-font-display);
  font-weight: var(--yq-font-display-weight);
  font-size: var(--yq-size-display-15);
}

.board__rank.is-first {
  background: var(--yq-color-king);
  border: var(--yq-border-chip);
}

.board__main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.board__name-line {
  display: flex;
  align-items: center;
  gap: 6px;
}

.board__name {
  font-size: 14.5px;
  font-weight: var(--yq-font-weight-900);
}

.board__sub {
  font-size: 11.5px;
  color: var(--yq-color-text-secondary);
}

.board__bar {
  box-sizing: border-box;
  height: 8px;
  overflow: hidden;
  background: var(--yq-color-track);
  border: var(--yq-border-thin);
  border-radius: 999px;
}

.board__bar-fill {
  height: 100%;
  background: var(--yq-color-primary);
}

.board__points {
  flex: none;
  font-family: var(--yq-font-display);
  font-weight: var(--yq-font-display-weight);
  font-size: var(--yq-size-display-24);
}

.board__zero {
  flex: 1;
  min-width: 0;
  font-size: 13px;
  font-weight: var(--yq-font-weight-700);
}

.board__ok {
  font-size: 12px;
  font-weight: var(--yq-font-weight-900);
  color: var(--yq-color-text-formed);
}

.bubble {
  display: flex;
  align-items: center;
  gap: 6px;
}

.bubble__text {
  padding: 6px 12px;
  background: var(--yq-color-surface);
  border: var(--yq-border-chip);
  border-radius: var(--yq-radius-bubble);
  font-size: 12.5px;
  font-weight: var(--yq-font-weight-700);
}

.rules {
  box-sizing: border-box;
  padding: 10px 14px 12px;
  display: flex;
  flex-direction: column;
  gap: 7px;
  background: var(--yq-color-surface);
  border: var(--yq-border-dashed);
  border-radius: var(--yq-radius-2xl);
}

.rules__title {
  font-size: 13.5px;
  font-weight: var(--yq-font-weight-900);
}

.rules__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
  font-size: 12px;
}

.rules__cell {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 9px;
  background: var(--yq-color-surface-inset);
  border: var(--yq-border-field-thin);
  border-radius: var(--yq-radius-sm);
}

.rules__cell--hot {
  background: var(--yq-color-tint-danger);
  border: var(--yq-border-chip);
}

.rules__points {
  font-weight: var(--yq-font-weight-900);
}

.rules__note {
  font-size: 11.5px;
  color: var(--yq-color-text-secondary);
}

.decide {
  display: flex;
  gap: 8px;
}
</style>

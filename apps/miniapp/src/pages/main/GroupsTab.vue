<script setup lang="ts">
import { parseInviteCode, type CircleSummaryDto } from "@yiqi/shared";
import { ref } from "vue";

import YqAvatar from "../../components/YqAvatar.vue";
import YqButton from "../../components/YqButton.vue";
import YqCard from "../../components/YqCard.vue";
import YqChip from "../../components/YqChip.vue";
import YqCircleAvatar from "../../components/YqCircleAvatar.vue";
import YqCodeBoxes from "../../components/YqCodeBoxes.vue";
import YqEmptyState from "../../components/YqEmptyState.vue";
import YqIcon from "../../components/YqIcon.vue";
import YqIllustration from "../../components/YqIllustration.vue";
import YqNavBar from "../../components/YqNavBar.vue";
import YqSheet from "../../components/YqSheet.vue";
import { api } from "../../request";
import { toast, toastError } from "../../utils/feedback";

/**
 * 群组列表（设计稿 Groups）：建个群、输入邀请码，下面是我在的群。
 * 每张卡底下的横条：本周鸽子王 / 和平周 / 群主关了鸽子王评选（鸽王和和平周阶段 3 才有数据，
 * 现在后端如实返回空，横条就不出现；H5 预览按设计稿给了数据）。
 */
const circles = ref<CircleSummaryDto[] | null>(null);
const codeOpen = ref(false);
const code = ref("");

async function refresh(): Promise<void> {
  try {
    circles.value = await api.circles();
  } catch (error) {
    toastError(error);
  }
}

defineExpose({ refresh });

function ownerText(circle: CircleSummaryDto): string {
  return circle.myRole === "owner" ? "你是群主" : `${circle.owner.name}是群主`;
}

function open(circle: CircleSummaryDto): void {
  uni.navigateTo({ url: `/pages/circle/home?id=${circle.id}` });
}

function create(): void {
  uni.navigateTo({ url: "/pages/circle/create" });
}

function openCode(): void {
  code.value = "";
  codeOpen.value = true;
}

/** 邀请码填满 6 位就去落地页看看是哪个群 */
function lookup(): void {
  const parsed = parseInviteCode(code.value);
  if (!parsed) {
    toast("邀请码是 6 位字母和数字，核对一下");
    return;
  }

  codeOpen.value = false;
  uni.navigateTo({ url: `/pages/join/index?code=${parsed}` });
}
</script>

<template>
  <view class="groups">
    <YqNavBar variant="large" title="群组" />

    <view class="body">
      <view class="actions">
        <YqButton class="actions__btn" variant="king" size="sm" block @click="create">
          <template #icon><YqIcon name="plus" :size="16" /></template>
          建个群
        </YqButton>
        <YqButton class="actions__btn" variant="secondary" size="sm" block @click="openCode">
          <template #icon><YqIcon name="key" :size="17" /></template>
          输入邀请码
        </YqButton>
      </view>

      <YqCard
        v-for="circle in circles ?? []"
        :key="circle.id"
        padding="none"
        :band-tone="circle.king ? 'king' : circle.peaceStreak > 0 ? 'peace' : 'muted'"
        @click="open(circle)"
      >
        <view class="circle">
          <YqCircleAvatar :avatar="circle.avatar" :size="48" />
          <view class="circle__text">
            <text class="circle__name">{{ circle.name }}</text>
            <text class="circle__meta">{{ circle.memberCount }} 人 · {{ ownerText(circle) }}</text>
          </view>
          <YqChip v-if="circle.activePlanCount > 0" tone="progress" size="sm">
            进行中 {{ circle.activePlanCount }}
          </YqChip>
        </view>

        <template v-if="circle.king && circle.pigeonEnabled" #band>
          <YqAvatar
            :user="circle.king.users[0] ?? null"
            :size="28"
            :king="circle.king.streakWeeks >= 2 ? 'streak' : 'week'"
          />
          <text class="band__text">本周鸽子王：{{ circle.king.users.map((u) => u.name).join("、") }}</text>
          <YqChip v-if="circle.king.streakWeeks >= 2" tone="dark">连任 {{ circle.king.streakWeeks }} 周</YqChip>
          <text v-else class="band__side">鸽值 {{ circle.king.points }} ›</text>
        </template>
        <template v-else-if="circle.peaceStreak > 0 && circle.pigeonEnabled" #band>
          <YqIllustration name="dove" :width="28" />
          <text class="band__text">和平周 · 连续 {{ circle.peaceStreak }} 周零鸽</text>
          <text class="band__side">全员靠谱</text>
        </template>
        <template v-else-if="!circle.pigeonEnabled" #band>
          <YqIcon name="ban" :size="16" />
          <text>群主关闭了鸽子王评选</text>
        </template>
      </YqCard>

      <YqEmptyState
        v-if="circles && circles.length === 0"
        title="还没有群组"
        desc="建个群，或者用群友给的邀请码加进去"
      />
      <YqEmptyState
        v-else-if="circles"
        variant="dashed"
        title="还想约别的圈子？"
        desc="建个新群，或让朋友发邀请把你拉进去"
      />
    </view>

    <YqSheet :visible="codeOpen" title="输入邀请码" @close="codeOpen = false">
      <view class="code">
        <YqCodeBoxes v-model="code" editable autofocus @complete="lookup" />
        <text class="code__hint">6 位字母和数字，问群友要；大小写都行</text>
      </view>
      <template #footer>
        <YqButton variant="primary" size="lg" block @click="lookup">看看是哪个群</YqButton>
      </template>
    </YqSheet>
  </view>
</template>

<style scoped>
.body {
  padding: 12px 16px 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.actions {
  display: flex;
  gap: 10px;
}

.actions__btn {
  flex: 1;
}

.circle {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
}

.circle__text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.circle__name {
  font-family: var(--yq-font-display);
  font-weight: var(--yq-font-display-weight);
  font-size: var(--yq-size-display-21);
  line-height: 1.15;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.circle__meta {
  font-size: 12px;
  color: var(--yq-color-text-secondary);
}

.band__text {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.band__side {
  font-size: 12px;
}

.code {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 6px 0;
}

.code__hint {
  font-size: 12px;
  color: var(--yq-color-text-secondary);
}
</style>

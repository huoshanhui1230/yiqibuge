<script setup lang="ts">
import {
  CIRCLE_NAME_MAX,
  CIRCLE_TYPE_LABELS,
  CIRCLE_TYPES,
  COMMON_TIME_ZONES,
  DEFAULT_PRESET_BY_TYPE,
  checkCircleName,
  deviceTimeZone,
  presetAvatar,
  timeZoneLabel,
  trimText,
  utcOffsetLabel,
  type CircleType,
} from "@yiqi/shared";
import { computed, ref } from "vue";

import YqButton from "../../components/YqButton.vue";
import YqInput from "../../components/YqInput.vue";
import YqListGroup from "../../components/YqListGroup.vue";
import YqListRow from "../../components/YqListRow.vue";
import YqNavBar from "../../components/YqNavBar.vue";
import YqOptionSheet from "../../components/YqOptionSheet.vue";
import YqPage from "../../components/YqPage.vue";
import { platform } from "../../platform";
import { api } from "../../request";
import { toast, toastError } from "../../utils/feedback";
import { rpx } from "../../utils/units";
import CircleAvatarGrid from "./CircleAvatarGrid.vue";

/**
 * 建群（没有设计稿，用设置分组、输入框、群头像图标块拼）：群名、群类型、群头像、时区。
 * 群时区默认取手机的时区（docs/spec.md「创建群组」）；没选头像就按群类型给一个预设。
 * 建好直接去邀请页，把人拉进来。
 */
const now = new Date();
const name = ref("");
const type = ref<CircleType>("friends");
/** 空字符串表示还没自己选，跟着群类型走 */
const pickedAvatar = ref("");
const timezone = ref(deviceTimeZone(now));
const zoneOpen = ref(false);
const saving = ref(false);

const avatar = computed(
  () => pickedAvatar.value || presetAvatar(DEFAULT_PRESET_BY_TYPE[type.value]),
);

const zoneOptions = computed(() => {
  const options = COMMON_TIME_ZONES.map((option) => ({
    value: option.zone,
    label: option.label,
    sub: utcOffsetLabel(option.zone, now),
  }));
  if (!options.some((option) => option.value === timezone.value)) {
    options.unshift({
      value: timezone.value,
      label: timeZoneLabel(timezone.value),
      sub: utcOffsetLabel(timezone.value, now),
    });
  }

  return options;
});

const zoneText = computed(
  () => `${timeZoneLabel(timezone.value)} ${utcOffsetLabel(timezone.value, now)}`,
);

// 行内样式不经过 px→rpx 插件：设计稿的 24 自己换，安全区是屏幕 px 原样加
const barStyle = {
  paddingBottom: `calc(${rpx(24)} + ${platform.getNavMetrics().safeAreaBottom}px)`,
};

function pickZone(value: string): void {
  timezone.value = value;
  zoneOpen.value = false;
}

async function create(): Promise<void> {
  const problem = checkCircleName(name.value);
  if (problem) {
    toast(problem);
    return;
  }
  if (saving.value) return;

  saving.value = true;
  try {
    const circle = await api.createCircle({
      name: trimText(name.value),
      type: type.value,
      avatar: avatar.value,
      timezone: timezone.value,
    });
    // 建群页换成邀请页：从邀请页返回就回到群组列表，新群已经在里面
    uni.redirectTo({ url: `/pages/circle/invite?id=${circle.id}` });
  } catch (error) {
    toastError(error);
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <YqPage>
    <YqNavBar title="建个群" />

    <view class="body">
      <view class="intro">
        <text class="intro__title">建个新群</text>
        <text class="intro__desc">建好就发邀请，把常约的人拉进来</text>
      </view>

      <YqListGroup label="群名">
        <view class="field">
          <YqInput
            v-model="name"
            :maxlength="CIRCLE_NAME_MAX"
            placeholder="例如：大学室友"
            display
            counter
          />
        </view>
      </YqListGroup>

      <YqListGroup label="群类型">
        <view class="types">
          <view
            v-for="option in CIRCLE_TYPES"
            :key="option"
            class="type"
            :class="{ 'is-picked': option === type }"
            role="radio"
            :aria-checked="option === type"
            @click="type = option"
          >
            <text>{{ CIRCLE_TYPE_LABELS[option] }}</text>
          </view>
        </view>
      </YqListGroup>

      <YqListGroup label="群头像">
        <view class="field">
          <CircleAvatarGrid :model-value="avatar" @pick="pickedAvatar = $event" />
        </view>
      </YqListGroup>

      <YqListGroup label="时区">
        <YqListRow
          label="群时区"
          sub="计划时间都按这个时区显示"
          :value="zoneText"
          size="lg"
          arrow
          :divider="false"
          @click="zoneOpen = true"
        />
      </YqListGroup>
    </view>

    <view class="bar-spacer" />
    <view class="bar" :style="barStyle">
      <YqButton variant="primary" size="xl" block :loading="saving" @click="create">
        建好了，去邀请
      </YqButton>
    </view>

    <YqOptionSheet
      :visible="zoneOpen"
      title="群时区"
      :options="zoneOptions"
      :model-value="timezone"
      @select="pickZone"
      @close="zoneOpen = false"
    />
  </YqPage>
</template>

<style scoped>
.body {
  padding: 12px 16px 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
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

.field {
  padding: 14px 0;
}

.types {
  padding: 12px 0;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.type {
  box-sizing: border-box;
  min-width: 56px;
  min-height: 36px;
  padding: 0 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--yq-color-surface);
  border: var(--yq-border-field-thin);
  border-radius: var(--yq-radius-chip);
  font-size: 14px;
  font-weight: var(--yq-font-weight-700);
  color: var(--yq-color-text-secondary);
}

.type.is-picked {
  background: var(--yq-chip-danger-bg);
  border: var(--yq-border-chip);
  color: var(--yq-chip-danger-fg);
  font-weight: var(--yq-font-weight-900);
}

.bar-spacer {
  height: 104px;
}

.bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  box-sizing: border-box;
  padding: 10px 16px 0;
  background: var(--yq-color-surface);
  border-top: var(--yq-border-band);
}
</style>

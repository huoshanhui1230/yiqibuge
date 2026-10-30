<script setup lang="ts">
import { onLoad, onShow } from "@dcloudio/uni-app";
import {
  CIRCLE_NAME_MAX,
  CIRCLE_TYPE_LABELS,
  CIRCLE_TYPES,
  COMMON_TIME_ZONES,
  GROUP_NICKNAME_MAX,
  PENALTY_TEXT_MAX,
  checkCircleName,
  checkOptionalText,
  isCircleType,
  timeZoneLabel,
  trimText,
  utcOffsetLabel,
  type CircleDetailDto,
  type MemberDto,
  type UpdateCircleBody,
} from "@yiqi/shared";
import { computed, ref } from "vue";

import YqCircleAvatar from "../../components/YqCircleAvatar.vue";
import YqConfirmSheet from "../../components/YqConfirmSheet.vue";
import YqEmptyState from "../../components/YqEmptyState.vue";
import YqIllustration from "../../components/YqIllustration.vue";
import YqListGroup from "../../components/YqListGroup.vue";
import YqListRow from "../../components/YqListRow.vue";
import YqNavBar from "../../components/YqNavBar.vue";
import YqOptionSheet from "../../components/YqOptionSheet.vue";
import YqPage from "../../components/YqPage.vue";
import YqSheet from "../../components/YqSheet.vue";
import YqSwitch from "../../components/YqSwitch.vue";
import YqTextSheet from "../../components/YqTextSheet.vue";
import { api } from "../../request";
import { errorCode, toast, toastError } from "../../utils/feedback";
import CircleAvatarGrid from "./CircleAvatarGrid.vue";

/**
 * 群设置（设计稿 GroupSettings）。
 * - 群主看到设计稿那版：群信息、成员与邀请、鸽子王三组能改，再加「群主操作」（转让、解散）。
 * - 成员看到只读版：同样的几组，只显示值。
 * - 两边最后都有「我在本群」：自己的群昵称、退出群组（设计稿没画，用设置行拼）。
 * 各个编辑弹层、确认卡也没有设计稿，用弹层底座和确认卡组件拼。
 */
type Editor = "avatar" | "name" | "type" | "timezone" | "penalty" | "nickname" | "transfer";
type Confirm = "transfer" | "dissolve" | "leave" | "mustTransfer" | "alone";
type Switchable = "needApproval" | "inviteOwnerOnly" | "pigeonEnabled";

const id = ref("");
const circle = ref<CircleDetailDto | null>(null);
const members = ref<MemberDto[]>([]);
const gone = ref(false);
const now = new Date();

const editor = ref<Editor | null>(null);
const confirm = ref<Confirm | null>(null);
const transferTo = ref<MemberDto | null>(null);
const saving = ref(false);

onLoad((query) => {
  id.value = String(query?.id ?? "");
});

onShow(() => {
  void load();
});

async function load(): Promise<void> {
  try {
    const [detail, roster] = await Promise.all([api.circle(id.value), api.members(id.value)]);
    circle.value = detail;
    members.value = roster.members;
  } catch (error) {
    if (errorCode(error) === "CIRCLE_NOT_FOUND" || errorCode(error) === "CIRCLE_DISSOLVED") {
      gone.value = true;
      return;
    }
    toastError(error);
  }
}

const isOwner = computed(() => circle.value?.myRole === "owner");

function zoneText(zone: string): string {
  return `${timeZoneLabel(zone)} ${utcOffsetLabel(zone, now)}`;
}

const typeOptions = CIRCLE_TYPES.map((type) => ({ value: type, label: CIRCLE_TYPE_LABELS[type] }));

const zoneOptions = computed(() => {
  const options = COMMON_TIME_ZONES.map((option) => ({
    value: option.zone,
    label: option.label,
    sub: utcOffsetLabel(option.zone, now),
  }));
  const current = circle.value?.timezone;
  // 群时区不在常用列表里（建群时手机是别的时区）：放在最前面，免得看不到当前值
  if (current && !options.some((option) => option.value === current)) {
    options.unshift({ value: current, label: timeZoneLabel(current), sub: utcOffsetLabel(current, now) });
  }

  return options;
});

const transferOptions = computed(() =>
  members.value
    .filter((member) => !member.isMe)
    .map((member) => ({ value: member.user.id, label: member.user.name })),
);

function onOff(value: boolean): string {
  return value ? "开启" : "关闭";
}

// ---------- 保存 ----------

async function update(body: UpdateCircleBody, done: string): Promise<void> {
  if (saving.value) return;
  saving.value = true;
  try {
    circle.value = await api.updateCircle(id.value, body);
    editor.value = null;
    toast(done);
  } catch (error) {
    toastError(error);
  } finally {
    saving.value = false;
  }
}

/** 开关先变过去，接口失败再拨回来 */
async function toggle(key: Switchable, value: boolean): Promise<void> {
  if (!circle.value) return;
  const before = circle.value[key];
  circle.value = { ...circle.value, [key]: value };
  try {
    circle.value = await api.updateCircle(id.value, { [key]: value });
  } catch (error) {
    if (circle.value) circle.value = { ...circle.value, [key]: before };
    toastError(error);
  }
}

function saveName(value: string): void {
  const problem = checkCircleName(value);
  if (problem) {
    toast(problem);
    return;
  }
  void update({ name: trimText(value) }, "群名改好了");
}

function saveType(value: string): void {
  if (isCircleType(value)) void update({ type: value }, "群类型改好了");
}

function saveZone(value: string): void {
  void update({ timezone: value }, `时区改成${timeZoneLabel(value)}了`);
}

function saveAvatar(value: string): void {
  void update({ avatar: value }, "群头像换好了");
}

function savePenalty(value: string): void {
  const problem = checkOptionalText(value, "任务卡", PENALTY_TEXT_MAX);
  if (problem) {
    toast(problem);
    return;
  }
  void update({ penaltyText: trimText(value) || null }, trimText(value) ? "任务卡写好了" : "任务卡清掉了");
}

async function saveNickname(value: string): Promise<void> {
  const problem = checkOptionalText(value, "群昵称", GROUP_NICKNAME_MAX);
  if (problem) {
    toast(problem);
    return;
  }
  if (saving.value) return;
  saving.value = true;
  try {
    circle.value = await api.updateGroupNickname(id.value, {
      groupNickname: trimText(value) || null,
    });
    editor.value = null;
    toast(trimText(value) ? "群昵称改好了" : "群昵称清掉了，用回你的昵称");
  } catch (error) {
    toastError(error);
  } finally {
    saving.value = false;
  }
}

// ---------- 转让、解散、退群 ----------

function openTransfer(): void {
  if (transferOptions.value.length === 0) {
    toast("群里只有你，没人可以转让");
    return;
  }
  confirm.value = null;
  editor.value = "transfer";
}

function pickTransfer(userId: string): void {
  transferTo.value = members.value.find((member) => member.user.id === userId) ?? null;
  editor.value = null;
  if (transferTo.value) confirm.value = "transfer";
}

async function startLeave(): Promise<void> {
  try {
    const preview = await api.leavePreview(id.value);
    if (preview.blocker === "OWNER_MUST_TRANSFER") confirm.value = "mustTransfer";
    else if (preview.blocker === "OWNER_ALONE") confirm.value = "alone";
    // 阶段 2 有了计划：preview 里会按鸽了处理的计划要在确认卡上逐个写清日期、星期和时段
    else confirm.value = "leave";
  } catch (error) {
    toastError(error);
  }
}

function backToGroups(message?: string): void {
  uni.reLaunch({
    url: "/pages/main/index?tab=groups",
    success: () => {
      if (message) toast(message);
    },
  });
}

async function run(action: () => Promise<void>): Promise<void> {
  if (saving.value) return;
  saving.value = true;
  try {
    await action();
  } catch (error) {
    toastError(error);
  } finally {
    saving.value = false;
  }
}

function onConfirm(): void {
  const detail = circle.value;
  if (!detail) return;

  switch (confirm.value) {
    case "transfer": {
      const target = transferTo.value;
      if (!target) return;
      void run(async () => {
        circle.value = await api.transfer(id.value, { toUserId: target.user.id });
        confirm.value = null;
        toast(`群主已经转给${target.user.name}`);
      });
      return;
    }
    case "dissolve":
      void run(async () => {
        await api.dissolve(id.value);
        confirm.value = null;
        backToGroups(`「${detail.name}」已解散`);
      });
      return;
    case "leave":
      void run(async () => {
        await api.leave(id.value);
        confirm.value = null;
        backToGroups(`已退出「${detail.name}」`);
      });
      return;
    case "mustTransfer":
      openTransfer();
      return;
    case "alone":
      confirm.value = "dissolve";
      return;
    default:
  }
}

const confirmCopy = computed(() => {
  const name = circle.value?.name ?? "";
  const target = transferTo.value?.user.name ?? "";

  switch (confirm.value) {
    case "transfer":
      return {
        title: `把群主转给${target}？`,
        subtitle: "转让后你就是普通成员，群设置只有新群主能改。",
        confirmText: "转让",
      };
    case "dissolve":
      return {
        title: `解散「${name}」？`,
        subtitle: "所有人都会被移出，计划和鸽王记录会一起删除，没法恢复。",
        confirmText: "解散",
      };
    case "leave":
      return {
        title: `退出「${name}」？`,
        subtitle: "退出后就看不到本群的计划了；想回来，要重新拿邀请。",
        confirmText: "退出",
      };
    case "mustTransfer":
      return {
        title: "群主要先转让才能退",
        subtitle: "把群主转给群里的人，你就能退出了。",
        confirmText: "去转让",
      };
    case "alone":
      return {
        title: "群里只剩你了",
        subtitle: "群主不能退群；不想要这个群了，可以解散。",
        confirmText: "解散群组",
      };
    default:
      return { title: "", subtitle: "", confirmText: "" };
  }
});
</script>

<template>
  <YqPage>
    <YqNavBar title="群设置" />

    <view v-if="gone" class="body">
      <YqEmptyState title="这个群找不到了" desc="可能已经解散，或者你已经不在这个群里" />
    </view>

    <view v-else-if="circle" class="body">
      <!-- 群主版（设计稿） -->
      <template v-if="isOwner">
        <YqListGroup label="群信息">
          <YqListRow label="群头像" size="lg" arrow @click="editor = 'avatar'">
            <template #right><YqCircleAvatar :avatar="circle.avatar" :size="34" /></template>
          </YqListRow>
          <YqListRow label="群名" :value="circle.name" display-value arrow @click="editor = 'name'" />
          <YqListRow
            label="群类型"
            :value="CIRCLE_TYPE_LABELS[circle.type]"
            arrow
            @click="editor = 'type'"
          />
          <YqListRow
            label="时区"
            sub="计划时间都按这个时区显示"
            :value="zoneText(circle.timezone)"
            size="lg"
            arrow
            :divider="false"
            @click="editor = 'timezone'"
          />
        </YqListGroup>

        <YqListGroup label="成员与邀请">
          <YqListRow label="加入需群主同意" sub="关闭时，拿到邀请就能直接加入" size="lg">
            <template #right>
              <YqSwitch
                :model-value="circle.needApproval"
                @update:model-value="toggle('needApproval', $event)"
              />
            </template>
          </YqListRow>
          <YqListRow label="仅群主可邀请" sub="关闭时，人人都能拉朋友进群" size="lg" :divider="false">
            <template #right>
              <YqSwitch
                :model-value="circle.inviteOwnerOnly"
                @update:model-value="toggle('inviteOwnerOnly', $event)"
              />
            </template>
          </YqListRow>
        </YqListGroup>

        <YqListGroup label="鸽子王" tone="king">
          <YqListRow
            label="鸽子王评选"
            sub="每周一 10:00 揭晓；关掉后不评选，也不显示鸽榜"
            size="xl"
            strong
          >
            <template #left><YqIllustration name="gg" :width="34" /></template>
            <template #right>
              <YqSwitch
                :model-value="circle.pigeonEnabled"
                @update:model-value="toggle('pigeonEnabled', $event)"
              />
            </template>
          </YqListRow>
          <YqListRow label="鸽王任务卡" size="auto" arrow :divider="false" @click="editor = 'penalty'">
            <template #below>
              <text v-if="circle.penaltyText" class="task">{{ circle.penaltyText }}</text>
              <text v-else class="task task--empty">还没写，鸽子王这周要做点什么？</text>
            </template>
          </YqListRow>
        </YqListGroup>

        <YqListGroup label="群主操作">
          <YqListRow label="转让群主" arrow @click="openTransfer" />
          <YqListRow
            label="解散群组"
            value="计划和鸽王记录会一起删除"
            danger
            arrow
            :divider="false"
            @click="confirm = 'dissolve'"
          />
        </YqListGroup>
      </template>

      <!-- 成员版：只读 -->
      <template v-else>
        <text class="note">群设置只有群主能改，你可以改自己的群昵称</text>
        <YqListGroup label="群信息">
          <YqListRow label="群头像" size="lg">
            <template #right><YqCircleAvatar :avatar="circle.avatar" :size="34" /></template>
          </YqListRow>
          <YqListRow label="群名" :value="circle.name" display-value />
          <YqListRow label="群类型" :value="CIRCLE_TYPE_LABELS[circle.type]" />
          <YqListRow
            label="时区"
            sub="计划时间都按这个时区显示"
            :value="zoneText(circle.timezone)"
            size="lg"
            :divider="false"
          />
        </YqListGroup>

        <YqListGroup label="成员与邀请">
          <YqListRow label="加入需群主同意" :value="onOff(circle.needApproval)" />
          <YqListRow label="仅群主可邀请" :value="onOff(circle.inviteOwnerOnly)" :divider="false" />
        </YqListGroup>

        <YqListGroup label="鸽子王" tone="king">
          <YqListRow
            label="鸽子王评选"
            sub="每周一 10:00 揭晓"
            :value="onOff(circle.pigeonEnabled)"
            size="xl"
            strong
            :divider="Boolean(circle.penaltyText)"
          >
            <template #left><YqIllustration name="gg" :width="34" /></template>
          </YqListRow>
          <YqListRow v-if="circle.penaltyText" label="鸽王任务卡" size="auto" :divider="false">
            <template #below><text class="task">{{ circle.penaltyText }}</text></template>
          </YqListRow>
        </YqListGroup>
      </template>

      <YqListGroup label="我在本群">
        <YqListRow
          label="我的群昵称"
          sub="只在本群显示，不填就用你的昵称"
          :value="circle.myGroupNickname ?? '未设置'"
          size="lg"
          arrow
          @click="editor = 'nickname'"
        />
        <YqListRow label="退出群组" danger arrow :divider="false" @click="startLeave" />
      </YqListGroup>
    </view>

    <template v-if="circle">
      <YqSheet :visible="editor === 'avatar'" title="换个群头像" :dismissible="!saving" @close="editor = null">
        <CircleAvatarGrid :model-value="circle.avatar" @pick="saveAvatar" />
      </YqSheet>

      <YqTextSheet
        :visible="editor === 'name'"
        title="改群名"
        :value="circle.name"
        :maxlength="CIRCLE_NAME_MAX"
        display
        :loading="saving"
        @save="saveName"
        @close="editor = null"
      />

      <YqOptionSheet
        :visible="editor === 'type'"
        title="群类型"
        :options="typeOptions"
        :model-value="circle.type"
        @select="saveType"
        @close="editor = null"
      />

      <YqOptionSheet
        :visible="editor === 'timezone'"
        title="群时区"
        :options="zoneOptions"
        :model-value="circle.timezone"
        @select="saveZone"
        @close="editor = null"
      />

      <YqTextSheet
        :visible="editor === 'penalty'"
        title="鸽王任务卡"
        :value="circle.penaltyText ?? ''"
        :maxlength="PENALTY_TEXT_MAX"
        placeholder="例如：下次局负责订位"
        hint="当上鸽子王的人这周要做的事；留空就是不设"
        :loading="saving"
        @save="savePenalty"
        @close="editor = null"
      />

      <YqTextSheet
        :visible="editor === 'nickname'"
        title="我的群昵称"
        :value="circle.myGroupNickname ?? ''"
        :maxlength="GROUP_NICKNAME_MAX"
        placeholder="例如：阿杰"
        hint="只在本群显示；留空就用你的昵称"
        :loading="saving"
        @save="saveNickname"
        @close="editor = null"
      />

      <YqOptionSheet
        :visible="editor === 'transfer'"
        title="把群主转给谁？"
        :options="transferOptions"
        @select="pickTransfer"
        @close="editor = null"
      />

      <YqConfirmSheet
        :visible="confirm !== null"
        :title="confirmCopy.title"
        :subtitle="confirmCopy.subtitle"
        :confirm-text="confirmCopy.confirmText"
        :loading="saving"
        @confirm="onConfirm"
        @cancel="confirm = null"
      />
    </template>
  </YqPage>
</template>

<style scoped>
.body {
  padding: 10px 16px 32px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.note {
  font-size: 12px;
  color: var(--yq-color-text-secondary);
}

.task {
  box-sizing: border-box;
  padding: 5px 10px;
  background: var(--yq-color-surface);
  border: var(--yq-border-field-thin);
  border-radius: var(--yq-radius-sm);
  font-size: 13px;
  font-weight: var(--yq-font-weight-700);
}

.task--empty {
  color: var(--yq-color-text-secondary);
}
</style>

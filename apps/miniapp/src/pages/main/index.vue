<script setup lang="ts">
import { onLoad, onShow } from "@dcloudio/uni-app";
import { ref } from "vue";

import YqPage from "../../components/YqPage.vue";
import YqTabBar from "../../components/YqTabBar.vue";
import type { TabKey } from "../../components/types";
import { ensureLogin } from "../../session/useSession";
import { toast, toastError } from "../../utils/feedback";
import GroupsTab from "./GroupsTab.vue";
import PlaceholderTab from "./PlaceholderTab.vue";

/**
 * 主壳：首页、日历、群组、我的四个 tab 加底部导航（docs/decisions.md 第 26 条：不用原生 tabBar）。
 * 这是正常入口：没填资料（没昵称）的人先去登录页（决定第 26 条）。
 * 阶段 1 只有群组 tab 是真的，所以默认停在群组。
 */
const TABS: TabKey[] = ["home", "calendar", "groups", "me"];
const tab = ref<TabKey>("groups");
const groups = ref<InstanceType<typeof GroupsTab> | null>(null);

function isTab(value: unknown): value is TabKey {
  return typeof value === "string" && (TABS as string[]).includes(value);
}

onLoad((query) => {
  if (isTab(query?.tab)) tab.value = query.tab;
});

onShow(async () => {
  try {
    const me = await ensureLogin();
    if (!me.profileCompleted) {
      uni.reLaunch({ url: "/pages/login/index" });
      return;
    }
    // 从群组主页、建群页回来时刷新一下（可能建了群、退了群）
    await groups.value?.refresh();
  } catch (error) {
    toastError(error);
  }
});

function change(next: TabKey): void {
  tab.value = next;
  if (next === "groups") void groups.value?.refresh();
}

function create(): void {
  toast("发起计划在下个阶段上线");
}
</script>

<template>
  <YqPage>
    <GroupsTab v-show="tab === 'groups'" ref="groups" />
    <PlaceholderTab v-if="tab !== 'groups'" :tab="tab" />
    <YqTabBar :current="tab" @change="change" @create="create" />
  </YqPage>
</template>

<script setup lang="ts">
import { computed } from "vue";

import YqEmptyState from "../../components/YqEmptyState.vue";
import YqListGroup from "../../components/YqListGroup.vue";
import YqListRow from "../../components/YqListRow.vue";
import YqNavBar from "../../components/YqNavBar.vue";
import type { TabKey } from "../../components/types";
import { apiMode } from "../../request";

/**
 * 还没做的 tab：首页、日历在阶段 2，我的在阶段 4。先占个位，底部导航能点。
 * 「我的」里先放主题入口（设置页阶段 4 做，主题选择页阶段 1 就有了），开发时再放组件演示和健康检查。
 */
const props = defineProps<{ tab: Exclude<TabKey, "groups"> }>();

const TEXT: Record<Exclude<TabKey, "groups">, { title: string; empty: string; desc: string }> = {
  home: { title: "首页", empty: "这周还没人约，你来当局长？", desc: "发起计划在下个阶段上线" },
  calendar: { title: "日历", empty: "日历在下个阶段上线", desc: "到时候按周、按月看所有计划" },
  me: { title: "我的", empty: "我的页面在后面的阶段做", desc: "数据卡、徽章、免鸽卡都会放在这里" },
};

const text = computed(() => TEXT[props.tab]);
/** 组件演示、健康检查只在开发时露出来（正式环境是 cloud 档） */
const showDev = apiMode !== "cloud";

function go(url: string): void {
  uni.navigateTo({ url });
}
</script>

<template>
  <view>
    <YqNavBar variant="large" :title="text.title" />
    <view class="body">
      <YqEmptyState :title="text.empty" :desc="text.desc" />

      <YqListGroup v-if="tab === 'me'" label="外观">
        <YqListRow
          label="主题"
          sub="贴纸风、软糖风、清爽风"
          arrow
          :divider="false"
          @click="go('/pages/settings/theme')"
        />
      </YqListGroup>

      <YqListGroup v-if="tab === 'me' && showDev" label="开发用">
        <YqListRow label="组件演示" arrow @click="go('/pages/dev/components')" />
        <YqListRow label="后端健康检查" arrow :divider="false" @click="go('/pages/dev/health')" />
      </YqListGroup>
    </view>
  </view>
</template>

<style scoped>
.body {
  padding: 12px 16px 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>

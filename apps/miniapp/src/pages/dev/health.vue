<script setup lang="ts">
import { APP_NAME, type HealthResult } from "@yiqi/shared";
import { onMounted, ref } from "vue";

import YqButton from "../../components/YqButton.vue";
import YqCard from "../../components/YqCard.vue";
import YqNavBar from "../../components/YqNavBar.vue";
import YqPage from "../../components/YqPage.vue";
import { api, apiMode } from "../../request";

/** 第 0 步的首页挪过来的：调 GET /api/v1/health，联调时看后端通没通。只在开发时用。 */
const loading = ref(true);
const health = ref<HealthResult | null>(null);
const errorText = ref("");

async function load(): Promise<void> {
  loading.value = true;
  errorText.value = "";

  try {
    health.value = await api.health();
  } catch (error) {
    health.value = null;
    errorText.value = error instanceof Error ? error.message : String(error);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  void load();
});
</script>

<template>
  <YqPage>
    <YqNavBar title="后端健康检查" />
    <view class="body">
      <text class="title">{{ APP_NAME }}</text>

      <YqCard>
        <view class="rows">
          <text class="row">请求层档位：{{ apiMode }}</text>
          <text v-if="loading" class="row">正在请求 GET /api/v1/health …</text>
          <text v-else-if="errorText" class="row row--error">{{ errorText }}</text>
          <template v-else-if="health">
            <text class="row">接口返回：{{ health.ok ? "ok" : "不 ok" }}</text>
            <text class="row">应用名称：{{ health.name }}</text>
            <text class="row">数据库：{{ health.deps.db }}</text>
            <text class="row">Redis：{{ health.deps.redis }}</text>
            <text class="row">微信能力：{{ health.wechatDriver }}</text>
            <text class="row">服务器时间（UTC）：{{ health.serverTime }}</text>
          </template>
        </view>
      </YqCard>

      <YqButton variant="primary" block @click="load">再查一次</YqButton>
    </view>
  </YqPage>
</template>

<style scoped>
.body {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 8px 16px 32px;
}

.title {
  font-family: var(--yq-font-logo);
  font-size: 32px;
}

.rows {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.row {
  font-size: 14px;
  line-height: 1.6;
}

.row--error {
  color: var(--yq-color-danger-text);
}
</style>

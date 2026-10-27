<script setup lang="ts">
import { APP_NAME, type HealthResult } from "@yiqi/shared";
import { onMounted, ref } from "vue";

import { api, apiMode } from "../../request";

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
  <!-- 主题类挂在页面根节点上；阶段 1 会按用户设置切换，这里先固定默认的贴纸风 -->
  <view class="page yq-theme-sticker">
    <text class="title">{{ APP_NAME }}</text>
    <text class="subtitle">第 0 步 · 工程骨架</text>

    <view class="card">
      <text class="card-title">后端健康检查</text>
      <text class="row">请求层档位：{{ apiMode }}</text>

      <text v-if="loading" class="row">正在请求 GET /api/v1/health …</text>
      <text v-else-if="errorText" class="row row-error">{{ errorText }}</text>
      <template v-else-if="health">
        <text class="row">接口返回：{{ health.ok ? "ok" : "不 ok" }}</text>
        <text class="row">应用名称：{{ health.name }}</text>
        <text class="row">数据库：{{ health.deps.db }}</text>
        <text class="row">Redis：{{ health.deps.redis }}</text>
        <text class="row">微信能力：{{ health.wechatDriver }}</text>
        <text class="row">服务器时间（UTC）：{{ health.serverTime }}</text>
      </template>
    </view>

    <button class="btn" @click="load">再查一次</button>
  </view>
</template>

<style scoped>
/* 只用主题变量，不写死颜色、圆角、阴影、字体（见 .claude/rules/miniapp.md）。
   尺寸用 rpx：设计稿按 390 宽画，乘 750/390 ≈ 1.92。 */
.page {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 24rpx;
  min-height: 100vh;
  padding: 64rpx 32rpx;
  background: var(--yq-color-bg);
  color: var(--yq-color-text);
  font-family: var(--yq-font-body);
}

.title {
  font-family: var(--yq-font-display);
  font-size: 64rpx;
  line-height: 1.2;
}

.subtitle {
  font-size: 28rpx;
  color: var(--yq-color-text-secondary);
}

.card {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  padding: 32rpx;
  background: var(--yq-color-surface);
  border: var(--yq-border-card);
  border-radius: var(--yq-radius-card);
  box-shadow: var(--yq-shadow-card);
}

.card-title {
  font-family: var(--yq-font-display);
  font-size: 36rpx;
  margin-bottom: 8rpx;
}

.row {
  font-size: 28rpx;
  line-height: 1.6;
}

.row-error {
  color: var(--yq-color-danger-text);
}

/* 可点区域不小于 44×44（设计稿尺寸）→ 至少 84rpx 高 */
.btn {
  min-height: 88rpx;
  margin: 0;
  background: var(--yq-color-primary);
  color: var(--yq-color-on-primary);
  border: var(--yq-border-button);
  border-radius: var(--yq-radius-button);
  box-shadow: var(--yq-shadow-button);
  font-family: var(--yq-font-display);
  font-size: 32rpx;
  font-weight: var(--yq-font-button-weight);
}
</style>

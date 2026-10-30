<script setup lang="ts">
import { APP_NAME } from "@yiqi/shared";

import YqCard from "../../components/YqCard.vue";
import YqNavBar from "../../components/YqNavBar.vue";
import YqPage from "../../components/YqPage.vue";

/**
 * 用户协议。正文由产品负责人在提审前补上（docs/platform-checklist.md「隐私政策和用户协议」），
 * 这里先放占位，保证登录页的链接点得开。隐私保护指引不在这里：走 wx.openPrivacyContract。
 */
</script>

<template>
  <YqPage>
    <YqNavBar title="用户协议" />
    <view class="body">
      <YqCard>
        <view class="text">
          <text class="title">{{ APP_NAME }} 用户协议</text>
          <text class="para">协议正文还在写，提审前补上。</text>
          <text class="para">
            {{ APP_NAME }}只用你的微信身份标识、你填的头像昵称和你在群里发的内容，不收集手机号；
            数据存在境内服务器。
          </text>
        </view>
      </YqCard>
    </view>
  </YqPage>
</template>

<style scoped>
.body {
  padding: 8px 16px 32px;
}

.text {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.title {
  font-family: var(--yq-font-display);
  font-weight: var(--yq-font-display-weight);
  font-size: var(--yq-size-display-21);
}

.para {
  font-size: 14px;
  line-height: 1.7;
  color: var(--yq-color-text-secondary);
}
</style>

<script setup lang="ts">
import { onLoad } from "@dcloudio/uni-app";
import { APP_NAME, checkNickname, trimText } from "@yiqi/shared";
import { computed, ref } from "vue";

import YqAvatar from "../../components/YqAvatar.vue";
import YqButton from "../../components/YqButton.vue";
import YqIcon from "../../components/YqIcon.vue";
import YqIllustration from "../../components/YqIllustration.vue";
import YqInput from "../../components/YqInput.vue";
import YqNavBar from "../../components/YqNavBar.vue";
import YqPage from "../../components/YqPage.vue";
import { platform } from "../../platform";
import { api } from "../../request";
import { ensureLogin, setUser, useSession } from "../../session/useSession";
import { toast, toastError } from "../../utils/feedback";

/**
 * 登录与资料（设计稿 Login）：第一次进来先认识一下，用头像昵称填写组件设置头像和昵称
 * （docs/spec.md「页面清单」）。登录本身不用点：身份是云托管注入的 openid（决定第 22 条）。
 * 从加入落地页直接加入的人没填资料，下次从正常入口进来会被带到这里（决定第 26 条）。
 */
const { user } = useSession();
const nickname = ref("");
/** 刚选的头像（临时文件），点「开始约局」时才上传 */
const pickedAvatar = ref("");
const agreed = ref(false);
const saving = ref(false);

const avatarUser = computed(() => ({
  id: user.value?.id ?? "0",
  name: nickname.value || "?",
  avatarUrl: pickedAvatar.value || user.value?.avatarUrl || null,
}));

onLoad(async () => {
  try {
    const me = await ensureLogin();
    nickname.value = me.nickname ?? "";
    agreed.value = me.profileCompleted;
  } catch (error) {
    toastError(error);
  }
});

/** 小程序：头像昵称填写组件选的头像 */
function onChooseAvatar(event: { detail: { avatarUrl: string } }): void {
  pickedAvatar.value = event.detail.avatarUrl;
}

/** H5 预览没有头像昵称填写组件，用选图片代替 */
function pickImage(): void {
  uni.chooseImage({
    count: 1,
    success: (res) => {
      const [path] = res.tempFilePaths as string[];
      if (path) pickedAvatar.value = path;
    },
  });
}

function openAgreement(): void {
  uni.navigateTo({ url: "/pages/legal/agreement" });
}

function openPrivacy(): void {
  platform.openPrivacyContract().catch(toastError);
}

async function start(): Promise<void> {
  if (!agreed.value) {
    toast("先勾选同意《用户协议》和《隐私保护指引》");
    return;
  }

  const name = trimText(nickname.value);
  const problem = checkNickname(name);
  if (problem) {
    toast(problem);
    return;
  }

  saving.value = true;
  try {
    const avatarUrl = pickedAvatar.value
      ? await platform.uploadImage(pickedAvatar.value, "avatar")
      : undefined;
    setUser(await api.updateProfile({ nickname: name, avatarUrl }));
    uni.reLaunch({ url: "/pages/main/index?tab=groups" });
  } catch (error) {
    toastError(error);
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <YqPage>
    <YqNavBar variant="blank" />

    <view class="login">
      <view class="hero">
        <view class="hero__bird yq-anim">
          <YqIllustration name="gg" :width="128" />
          <view class="hero__wing yq-anim">
            <YqIllustration name="wing" :width="26" :height="44" />
          </view>
        </view>
        <text class="hero__name">{{ APP_NAME }}</text>
        <text class="hero__slogan">约饭一键表态，鸽了全群都知道</text>
      </view>

      <view class="card">
        <view class="card__head">
          <text class="card__title">先认识一下</text>
          <text class="card__note">只在你加入的群里显示</text>
        </view>

        <view class="profile">
          <!-- #ifdef MP-WEIXIN -->
          <button class="avatar-picker" open-type="chooseAvatar" @chooseavatar="onChooseAvatar">
            <YqAvatar :user="avatarUser" :size="84" />
            <view class="avatar-picker__badge">
              <YqIcon name="camera" :size="16" />
            </view>
          </button>
          <!-- #endif -->
          <!-- #ifndef MP-WEIXIN -->
          <view class="avatar-picker" @click="pickImage">
            <YqAvatar :user="avatarUser" :size="84" />
            <view class="avatar-picker__badge">
              <YqIcon name="camera" :size="16" />
            </view>
          </view>
          <!-- #endif -->

          <view class="profile__fields">
            <text class="profile__label">昵称</text>
            <YqInput
              v-model="nickname"
              type="nickname"
              :maxlength="12"
              counter
              display
              placeholder="点这里用微信昵称"
            />
            <text class="profile__hint">可以一键用微信头像和昵称</text>
          </view>
        </view>

        <view class="agree" @click="agreed = !agreed">
          <view class="agree__box" :class="{ 'is-on': agreed }">
            <YqIcon v-if="agreed" name="check" :size="12" />
          </view>
          <view class="agree__text">
            <text>我已阅读并同意</text>
            <text class="agree__link" @click.stop="openAgreement">《用户协议》</text>
            <text>和</text>
            <text class="agree__link" @click.stop="openPrivacy">《隐私保护指引》</text>
          </view>
        </view>
      </view>

      <view class="steps">
        <text class="steps__chip steps__chip--1">① 建群拉人</text>
        <text class="steps__chip steps__chip--2">② 发个计划</text>
        <text class="steps__chip steps__chip--3">③ 一键表态</text>
      </view>

      <view class="spacer" />

      <view class="cta">
        <YqButton variant="primary" size="xl" block :loading="saving" @click="start">
          开始约局
        </YqButton>
        <text class="cta__note">用微信身份登录，不收集手机号</text>
      </view>
    </view>
  </YqPage>
</template>

<style scoped>
.login {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0 16px 28px;
}

.hero {
  margin-top: 44px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.hero__bird {
  position: relative;
  width: 128px;
  height: 128px;
  animation: login-bob 2.6s ease-in-out infinite;
}

.hero__wing {
  position: absolute;
  right: 2px;
  top: 52px;
  transform-origin: 50% 90%;
  animation: login-wave 0.9s ease-in-out infinite;
}

.hero__name {
  font-family: var(--yq-font-logo);
  font-size: 42px;
  line-height: 1.1;
}

.hero__slogan {
  font-size: 14px;
  color: var(--yq-color-text-secondary);
}

.card {
  margin-top: 82px;
  box-sizing: border-box;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  background: var(--yq-color-surface);
  border: var(--yq-border-card);
  border-radius: var(--yq-radius-3xl);
  box-shadow: var(--yq-shadow-surface-xl);
}

.card__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}

.card__title {
  font-family: var(--yq-font-display);
  font-weight: var(--yq-font-display-weight);
  font-size: var(--yq-size-display-22);
  line-height: 1.2;
}

.card__note {
  font-size: 12px;
  color: var(--yq-color-text-secondary);
}

.profile {
  display: flex;
  align-items: center;
  gap: 16px;
}

.avatar-picker {
  position: relative;
  flex: none;
  width: 84px;
  height: 84px;
  margin: 0;
  padding: 0;
  background: transparent;
  border: none;
  overflow: visible;
  line-height: 1;
}

.avatar-picker::after {
  border: none;
}

.avatar-picker__badge {
  position: absolute;
  right: -4px;
  bottom: -2px;
  box-sizing: border-box;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--yq-color-king);
  border: var(--yq-border-card);
  border-radius: 50%;
  color: var(--yq-color-text);
}

.profile__fields {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.profile__label {
  font-size: 13px;
  font-weight: var(--yq-font-weight-900);
}

.profile__hint {
  font-size: 11.5px;
  color: var(--yq-color-text-secondary);
}

.agree {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 12.5px;
}

.agree__box {
  box-sizing: border-box;
  flex: none;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--yq-color-surface);
  border: var(--yq-border-card);
  border-radius: var(--yq-radius-xs);
  color: var(--yq-color-text);
}

.agree__box.is-on {
  background: var(--yq-color-formed);
}

.agree__text {
  display: flex;
  flex-wrap: wrap;
}

.agree__link {
  font-weight: var(--yq-font-weight-900);
  text-decoration: underline;
}

.steps {
  margin-top: 63px;
  display: flex;
  justify-content: center;
  gap: 8px;
  font-size: 12.5px;
  font-weight: var(--yq-font-weight-900);
}

.steps__chip {
  padding: 3px 10px;
  background: var(--yq-button-secondary-bg);
  border: var(--yq-border-chip);
  border-radius: 999px;
}

/* 三个小标签歪着贴，清爽风摆正（--yq-tilt-scale 是 0） */
.steps__chip--1 {
  transform: rotate(calc(-3deg * var(--yq-tilt-scale)));
}

.steps__chip--2 {
  background: var(--yq-chip-king-bg);
  transform: rotate(calc(2deg * var(--yq-tilt-scale)));
}

.steps__chip--3 {
  transform: rotate(calc(-2deg * var(--yq-tilt-scale)));
}

.spacer {
  flex: 1;
  min-height: 24px;
}

.cta {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.cta__note {
  text-align: center;
  font-size: 12px;
  color: var(--yq-color-text-secondary);
}

@keyframes login-bob {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-4px);
  }
}

@keyframes login-wave {
  0%,
  100% {
    transform: rotate(-10deg);
  }
  50% {
    transform: rotate(14deg);
  }
}
</style>

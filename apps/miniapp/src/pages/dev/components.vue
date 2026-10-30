<script setup lang="ts">
import { APP_NAME, THEMES, THEME_META, revealRuleText, type ThemeName } from "@yiqi/shared";
import { computed, ref } from "vue";

import tokens from "../../../../../docs/design/tokens.json";
import YqAvatar from "../../components/YqAvatar.vue";
import YqAvatarStack from "../../components/YqAvatarStack.vue";
import YqButton from "../../components/YqButton.vue";
import YqCard from "../../components/YqCard.vue";
import YqChip from "../../components/YqChip.vue";
import YqCircleAvatar from "../../components/YqCircleAvatar.vue";
import YqCodeBoxes from "../../components/YqCodeBoxes.vue";
import YqConfirmSheet from "../../components/YqConfirmSheet.vue";
import YqEmptyState from "../../components/YqEmptyState.vue";
import YqFab from "../../components/YqFab.vue";
import YqIcon from "../../components/YqIcon.vue";
import YqIllustration from "../../components/YqIllustration.vue";
import YqInput from "../../components/YqInput.vue";
import YqListGroup from "../../components/YqListGroup.vue";
import YqListRow from "../../components/YqListRow.vue";
import YqNavBar from "../../components/YqNavBar.vue";
import YqPage from "../../components/YqPage.vue";
import YqSwitch from "../../components/YqSwitch.vue";
import YqTabBar from "../../components/YqTabBar.vue";
import YqTabs from "../../components/YqTabs.vue";
import type { IconName, KingKind, TabKey } from "../../components/types";
import { PEOPLE } from "../../mocks/people";
import { apiMode } from "../../request";
import { devOpenid, setDevOpenid } from "../../request/dev-identity";
import { setTheme, useTheme } from "../../theme/useTheme";

/**
 * 组件演示页。上半部分照设计稿 Main（风格说明板）排：1240 宽时两栏，和 Main 一比一对照
 * （/design-check Main，截图工具用 1240 × 844 截）；手机上单栏。下半部分列出 Main 里没有的组件。
 * 右上角主题胶囊点一下换下一套主题。
 *
 * 只在开发时用，阶段 5 提审前从正式包里拿掉。
 * 页面上的「周五 18:30 火锅局」「本周五 · 10月23日 · 晚上 18:30」是字样展示，照抄设计稿，不是算出来的日期。
 */
const { theme } = useTheme();

type ColorKey = keyof (typeof tokens.themes)["sticker"]["color"];

interface Swatch {
  name: string;
  use: string;
  /** 显示色值用 tokens.json 里的哪个颜色；颈羽那格是两种颜色拼起来，不显示色值 */
  token?: ColorKey;
  /** 色块用哪个主题变量（或者两个拼起来） */
  fill: string | [string, string];
}

/** 风格说明板上每套主题对颜色的叫法（文案取自三套 Main） */
const SWATCHES: Record<ThemeName, Swatch[]> = {
  sticker: [
    { name: "番茄红", use: "跟了、主按钮", token: "primary", fill: "--yq-color-primary" },
    { name: "芥末黄", use: "鸽王、皇冠", token: "king", fill: "--yq-color-king" },
    { name: "薄荷绿", use: "成局、完成", token: "formed", fill: "--yq-color-formed" },
    { name: "天空蓝", use: "招募中、提示", token: "recruiting", fill: "--yq-color-recruiting" },
    { name: "鸽子灰", use: "鸽了、吉祥物", token: "flaked", fill: "--yq-color-flaked" },
    {
      name: "颈羽绿紫",
      use: "鸽子身上的点缀",
      fill: ["--yq-color-formed", "--yq-chip-lavender-bg"],
    },
    { name: "奶油底", use: "页面底色", token: "bg", fill: "--yq-color-bg" },
    { name: "墨色", use: "描边、文字", token: "text", fill: "--yq-color-text" },
  ],
  cute: [
    { name: "软糖粉", use: "跟了、主按钮", token: "primary", fill: "--yq-color-primary" },
    { name: "奶黄", use: "鸽王、皇冠", token: "king", fill: "--yq-color-king" },
    { name: "薄荷", use: "成局、完成", token: "formed", fill: "--yq-color-formed" },
    { name: "汽水蓝", use: "招募中、提示", token: "recruiting", fill: "--yq-color-recruiting" },
    { name: "云朵灰", use: "鸽了、吉祥物", token: "flaked", fill: "--yq-color-flaked" },
    { name: "颈羽", use: "鸽子身上的点缀", fill: ["--yq-color-formed", "--yq-chip-lavender-bg"] },
    { name: "樱花底", use: "页面底色，带小圆点", token: "bg", fill: "--yq-color-bg" },
    { name: "可可棕", use: "描边；文字 #4A3228", token: "outline", fill: "--yq-color-outline" },
  ],
  clean: [
    { name: "番茄红", use: "主按钮，配白字", token: "primary", fill: "--yq-color-primary" },
    { name: "金黄", use: "鸽王、皇冠", token: "king", fill: "--yq-color-king" },
    { name: "森林绿", use: "成局、完成", token: "formed", fill: "--yq-color-formed" },
    { name: "湖蓝", use: "招募中、提示", token: "recruiting", fill: "--yq-color-recruiting" },
    { name: "鸽子灰", use: "鸽了、吉祥物", token: "flaked", fill: "--yq-color-flaked" },
    {
      name: "浅色底",
      use: "标签和横幅只用浅色",
      fill: ["--yq-chip-formed-bg", "--yq-chip-king-bg"],
    },
    { name: "雾白底", use: "页面底色", token: "bg", fill: "--yq-color-bg" },
    { name: "墨黑", use: "文字，不描边", token: "text", fill: "--yq-color-text" },
  ],
};

const FONT_NOTES: Record<ThemeName, [string, string]> = {
  sticker: ["标题、时间、数字 · 站酷快乐体 ZCOOL KuaiLe", "正文、说明 · 思源黑体 Noto Sans SC"],
  cute: ["标题、时间、数字、按钮 · 站酷快乐体 ZCOOL KuaiLe", "正文、说明 · 思源黑体 Noto Sans SC"],
  clean: [
    "标题和数字也用思源黑体加粗，只有 logo 用快乐体",
    "正文、说明 · 思源黑体 Noto Sans SC，数字等宽",
  ],
};

const swatches = computed(() =>
  SWATCHES[theme.value].map((swatch) => {
    const hex = swatch.token
      ? (tokens.themes[theme.value].color as Record<string, string>)[swatch.token]
      : "";
    return {
      ...swatch,
      label: hex ? `${swatch.name} ${hex}` : swatch.name,
      split: Array.isArray(swatch.fill),
      style: Array.isArray(swatch.fill) ? {} : { background: `var(${swatch.fill})` },
      left: Array.isArray(swatch.fill) ? { background: `var(${swatch.fill[0]})` } : {},
      right: Array.isArray(swatch.fill) ? { background: `var(${swatch.fill[1]})` } : {},
    };
  }),
);

const themeIndex = computed(() => THEMES.indexOf(theme.value) + 1);

function nextTheme(): void {
  void setTheme(THEMES[themeIndex.value % THEMES.length]!);
}

// ---------- 鸽子王头像 ----------
const king = { ...PEOPLE.wang };
const AVATAR_STATES: {
  label: string;
  user: typeof king;
  state?: "in" | "flaked";
  king?: KingKind;
}[] = [
  { label: "普通", user: PEOPLE.jie },
  { label: "跟了", user: PEOPLE.jie, state: "in" },
  { label: "鸽了", user: PEOPLE.mei, state: "flaked" },
  { label: "本周鸽王", user: king, king: "week" },
  { label: "连任鸽王", user: king, king: "streak" },
  { label: "月度鸽王", user: PEOPLE.zhuang, king: "month" },
];
const SMALL_SIZES = [28, 36, 44, 60];
const wallUsers = [PEOPLE.li, PEOPLE.zhuang, { ...PEOPLE.wang, king: "week" as const }, PEOPLE.mei];

// ---------- 下半部分：Main 里没有的组件 ----------
const ICONS: IconName[] = [
  "back",
  "plus",
  "key",
  "ban",
  "lock",
  "camera",
  "check",
  "chevron",
  "close",
  "miniprogram",
  "nav-home",
  "nav-calendar",
  "nav-groups",
  "nav-me",
];
const PRESETS = ["dorm", "family", "sport", "work", "food", "music"] as const;
const nickname = ref("阿杰");
const switchOn = ref(true);
const switchOff = ref(false);
const tab = ref("board");
const code = ref("K7Q2M9");
const typedCode = ref("");
const sheetOpen = ref(false);
const showTabBar = ref(false);
const showFab = ref(false);
const currentTab = ref<TabKey>("groups");

// local 档（微信开发者工具连本机后端）才有切测试用户这回事
const isLocal = apiMode === "local";
const TEST_USERS = ["openid_test_a", "openid_test_b", "openid_test_c"];
const testUser = ref(isLocal ? devOpenid() : "");

function useTestUser(openid: string): void {
  setDevOpenid(openid);
  testUser.value = openid;
  uni.showToast({ title: `已切到 ${openid}`, icon: "none" });
}
</script>

<template>
  <YqPage>
    <view class="board">
      <!-- ========== 照着 Main 排的部分 ========== -->
      <view class="board__head">
        <view class="board__brand">
          <YqIllustration name="gg" :width="68" />
          <view class="board__brand-text">
            <text class="board__logo">{{ APP_NAME }}</text>
            <text class="board__slogan">约饭一键表态，鸽了全群都知道</text>
          </view>
        </view>
        <view class="board__theme">
          <text class="board__theme-note">主题 {{ themeIndex }} / 3 · 用户在设置里切换</text>
          <view class="board__theme-pill" @click="nextTheme">{{ THEME_META[theme].fullName }}</view>
        </view>
      </view>

      <view class="board__grid">
        <view class="board__col">
          <view class="section">
            <text class="section__title">色彩</text>
            <view class="swatches">
              <view v-for="swatch in swatches" :key="swatch.name" class="swatch">
                <view v-if="swatch.split" class="swatch__chip swatch__chip--split">
                  <view class="swatch__half" :style="swatch.left" />
                  <view class="swatch__half" :style="swatch.right" />
                </view>
                <view v-else class="swatch__chip" :style="swatch.style" />
                <text class="swatch__name">{{ swatch.label }}</text>
                <text class="swatch__use">{{ swatch.use }}</text>
              </view>
            </view>
          </view>

          <view class="section">
            <text class="section__title">字体</text>
            <view class="font-sample">
              <text class="font-sample__display">周五 18:30 火锅局</text>
              <text class="font-sample__note">{{ FONT_NOTES[theme][0] }}</text>
            </view>
            <view class="font-sample">
              <text class="font-sample__body">本周五 · 10月23日 · 晚上 18:30</text>
              <text class="font-sample__note">{{ FONT_NOTES[theme][1] }}</text>
            </view>
          </view>

          <view class="section">
            <text class="section__title">按钮与标签</text>
            <view class="row">
              <YqButton variant="primary">跟了 · 周五 18:30</YqButton>
              <YqButton variant="secondary">不跟</YqButton>
              <YqButton variant="danger">确认鸽了</YqButton>
            </view>
            <view class="row row--wrap">
              <YqChip tone="recruiting">招募中 · 还差 1 人</YqChip>
              <YqChip tone="formed">已成局</YqChip>
              <YqChip tone="king">
                <template #icon><YqIllustration name="splat" :width="18" /></template>
                鸽王局
              </YqChip>
              <YqChip tone="cancelled">已取消</YqChip>
            </view>
          </view>
        </view>

        <view class="section section--king">
          <view class="section__head">
            <text class="section__title">鸽子王头像 · 头套</text>
            <text class="section__note">当选后挂一整周，所有头像位都换</text>
          </view>

          <view class="king-cards">
            <view class="king-card king-card--chosen">
              <text class="king-card__tag">方案 A · 鸽子头套</text>
              <YqAvatar :user="king" :size="132" king="week" />
              <text class="king-card__name">小王</text>
              <YqChip tone="king">本周鸽子王</YqChip>
            </view>
            <view class="king-card">
              <text class="king-card__tag">放进页面里</text>
              <view class="king-banner">
                <YqAvatar :user="king" :size="44" king="week" />
                <view class="king-banner__text">
                  <text class="king-banner__label">本周鸽子王</text>
                  <text class="king-banner__name">小王 · 鸽值 7</text>
                </view>
              </view>
              <view class="king-wall">
                <YqAvatarStack :users="wallUsers" :size="30" :overlap="6" :king-size="38" />
                <text class="king-wall__text">头像墙里最显眼</text>
              </view>
              <YqChip tone="king" size="sm">
                <template #icon><YqIllustration name="crown" :width="16" :height="11" /></template>
                鸽王局
              </YqChip>
            </view>
          </view>

          <text class="section__sub">头像状态</text>
          <view class="avatar-states">
            <view v-for="item in AVATAR_STATES" :key="item.label" class="avatar-state">
              <YqAvatar
                :user="item.user"
                :size="60"
                :state="item.state"
                :king="item.king ?? null"
              />
              <text class="avatar-state__label">{{ item.label }}</text>
            </view>
          </view>

          <view class="king-bottom">
            <view class="king-bottom__col">
              <text class="section__sub">小尺寸也认得出</text>
              <view class="sizes">
                <view v-for="size in SMALL_SIZES" :key="size" class="sizes__item">
                  <YqAvatar :user="king" :size="size" king="week" />
                  <text class="sizes__label">{{ size === 60 ? "60 px" : size }}</text>
                </view>
              </view>
            </view>
            <view class="king-bottom__col">
              <text class="section__sub">鸽王局特效素材</text>
              <view class="sizes">
                <view class="sizes__item">
                  <YqIllustration name="splat" :width="58" />
                  <text class="sizes__label">鸽屎</text>
                </view>
                <view class="sizes__item">
                  <YqIllustration name="drop" :width="20" :height="28" />
                  <text class="sizes__label">掉落</text>
                </view>
                <view class="sizes__item">
                  <YqIllustration name="feather" :width="24" :height="48" />
                  <text class="sizes__label">羽毛</text>
                </view>
                <view class="sizes__item">
                  <YqIllustration name="fly" :width="84" :height="54" />
                  <text class="sizes__label">飞过</text>
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- ========== 下面是 Main 里没有的组件 ========== -->
      <view class="more">
        <view class="section">
          <text class="section__title">主题和测试用户</text>
          <view class="row row--wrap">
            <YqButton
              v-for="name in THEMES"
              :key="name"
              :variant="name === theme ? 'primary' : 'secondary'"
              size="xs"
              @click="setTheme(name)"
            >
              {{ THEME_META[name].name }}
            </YqButton>
          </view>
          <view v-if="isLocal" class="row row--wrap">
            <YqButton
              v-for="openid in TEST_USERS"
              :key="openid"
              :variant="openid === testUser ? 'king' : 'secondary'"
              size="xs"
              @click="useTestUser(openid)"
            >
              {{ openid }}
            </YqButton>
          </view>
        </view>

        <view class="section">
          <text class="section__title">按钮尺寸</text>
          <YqButton variant="primary" size="xl" block>开始约局</YqButton>
          <YqButton variant="primary" size="lg" block>换成软糖风</YqButton>
          <view class="row row--wrap">
            <YqButton variant="king" size="sm">建个群</YqButton>
            <YqButton variant="secondary" size="sm">输入邀请码</YqButton>
            <YqButton variant="king" size="xs">复制</YqButton>
            <YqButton variant="secondary" size="xs">保存到相册</YqButton>
            <YqButton variant="king" size="mini">邀请好友</YqButton>
            <YqButton variant="secondary" size="mini">群设置</YqButton>
            <YqButton variant="primary" size="md" disabled>不能点</YqButton>
          </view>
          <view class="row row--wrap">
            <YqChip tone="progress" size="sm">进行中 2</YqChip>
            <YqChip tone="recruiting" size="sm">4 天 21 小时后揭晓</YqChip>
            <YqChip tone="progress" size="xs">领跑</YqChip>
            <YqChip tone="king" size="xs">鸽王局</YqChip>
            <YqChip tone="dark">连任 2 周</YqChip>
            <YqChip tone="formed" size="badge">使用中</YqChip>
            <YqChip tone="king" size="badge">预览中</YqChip>
          </view>
        </view>

        <view class="section">
          <text class="section__title">卡片和横条</text>
          <YqCard>
            <view class="group-card">
              <YqCircleAvatar avatar="preset:dorm" :size="48" />
              <view class="group-card__text">
                <text class="group-card__name">大学室友</text>
                <text class="group-card__meta">8 人 · 你是群主</text>
              </view>
              <YqChip tone="progress" size="sm">进行中 2</YqChip>
            </view>
            <template #band>
              <YqAvatar :user="king" :size="28" king="week" />
              <text class="band__text">本周鸽子王：小王</text>
              <text class="band__side">鸽值 7 ›</text>
            </template>
          </YqCard>
          <YqCard band-tone="peace">
            <view class="group-card">
              <YqCircleAvatar avatar="preset:family" :size="48" />
              <view class="group-card__text">
                <text class="group-card__name">家人群</text>
                <text class="group-card__meta">5 人 · 妈妈是群主</text>
              </view>
            </view>
            <template #band>
              <YqIllustration name="dove" :width="28" />
              <text class="band__text">和平周 · 连续 3 周零鸽</text>
              <text class="band__side">全员靠谱</text>
            </template>
          </YqCard>
          <YqCard band-tone="muted">
            <view class="group-card">
              <YqCircleAvatar avatar="preset:work" :size="48" />
              <view class="group-card__text">
                <text class="group-card__name">同事群</text>
                <text class="group-card__meta">20 人 · 小林是群主</text>
              </view>
            </view>
            <template #band>
              <YqIcon name="ban" :size="16" />
              <text>群主关闭了鸽子王评选</text>
            </template>
          </YqCard>
          <YqCard variant="king" size="sm">
            <text>鸽子王区（浅黄底）</text>
          </YqCard>
        </view>

        <view class="section">
          <text class="section__title">群头像预设</text>
          <view class="row row--wrap">
            <YqCircleAvatar
              v-for="preset in PRESETS"
              :key="preset"
              :avatar="`preset:${preset}`"
              :size="48"
            />
          </view>
          <view class="row row--wrap">
            <YqCircleAvatar avatar="preset:dorm" :size="34" />
            <YqCircleAvatar avatar="preset:dorm" :size="62" />
            <YqCircleAvatar avatar="preset:dorm" :size="76" tilt />
          </view>
        </view>

        <view class="section">
          <text class="section__title">图标</text>
          <view class="row row--wrap">
            <YqIcon v-for="icon in ICONS" :key="icon" :name="icon" :size="24" />
          </view>
        </view>

        <view class="section">
          <text class="section__title">顶部导航</text>
          <view class="nav-sample">
            <YqNavBar title="群组主页" custom-back />
          </view>
          <view class="nav-sample">
            <YqNavBar variant="large" title="群组" />
          </view>
          <view class="nav-sample">
            <YqNavBar variant="brand" />
          </view>
        </view>

        <view class="section">
          <text class="section__title">底部导航、悬浮按钮、确认卡</text>
          <view class="row row--wrap">
            <YqButton variant="secondary" size="xs" @click="showTabBar = !showTabBar">
              {{ showTabBar ? "收起底部导航" : "看底部导航" }}
            </YqButton>
            <YqButton variant="secondary" size="xs" @click="showFab = !showFab">
              {{ showFab ? "收起悬浮按钮" : "看悬浮按钮" }}
            </YqButton>
            <YqButton variant="danger" size="xs" @click="sheetOpen = true">弹出确认卡</YqButton>
          </view>
        </view>

        <view class="section">
          <text class="section__title">空状态</text>
          <YqEmptyState
            variant="dashed"
            title="还想约别的圈子？"
            desc="建个新群，或让朋友发邀请把你拉进去"
          />
          <YqEmptyState title="这周还没人约，你来当局长？">
            <YqButton variant="primary" size="sm">发起计划</YqButton>
          </YqEmptyState>
        </view>

        <view class="section">
          <text class="section__title">表单和设置行</text>
          <YqInput v-model="nickname" type="nickname" :maxlength="12" counter display />
          <YqTabs
            v-model="tab"
            :items="[
              { key: 'plans', label: '计划', count: 3 },
              { key: 'board', label: '鸽榜' },
              { key: 'members', label: '成员', count: 8 },
            ]"
          />
          <view class="row row--wrap">
            <YqCodeBoxes v-model="code" />
          </view>
          <view class="row row--wrap">
            <YqCodeBoxes v-model="typedCode" editable />
          </view>
          <YqListGroup label="成员与邀请">
            <YqListRow label="加入需群主同意" sub="关闭时，拿到邀请就能直接加入" size="lg">
              <template #right><YqSwitch v-model="switchOff" /></template>
            </YqListRow>
            <YqListRow label="群名" value="大学室友" display-value arrow />
            <YqListRow
              label="解散群组"
              value="计划和鸽王记录会一起删除"
              danger
              arrow
              :divider="false"
            />
          </YqListGroup>
          <YqListGroup label="鸽子王" tone="king">
            <YqListRow
              label="鸽子王评选"
              :sub="`${revealRuleText()}；关掉后不评选，也不显示鸽榜`"
              size="xl"
              strong
            >
              <template #left><YqIllustration name="gg" :width="34" /></template>
              <template #right><YqSwitch v-model="switchOn" /></template>
            </YqListRow>
            <YqListRow label="鸽王任务卡" size="auto" arrow :divider="false" />
          </YqListGroup>
        </view>
      </view>
    </view>

    <YqConfirmSheet
      :visible="sheetOpen"
      title="确定退出「大学室友」？"
      subtitle="退出后看不到群里的计划，想回来要重新拿邀请"
      confirm-text="退出群组"
      confirm-variant="danger"
      footnote="群主退群前要先把群主转给别人"
      @cancel="sheetOpen = false"
      @confirm="sheetOpen = false"
    />
    <YqTabBar v-if="showTabBar" :current="currentTab" @change="currentTab = $event" />
    <YqFab v-if="showFab" text="在本群发起" />
  </YqPage>
</template>

<style scoped>
.board {
  box-sizing: border-box;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.board__head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.board__brand {
  display: flex;
  align-items: center;
  gap: 14px;
}

.board__brand-text {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.board__logo {
  font-family: var(--yq-font-logo);
  font-size: 46px;
  line-height: 1;
}

.board__slogan {
  font-size: 15px;
  color: var(--yq-color-text-secondary);
}

.board__theme {
  display: flex;
  align-items: center;
  gap: 14px;
}

.board__theme-note {
  font-size: 13px;
  color: var(--yq-color-text-secondary);
}

.board__theme-pill {
  padding: 8px 18px;
  background: var(--yq-chip-king-bg);
  border: var(--yq-border-card);
  border-radius: 999px;
  box-shadow: var(--yq-shadow-king-md);
  font-family: var(--yq-font-display);
  font-weight: var(--yq-font-display-weight);
  font-size: var(--yq-size-display-20);
}

.board__grid {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.board__col {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.section {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 18px 20px;
  background: var(--yq-color-surface);
  border: var(--yq-border-strong);
  border-radius: var(--yq-radius-3xl);
  box-shadow: var(--yq-shadow-surface-xl);
}

.section--king {
  gap: 14px;
}

.section__head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.section__title {
  font-family: var(--yq-font-display);
  font-weight: var(--yq-font-display-weight);
  font-size: var(--yq-size-display-22);
}

.section__note {
  font-size: 12.5px;
  color: var(--yq-color-text-secondary);
}

.section__sub {
  font-size: 15px;
  font-weight: var(--yq-font-weight-900);
}

.row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.row--wrap {
  flex-wrap: wrap;
  gap: 8px;
}

/* ---------- 色彩 ---------- */
.swatches {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.swatch {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.swatch__chip {
  box-sizing: border-box;
  height: 44px;
  border: var(--yq-border-card);
  border-radius: var(--yq-radius-md);
}

.swatch__chip--split {
  display: flex;
  overflow: hidden;
}

.swatch__half {
  flex: 1;
}

.swatch__name {
  font-size: 13px;
  font-weight: var(--yq-font-weight-700);
}

.swatch__use {
  font-size: 11.5px;
  color: var(--yq-color-text-secondary);
}

/* ---------- 字体 ---------- */
.font-sample {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.font-sample__display {
  font-family: var(--yq-font-display);
  font-weight: var(--yq-font-display-weight);
  font-size: var(--yq-size-display-34);
  line-height: 1.15;
}

.font-sample__body {
  font-size: 17px;
  font-weight: var(--yq-font-weight-900);
}

.font-sample__note {
  font-size: 12.5px;
  color: var(--yq-color-text-secondary);
}

/* ---------- 鸽子王头像 ---------- */
.king-cards {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.king-card {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px;
  background: var(--yq-color-surface-inset);
  border: var(--yq-border-card);
  border-radius: var(--yq-radius-2xl);
}

.king-card--chosen {
  align-items: center;
  gap: 8px;
  border: var(--yq-border-strong);
  box-shadow: var(--yq-shadow-selected);
}

.king-card__tag {
  align-self: flex-start;
  padding: 3px 10px;
  background: var(--yq-button-secondary-bg);
  border: var(--yq-border-chip);
  border-radius: 999px;
  font-size: 12.5px;
  font-weight: var(--yq-font-weight-900);
}

.king-card__name {
  font-family: var(--yq-font-display);
  font-weight: var(--yq-font-display-weight);
  font-size: var(--yq-size-display-22);
  line-height: 1;
}

.king-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: var(--yq-band-king);
  border: var(--yq-border-card);
  border-radius: var(--yq-radius-xl);
  box-shadow: var(--yq-shadow-king-md);
}

.king-banner__text {
  display: flex;
  flex-direction: column;
}

.king-banner__label {
  font-size: 11.5px;
  font-weight: var(--yq-font-weight-900);
}

.king-banner__name {
  font-family: var(--yq-font-display);
  font-weight: var(--yq-font-display-weight);
  font-size: var(--yq-size-display-20);
}

.king-wall {
  display: flex;
  align-items: center;
  gap: 12px;
}

.king-wall__text {
  font-size: 12.5px;
  font-weight: var(--yq-font-weight-900);
}

.avatar-states {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 8px;
}

.avatar-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.avatar-state__label {
  font-size: 12.5px;
  font-weight: var(--yq-font-weight-700);
}

.king-bottom {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.king-bottom__col {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.sizes {
  display: flex;
  align-items: flex-end;
  gap: 16px;
}

.sizes__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.sizes__label {
  font-size: 11.5px;
  color: var(--yq-color-text-secondary);
}

/* ---------- 下半部分 ---------- */
.more {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-bottom: 120px;
}

.group-card {
  display: flex;
  align-items: center;
  gap: 12px;
}

.group-card__text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.group-card__name {
  font-family: var(--yq-font-display);
  font-weight: var(--yq-font-display-weight);
  font-size: var(--yq-size-display-21);
  line-height: 1.15;
}

.group-card__meta {
  font-size: 12px;
  color: var(--yq-color-text-secondary);
}

.band__text {
  flex: 1;
}

.band__side {
  font-size: 12px;
}

.nav-sample {
  border: var(--yq-border-dashed-thin);
  border-radius: var(--yq-radius-md);
  overflow: hidden;
}

/* 宽屏（H5 预览按 1240 宽截 Main）：两栏，和风格说明板一样 */
@media (min-width: 900px) {
  .board {
    padding: 32px 40px;
  }

  .board__grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    align-items: start;
  }
}
</style>

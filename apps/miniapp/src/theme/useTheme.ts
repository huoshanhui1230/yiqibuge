import { DEFAULT_THEME, isThemeName, type ThemeName } from "@yiqi/shared";
import { computed, readonly, ref } from "vue";

import { THEME_RUNTIME } from "./theme-meta.generated";

/**
 * 主题 store：当前主题 + 本地缓存 + 存到用户设置（阶段 1 方案「主题系统」）。
 * 不引 pinia（它要 Vue 3.5，uni-app 锁在 3.4，docs/progress.md 待确认 3），一个模块级 ref 就够。
 *
 * - 启动时同步读本地缓存，没有就用贴纸风，页面第一帧就是对的主题，不会闪。
 * - 切换后写缓存；登录了就再存到服务端（PUT /me/settings），失败不回滚，下次再存。
 * - 登录拿到用户资料后以服务端为准（hydrate），换手机也能带着自己的主题。
 */
export const THEME_STORAGE_KEY = "yq.theme";

function readCached(): ThemeName {
  try {
    const saved = uni.getStorageSync(THEME_STORAGE_KEY) as unknown;
    return isThemeName(saved) ? saved : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

const current = ref<ThemeName>(readCached());

/** 存到服务端的函数，登录模块注册进来；主题模块不直接依赖请求层 */
let saveRemote: ((theme: ThemeName) => Promise<unknown>) | null = null;

export function setThemeSaver(saver: ((theme: ThemeName) => Promise<unknown>) | null): void {
  saveRemote = saver;
}

/** 下拉回弹时露出来的窗口底色也跟着主题走（只有小程序有这个接口） */
export function paintWindow(theme: ThemeName): void {
  // #ifdef MP-WEIXIN
  const color = THEME_RUNTIME[theme].bg;
  uni.setBackgroundColor?.({
    backgroundColor: color,
    backgroundColorTop: color,
    backgroundColorBottom: color,
  });
  // #endif
}

function remember(theme: ThemeName): void {
  current.value = theme;

  try {
    uni.setStorageSync(THEME_STORAGE_KEY, theme);
  } catch {
    // 缓存写不进去也不影响这次显示
  }

  paintWindow(theme);
}

/** 用户主动换主题：本地马上生效，登录了就存到用户设置 */
export async function setTheme(theme: ThemeName): Promise<void> {
  remember(theme);

  if (saveRemote) {
    await saveRemote(theme);
  }
}

/** 登录后用服务端存的主题覆盖本地（不再回存） */
export function hydrateTheme(theme: ThemeName): void {
  if (theme !== current.value) {
    remember(theme);
  }
}

/**
 * 动效开关（.claude/rules/miniapp.md：动效都要能被「设置 › 动效开关」关掉）。
 * 设置页在阶段 4 做，这里先把开关留好：关掉时 YqPage 加 yq-motion-off，所有 .yq-anim 的动画停掉。
 */
const motionOff = ref(false);

export function setMotionOff(off: boolean): void {
  motionOff.value = off;
}

export function useTheme() {
  return {
    theme: readonly(current),
    themeClass: computed(() => `yq-theme-${current.value}`),
    motionOff: readonly(motionOff),
    setTheme,
  };
}

// 截图脚本（tools/shots）在 H5 预览里直接切主题用，不走服务端
// #ifdef H5
if (import.meta.env.DEV && typeof window !== "undefined") {
  (window as unknown as { __yqSetTheme?: (theme: ThemeName) => void }).__yqSetTheme = remember;
}
// #endif

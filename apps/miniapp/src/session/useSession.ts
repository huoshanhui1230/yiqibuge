import { deviceTimeZone, type MeDto } from "@yiqi/shared";
import { readonly, ref } from "vue";

import { api, setNotLoggedInHandler } from "../request";
import { hydrateTheme, setThemeSaver } from "../theme/useTheme";

/**
 * 登录态（docs/decisions.md 第 22 条）：身份是云托管注入的 openid，后端不发 token，
 * 小程序这边只记「我是谁」。第一次调 POST /auth/wechat 时后端建用户，之后每次启动调一次拿最新资料。
 *
 * - 加入落地页不主动登录：点「加入群组」时才调，减少流失（docs/spec.md「邀请与加入」）。
 * - 别的接口回 NOT_LOGGED_IN 时，请求层会先调这里的 ensureLogin 再重试一次。
 */
const user = ref<MeDto | null>(null);
let inflight: Promise<MeDto> | null = null;

/** 登录后用服务端的资料；主题以服务端为准 */
export function setUser(me: MeDto): void {
  user.value = me;
  hydrateTheme(me.theme);
}

/** 确保已经登录（同时只发一次请求），返回我的资料 */
export function ensureLogin(): Promise<MeDto> {
  if (user.value) {
    return Promise.resolve(user.value);
  }

  inflight ??= api
    .login({ timezone: deviceTimeZone() })
    .then(({ user: me }) => {
      setUser(me);
      return me;
    })
    .finally(() => {
      inflight = null;
    });

  return inflight;
}

export function useSession() {
  return { user: readonly(user), ensureLogin, setUser };
}

// 请求层收到 NOT_LOGGED_IN：清掉旧的、重新登录（会建用户），请求层再重发原请求
setNotLoggedInHandler(async () => {
  user.value = null;
  await ensureLogin();
});

// 换主题时，登录了就存到用户设置（PUT /me/settings）；没登录只存本地
setThemeSaver((theme) =>
  user.value ? api.updateSettings({ theme }).then(setUser) : Promise.resolve(),
);

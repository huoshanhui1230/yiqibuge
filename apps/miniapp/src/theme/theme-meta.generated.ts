// 由 docs/design/tokens.json 生成，不要手改。重新生成：pnpm -F @yiqi/miniapp gen:theme
// JS 读不到 CSS 变量，这里放 JS 要用的几个值（尺寸是设计稿 px）。
import type { ThemeName } from "@yiqi/shared";

export interface ThemeRuntimeMeta {
  bg: string;
  avatarRingRatio: number;
  tabbar: { floating: boolean; height: number; inset: number; paddingBottom: number };
}

export const THEME_RUNTIME: Record<ThemeName, ThemeRuntimeMeta> = {
  "sticker": {
    "bg": "#FFF4DF",
    "avatarRingRatio": 0.058,
    "tabbar": {
      "floating": false,
      "height": 84,
      "inset": 0,
      "paddingBottom": 22
    }
  },
  "cute": {
    "bg": "#FFF1F3",
    "avatarRingRatio": 0.058,
    "tabbar": {
      "floating": true,
      "height": 62,
      "inset": 12,
      "paddingBottom": 0
    }
  },
  "clean": {
    "bg": "#F6F5F2",
    "avatarRingRatio": 0.044,
    "tabbar": {
      "floating": false,
      "height": 78,
      "inset": 0,
      "paddingBottom": 20
    }
  }
};

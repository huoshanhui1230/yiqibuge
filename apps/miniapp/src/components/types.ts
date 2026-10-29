import type { CircleAvatarPreset } from "@yiqi/shared";

import type { IllustrationName } from "../theme/illustrations.generated";

/** 单色线性图标，定义在 scripts/icons.ts，变量在 styles/icons.css */
export type IconName =
  | "back"
  | "plus"
  | "key"
  | "ban"
  | "lock"
  | "camera"
  | "check"
  | "chevron"
  | "close"
  | "miniprogram"
  | "nav-home"
  | "nav-calendar"
  | "nav-groups"
  | "nav-me";

/** 插画：从设计稿 symbol 抽出来的，加上 gen-icons.ts 画的群头像图标、白鸽和披风 */
export type ArtName = IllustrationName | "cape" | "dove" | `tile-${CircleAvatarPreset}`;

export type ButtonVariant = "primary" | "secondary" | "danger" | "king";
export type ButtonSize = "xl" | "lg" | "md" | "sm" | "xs" | "mini";

export type ChipTone =
  "progress" | "recruiting" | "formed" | "king" | "cancelled" | "flaked" | "lavender" | "dark";

/** 鸽子王头像：本周、连任（加墨镜）、月度（加披风和大皇冠） */
export type KingKind = "week" | "streak" | "month";

/** 头像状态：普通、跟了（右下角红勾）、鸽了（变灰、虚线圈、飞走的鸽子） */
export type AvatarState = "normal" | "in" | "flaked";

export type TabKey = "home" | "calendar" | "groups" | "me";

/** 给头像用的人：名字已经按规则选好（群昵称 > 昵称 > 微信用户） */
export interface AvatarPerson {
  id: string;
  name: string;
  avatarUrl?: string | null;
  king?: KingKind | null;
}

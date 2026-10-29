import type { CircleType } from "./types";

/**
 * 群头像：预设插画或上传的图片（docs/spec.md「创建群组」）。
 * 库里存一个字符串：预设写成 `preset:<key>`，图片存地址（cloud:// 文件 ID，本地联调是本机地址）。
 *
 * 预设的图标和底色取自设计稿：Groups 里的校舍、家、羽毛球、公文包，JoinLanding 里的火锅、话筒。
 */
export const CIRCLE_AVATAR_PRESETS = ["dorm", "family", "sport", "work", "food", "music"] as const;

export type CircleAvatarPreset = (typeof CIRCLE_AVATAR_PRESETS)[number];

/** 图标块的底色，对应主题变量 --yq-tile-<tint> */
export type CircleAvatarTint = "green" | "peach" | "blue" | "lavender";

export const CIRCLE_AVATAR_TINT: Record<CircleAvatarPreset, CircleAvatarTint> = {
  dorm: "green",
  family: "peach",
  sport: "blue",
  work: "lavender",
  food: "peach",
  music: "lavender",
};

/** 建群时没选头像，就按群类型给一个 */
export const DEFAULT_PRESET_BY_TYPE: Record<CircleType, CircleAvatarPreset> = {
  classmates: "dorm",
  family: "family",
  colleagues: "work",
  friends: "food",
  other: "sport",
};

export type CircleAvatar =
  { kind: "preset"; preset: CircleAvatarPreset } | { kind: "image"; url: string };

const PRESET_PREFIX = "preset:";

export function presetAvatar(preset: CircleAvatarPreset): string {
  return `${PRESET_PREFIX}${preset}`;
}

function isPreset(value: string): value is CircleAvatarPreset {
  return (CIRCLE_AVATAR_PRESETS as readonly string[]).includes(value);
}

/** 解析库里存的字符串；认不出来的预设退回校舍，免得页面上空一块 */
export function parseCircleAvatar(stored: string): CircleAvatar {
  if (stored.startsWith(PRESET_PREFIX)) {
    const key = stored.slice(PRESET_PREFIX.length);
    return { kind: "preset", preset: isPreset(key) ? key : "dorm" };
  }

  return { kind: "image", url: stored };
}

export function isPresetAvatarString(stored: string): boolean {
  return stored.startsWith(PRESET_PREFIX) && isPreset(stored.slice(PRESET_PREFIX.length));
}

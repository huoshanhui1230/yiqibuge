import type { ThemeName } from "../theme";

/** 显示一个人要用的最少信息：名字（已经按规则选好）、头像、id（定字母头像底色） */
export interface UserBrief {
  id: string;
  name: string;
  avatarUrl: string | null;
}

/** 我自己的资料和设置 */
export interface MeDto {
  id: string;
  nickname: string | null;
  avatarUrl: string | null;
  theme: ThemeName;
  timezone: string | null;
  /** 填过昵称才算填好资料；没填时从正常入口进来会先去登录页 */
  profileCompleted: boolean;
}

/** POST /auth/wechat 的返回 */
export interface AuthResult {
  user: MeDto;
  /** 这次请求刚建的用户 */
  isNew: boolean;
}

export interface AuthBody {
  /** 手机当前的时区，存下来以后显示「你的当地时间」用 */
  timezone?: string;
}

export interface UpdateProfileBody {
  nickname: string;
  /** 不传表示不改头像，传 null 表示清掉 */
  avatarUrl?: string | null;
}

export interface UpdateSettingsBody {
  theme?: ThemeName;
}

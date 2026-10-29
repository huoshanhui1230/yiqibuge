import { THEMES, type ThemeName } from "@yiqi/shared";
import { IsIn, IsOptional, IsString, MaxLength, ValidateIf } from "class-validator";

/** POST /auth/wechat */
export class AuthBodyDto {
  @IsOptional()
  @IsString({ message: "时区要是文字。" })
  @MaxLength(64, { message: "时区不对。" })
  timezone?: string;
}

/** PUT /me/profile：昵称的长度和内容在 UsersService 里按共享规则查 */
export class UpdateProfileDto {
  @IsString({ message: "昵称要是文字。" })
  @MaxLength(64, { message: "昵称最多 12 个字" })
  nickname!: string;

  /** 不传表示不改头像，传 null 表示清掉 */
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString({ message: "头像地址不对。" })
  @MaxLength(512, { message: "头像地址不对。" })
  avatarUrl?: string | null;
}

/** PUT /me/settings：本阶段只有主题 */
export class UpdateSettingsDto {
  @IsOptional()
  @IsIn(THEMES, { message: "没有这套主题。" })
  theme?: ThemeName;
}

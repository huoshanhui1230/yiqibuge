import { CIRCLE_TYPES, type CircleType } from "@yiqi/shared";
import { IsBoolean, IsIn, IsOptional, IsString, MaxLength, ValidateIf } from "class-validator";

/**
 * 入参只在这里查类型和明显的长度上限；
 * 群名几个字、时区认不认、头像地址合不合规，在 service 里按共享规则（packages/shared）查，提示语统一。
 */
export class CreateCircleDto {
  @IsString({ message: "群名要是文字。" })
  @MaxLength(64, { message: "群名最多 12 个字" })
  name!: string;

  @IsIn(CIRCLE_TYPES, { message: "群类型不对。" })
  type!: CircleType;

  @IsString({ message: "群头像不对。" })
  @MaxLength(512, { message: "群头像不对。" })
  avatar!: string;

  @IsString({ message: "时区不对。" })
  @MaxLength(64, { message: "时区不对。" })
  timezone!: string;
}

/** PUT /circles/:id：只传要改的字段（小程序发不了 PATCH） */
export class UpdateCircleDto {
  @IsOptional()
  @IsString({ message: "群名要是文字。" })
  @MaxLength(64, { message: "群名最多 12 个字" })
  name?: string;

  @IsOptional()
  @IsIn(CIRCLE_TYPES, { message: "群类型不对。" })
  type?: CircleType;

  @IsOptional()
  @IsString({ message: "群头像不对。" })
  @MaxLength(512, { message: "群头像不对。" })
  avatar?: string;

  @IsOptional()
  @IsString({ message: "时区不对。" })
  @MaxLength(64, { message: "时区不对。" })
  timezone?: string;

  @IsOptional()
  @IsBoolean({ message: "开关只能是开或关。" })
  needApproval?: boolean;

  @IsOptional()
  @IsBoolean({ message: "开关只能是开或关。" })
  inviteOwnerOnly?: boolean;

  @IsOptional()
  @IsBoolean({ message: "开关只能是开或关。" })
  pigeonEnabled?: boolean;

  /** 空字符串或 null 表示清掉任务卡 */
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString({ message: "任务卡要是文字。" })
  @MaxLength(120, { message: "鸽王任务卡最多 30 个字" })
  penaltyText?: string | null;
}

export class UpdateGroupNicknameDto {
  @ValidateIf((_, value) => value !== null)
  @IsString({ message: "群昵称要是文字。" })
  @MaxLength(64, { message: "群昵称最多 12 个字" })
  groupNickname!: string | null;
}

export class TransferDto {
  @IsString({ message: "要转给谁没说清楚。" })
  @MaxLength(20, { message: "要转给谁没说清楚。" })
  toUserId!: string;
}

/** POST /circles/join：卡片和海报带 t，邀请码带 code，二选一 */
export class JoinDto {
  @IsOptional()
  @IsString({ message: "邀请不对。" })
  @MaxLength(64, { message: "邀请不对。" })
  t?: string;

  @IsOptional()
  @IsString({ message: "邀请码不对。" })
  @MaxLength(32, { message: "邀请码不对。" })
  code?: string;
}

/** GET /invites/preview */
export class PreviewQueryDto extends JoinDto {
  /** 谁发的邀请（分享卡片的路径里带着），落地页显示「阿杰邀请你加入」 */
  @IsOptional()
  @IsString()
  @MaxLength(20)
  from?: string;
}

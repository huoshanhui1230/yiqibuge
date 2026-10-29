import type { CircleRole, CircleType } from "../circle/types";
import type { UserBrief } from "./user";

/**
 * 本周鸽子王（阶段 3 每周结算后才有）。
 * 并列当选时 users 不止一人（docs/decisions.md 第 5 条）。
 */
export interface CircleKingDto {
  users: UserBrief[];
  points: number;
  /** 连续当选几周；2 周及以上显示「连任 N 周」，头像加墨镜 */
  streakWeeks: number;
}

/** 群组列表里的一张卡片 */
export interface CircleSummaryDto {
  id: string;
  name: string;
  /** `preset:<key>` 或图片地址，见 circle/avatar.ts */
  avatar: string;
  type: CircleType;
  memberCount: number;
  myRole: CircleRole;
  owner: UserBrief;
  pigeonEnabled: boolean;
  /** 「进行中 N」：阶段 2 有了计划才有值，现在恒为 0 */
  activePlanCount: number;
  /** 阶段 3 结算后才有，现在恒为 null */
  king: CircleKingDto | null;
  /** 连续和平周数，阶段 3 才有，现在恒为 0 */
  peaceStreak: number;
}

/** 群组主页和群设置用 */
export interface CircleDetailDto extends CircleSummaryDto {
  timezone: string;
  needApproval: boolean;
  inviteOwnerOnly: boolean;
  /** 鸽王任务卡 */
  penaltyText: string | null;
  /** 我能不能邀请人（开了「仅群主可邀请」时只有群主能） */
  canInvite: boolean;
  /** 待审核的入群申请数，只有群主看得到，其他人恒为 0 */
  pendingCount: number;
  /** 计划 tab 上的数字，阶段 2 才有，现在恒为 0 */
  planCount: number;
  /** 我在本群的群昵称 */
  myGroupNickname: string | null;
}

export interface MemberDto {
  /** name 已经按「群昵称 > 昵称 > 微信用户」选好 */
  user: UserBrief;
  role: CircleRole;
  /** ISO 8601 UTC */
  joinedAt: string;
  isMe: boolean;
}

export interface JoinRequestDto {
  user: UserBrief;
  requestedAt: string;
}

export interface MembersResult {
  members: MemberDto[];
  /** 待审核的入群申请，只有群主拿得到，其他人恒为空 */
  pending: JoinRequestDto[];
}

export interface CreateCircleBody {
  name: string;
  type: CircleType;
  avatar: string;
  timezone: string;
}

/** PUT /circles/:id 只传要改的字段（小程序发不了 PATCH，docs/progress.md 待确认 1） */
export interface UpdateCircleBody {
  name?: string;
  type?: CircleType;
  avatar?: string;
  timezone?: string;
  needApproval?: boolean;
  inviteOwnerOnly?: boolean;
  pigeonEnabled?: boolean;
  /** 传空字符串或 null 表示清掉任务卡 */
  penaltyText?: string | null;
}

export interface UpdateGroupNicknameBody {
  /** 传空字符串或 null 表示不用群昵称 */
  groupNickname: string | null;
}

export interface TransferBody {
  toUserId: string;
}

/** 退群会影响到的计划（阶段 2 才有内容，现在恒为空） */
export interface LeavePlanBrief {
  id: string;
  title: string;
  startAt: string;
}

export interface LeavePreviewDto {
  /** 不能退的原因；能退就是 null */
  blocker: "OWNER_MUST_TRANSFER" | "OWNER_ALONE" | null;
  /** 会按「鸽了」处理的计划 */
  flakePlans: LeavePlanBrief[];
  /** 会悄悄退出的计划 */
  exitPlans: LeavePlanBrief[];
}

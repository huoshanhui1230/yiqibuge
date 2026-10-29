import type { CircleType } from "../circle/types";
import type { CircleKingDto } from "./circle";
import type { UserBrief } from "./user";

/** POST /circles/:id/invites 的返回：三种邀请共用一个有效期 */
export interface InviteDto {
  token: string;
  /** 6 位邀请码 */
  code: string;
  /** ISO 8601 UTC */
  expireAt: string;
  /** 分享卡片的标题，例如「阿杰邀请你加入「大学室友」」 */
  shareTitle: string;
  /** 分享卡片点开去的页面 */
  sharePath: string;
}

/**
 * 落地页的状态：
 * ok 可以加入；invalid 邀请不存在；expired 过期；full 满了；
 * member 已经在群里；pending 已经申请、等群主同意；dissolved 群已解散
 */
export type InvitePreviewStatus =
  "ok" | "invalid" | "expired" | "full" | "member" | "pending" | "dissolved";

/** 非成员能看到的群信息（docs/spec.md「邀请与加入」：群名、头像、最多 8 个成员头像和总人数） */
export interface InviteCirclePreview {
  id: string;
  name: string;
  avatar: string;
  type: CircleType;
  memberCount: number;
  /** 最多 8 个 */
  members: UserBrief[];
  king: CircleKingDto | null;
  needApproval: boolean;
}

/** 阶段 2 有了计划才有内容，现在恒为空 */
export interface UpcomingPlanBrief {
  id: string;
  title: string;
  type: string;
  startAt: string;
  joinedCount: number;
  isKingPlan: boolean;
}

export interface InvitePreviewDto {
  status: InvitePreviewStatus;
  /** 邀请不存在（invalid）时为 null */
  circle: InviteCirclePreview | null;
  /** 谁发的邀请；从邀请码进来不知道是谁，就是群主 */
  inviter: UserBrief | null;
  /** 阶段 2 有了计划才有值，现在都是 0 */
  stats: {
    plansThisMonth: number;
    formedThisMonth: number;
    longestPeaceStreak: number;
  };
  upcomingPlans: UpcomingPlanBrief[];
}

export interface JoinBody {
  /** 卡片和海报里带的 token */
  t?: string;
  /** 6 位邀请码 */
  code?: string;
}

export interface JoinResult {
  /** joined 已加入；pending 等群主同意；already 本来就在群里 */
  status: "joined" | "pending" | "already";
  circleId: string;
}

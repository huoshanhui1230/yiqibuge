import { textLength, trimText } from "../text";
import type { CircleRole, MemberStatus } from "./types";

/** 群人数上限（docs/decisions.md 第 6 条） */
export const MAX_MEMBERS = 100;

/** 群名最多 12 个字（docs/spec.md「创建群组」） */
export const CIRCLE_NAME_MAX = 12;
/** 昵称最多 12 个字（设计稿 Login 的计数「2/12」） */
export const NICKNAME_MAX = 12;
export const GROUP_NICKNAME_MAX = 12;
/** 鸽王任务卡：设计稿里的例子是 17 个字，留点余量 */
export const PENALTY_TEXT_MAX = 30;

/** 没填昵称的人（从落地页直接加入的）显示成这样，docs/decisions.md 第 26 条 */
export const FALLBACK_NICKNAME = "微信用户";
export const DELETED_USER_NAME = "已注销用户";

function checkRequiredText(text: string, label: string, max: number): string | null {
  const value = trimText(text);

  if (value.length === 0) {
    return `${label}不能为空`;
  }
  if (textLength(value) > max) {
    return `${label}最多 ${max} 个字`;
  }

  return null;
}

/** 校验群名，有问题返回中文提示，没问题返回 null */
export function checkCircleName(name: string): string | null {
  return checkRequiredText(name, "群名", CIRCLE_NAME_MAX);
}

export function checkNickname(nickname: string): string | null {
  return checkRequiredText(nickname, "昵称", NICKNAME_MAX);
}

/** 群昵称和任务卡可以留空（留空就是不设） */
export function checkOptionalText(text: string, label: string, max: number): string | null {
  return textLength(trimText(text)) > max ? `${label}最多 ${max} 个字` : null;
}

// ---------- 退群、移除、转让、解散 ----------

/**
 * 群主不能直接退群（docs/spec.md「退出、移除与解散」）：
 * 群里还有别人 → 先转让群主；只剩自己 → 只能解散。
 */
export type LeaveBlocker = "OWNER_MUST_TRANSFER" | "OWNER_ALONE";

export function leaveBlocker(input: {
  role: CircleRole;
  activeMemberCount: number;
}): LeaveBlocker | null {
  if (input.role !== "owner") {
    return null;
  }

  return input.activeMemberCount > 1 ? "OWNER_MUST_TRANSFER" : "OWNER_ALONE";
}

export type MemberActionBlocker = "NOT_OWNER" | "TARGET_IS_SELF" | "TARGET_NOT_MEMBER";

interface MemberActionInput {
  actorRole: CircleRole;
  actorId: string;
  targetId: string;
  /** 对方在群里的状态；根本不在群里就传 null */
  targetStatus: MemberStatus | null;
}

function memberActionBlocker(input: MemberActionInput): MemberActionBlocker | null {
  if (input.actorRole !== "owner") {
    return "NOT_OWNER";
  }
  if (input.actorId === input.targetId) {
    return "TARGET_IS_SELF";
  }
  if (input.targetStatus !== "active") {
    return "TARGET_NOT_MEMBER";
  }

  return null;
}

/** 只有群主能移人，不能移自己，只能移在群里的人 */
export function removeBlocker(input: MemberActionInput): MemberActionBlocker | null {
  return memberActionBlocker(input);
}

/** 只有群主能转让，不能转给自己，只能转给在群里的人 */
export function transferBlocker(input: MemberActionInput): MemberActionBlocker | null {
  return memberActionBlocker(input);
}

export function dissolveBlocker(input: { actorRole: CircleRole }): "NOT_OWNER" | null {
  return input.actorRole === "owner" ? null : "NOT_OWNER";
}

// ---------- 退群时计划怎么处理 ----------

/** 表态状态（docs/spec.md「成员表态状态」），阶段 2 实现状态机时沿用 */
export type ResponseStatus = "pending" | "in" | "out" | "flaked" | "waitlist" | "reconfirm";

export type ExitReason = "leave" | "removed";

/**
 * flake = 按「鸽了」处理并通知全群
 * exit  = 悄悄退出这个计划，不计鸽
 * keep  = 不动（计划已经开始，所有状态冻结）
 */
export type PlanExitOutcome = "flake" | "exit" | "keep";

/** 主动退群时，这么多小时内开始、已经跟了的计划按鸽了算 */
export const LEAVE_FLAKE_WINDOW_HOURS = 24;

/**
 * 退群或被移出时，这个人在某个计划上的表态怎么处理（docs/spec.md「退出、移除与解散」
 * 和「业务规则与边界情况」）：
 * - 计划已经开始：冻结，不动；
 * - 主动退群、已经跟了、离开始不到（含）24 小时：按鸽了处理，防止退群逃鸽；
 * - 其余情况（被移出、候补、待确认、没表态、不跟、已经鸽过）：悄悄退出，不计鸽。
 *
 * 发起人自己的计划不走这里：发起人不能鸽自己的计划，退群时怎么处理留到阶段 2 定。
 * 所有时间以服务器时间为准。
 */
export function planExitOutcome(input: {
  reason: ExitReason;
  status: ResponseStatus;
  startAt: Date | string;
  now: Date;
}): PlanExitOutcome {
  const msToStart = new Date(input.startAt).getTime() - input.now.getTime();

  if (msToStart <= 0) {
    return "keep";
  }

  const withinWindow = msToStart <= LEAVE_FLAKE_WINDOW_HOURS * 60 * 60 * 1000;

  if (input.reason === "leave" && input.status === "in" && withinWindow) {
    return "flake";
  }

  return "exit";
}

// ---------- 名字怎么显示 ----------

/**
 * 群里显示的名字：群昵称 > 微信昵称 > 「微信用户」。
 * 退群和被移出的人在历史记录里显示「某某（已退群）」，注销的显示「已注销用户」。
 */
export function memberDisplayName(input: {
  nickname: string | null;
  groupNickname?: string | null;
  status?: MemberStatus;
  deleted?: boolean;
}): string {
  if (input.deleted) {
    return DELETED_USER_NAME;
  }

  const groupNickname = trimText(input.groupNickname ?? "");
  const nickname = trimText(input.nickname ?? "");
  const base = groupNickname || nickname || FALLBACK_NICKNAME;

  return input.status === "left" || input.status === "removed" ? `${base}（已退群）` : base;
}

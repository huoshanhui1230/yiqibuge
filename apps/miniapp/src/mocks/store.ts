import {
  APP_NAME,
  DEFAULT_THEME,
  inviteExpireAt,
  leaveBlocker,
  memberDisplayName,
  type CircleDetailDto,
  type CircleKingDto,
  type CircleSummaryDto,
  type CircleType,
  type HealthResult,
  type InviteDto,
  type InvitePreviewDto,
  type MeDto,
  type MembersResult,
  type ThemeName,
  type UserBrief,
} from "@yiqi/shared";

import { ApiRequestError } from "../request/types";
import { PEOPLE } from "./people";

/**
 * H5 预览的假数据：一份内存里的「数据库」，内容照设计稿（阿杰的大学室友、家人群、羽毛球搭子、同事群）。
 * 只在 H5 预览里用（请求层 mock 档），截图对照设计稿、在浏览器里点点看流程。刷新页面就回到初始状态。
 *
 * 后端还如实返回空值的字段（鸽子王、和平周、「进行中 N」、落地页统计），这里按设计稿给值，
 * 好让走查时看得到这些区块。
 */

interface MockUser {
  id: string;
  nickname: string | null;
  avatarUrl: string | null;
}

interface MockCircle {
  id: string;
  name: string;
  avatar: string;
  type: CircleType;
  ownerId: string;
  timezone: string;
  needApproval: boolean;
  inviteOwnerOnly: boolean;
  pigeonEnabled: boolean;
  penaltyText: string | null;
  /** 在群里的人，群主在第一个 */
  memberIds: string[];
  /** 设计稿上人数比列出来的多（12 人、20 人），多出来的只算人数 */
  extraCount: number;
  pendingIds: string[];
  groupNicknames: Record<string, string>;
  activePlanCount: number;
  planCount: number;
  king: { userId: string; points: number; streakWeeks: number } | null;
  peaceStreak: number;
  stats: InvitePreviewDto["stats"];
  invite: { token: string; code: string; expireAt: string };
  dissolved: boolean;
}

function err(code: string, message: string, status: number): ApiRequestError {
  return new ApiRequestError(code, message, status);
}

const people = Object.values(PEOPLE);
const users = new Map<string, MockUser>(
  people.map((person) => [person.id, { id: person.id, nickname: person.name, avatarUrl: null }]),
);
users.set("u-new-1", { id: "u-new-1", nickname: "新朋友", avatarUrl: null });

/** H5 预览里的「我」是阿杰（设计稿 Groups「你是群主」、GroupHome「群主 阿杰」） */
const ME_ID = PEOPLE.jie.id;
let myTheme: ThemeName = DEFAULT_THEME;

function invite(token: string, code: string): MockCircle["invite"] {
  return { token, code, expireAt: inviteExpireAt(new Date()).toISOString() };
}

const circles: MockCircle[] = [
  {
    id: "c-dorm",
    name: "大学室友",
    avatar: "preset:dorm",
    type: "classmates",
    ownerId: PEOPLE.jie.id,
    timezone: "Asia/Shanghai",
    needApproval: false,
    inviteOwnerOnly: false,
    pigeonEnabled: true,
    penaltyText: "下次局负责订位，提前 1 天发到群里",
    memberIds: [
      PEOPLE.jie.id,
      PEOPLE.chen.id,
      PEOPLE.zhuang.id,
      PEOPLE.li.id,
      PEOPLE.mei.id,
      PEOPLE.wang.id,
      PEOPLE.lin.id,
      PEOPLE.zhou.id,
    ],
    extraCount: 0,
    pendingIds: [],
    groupNicknames: {},
    activePlanCount: 2,
    planCount: 3,
    king: { userId: PEOPLE.wang.id, points: 7, streakWeeks: 1 },
    peaceStreak: 0,
    stats: { plansThisMonth: 6, formedThisMonth: 5, longestPeaceStreak: 2 },
    invite: invite("mockInviteTokenDorm00A", "K7Q2M9"),
    dissolved: false,
  },
  {
    id: "c-family",
    name: "家人群",
    avatar: "preset:family",
    type: "family",
    ownerId: PEOPLE.mom.id,
    timezone: "Asia/Shanghai",
    needApproval: false,
    inviteOwnerOnly: false,
    pigeonEnabled: true,
    penaltyText: null,
    memberIds: [PEOPLE.mom.id, PEOPLE.jie.id, PEOPLE.li.id, PEOPLE.zhou.id, PEOPLE.lin.id],
    extraCount: 0,
    pendingIds: [],
    groupNicknames: {},
    activePlanCount: 1,
    planCount: 1,
    king: null,
    peaceStreak: 3,
    stats: { plansThisMonth: 2, formedThisMonth: 2, longestPeaceStreak: 3 },
    invite: invite("mockInviteTokenFamily0", "HM3F7A"),
    dissolved: false,
  },
  {
    id: "c-sport",
    name: "羽毛球搭子",
    avatar: "preset:sport",
    type: "friends",
    ownerId: PEOPLE.liu.id,
    timezone: "Asia/Shanghai",
    needApproval: false,
    inviteOwnerOnly: false,
    pigeonEnabled: true,
    penaltyText: null,
    memberIds: [PEOPLE.liu.id, PEOPLE.jie.id],
    extraCount: 10,
    pendingIds: [],
    groupNicknames: {},
    activePlanCount: 1,
    planCount: 2,
    king: { userId: PEOPLE.liu.id, points: 5, streakWeeks: 2 },
    peaceStreak: 0,
    stats: { plansThisMonth: 4, formedThisMonth: 3, longestPeaceStreak: 1 },
    invite: invite("mockInviteTokenSport00", "BQ4X8N"),
    dissolved: false,
  },
  {
    id: "c-work",
    name: "同事群",
    avatar: "preset:work",
    type: "colleagues",
    ownerId: PEOPLE.xiaolin.id,
    timezone: "Asia/Shanghai",
    needApproval: false,
    inviteOwnerOnly: false,
    pigeonEnabled: false,
    penaltyText: null,
    memberIds: [PEOPLE.xiaolin.id, PEOPLE.jie.id],
    extraCount: 18,
    pendingIds: [],
    groupNicknames: {},
    activePlanCount: 1,
    planCount: 1,
    king: null,
    peaceStreak: 0,
    stats: { plansThisMonth: 3, formedThisMonth: 1, longestPeaceStreak: 0 },
    invite: invite("mockInviteTokenWork000", "P6TW2R"),
    dissolved: false,
  },
];

let newCircleSeq = 1;

// ---------- 读出来的样子 ----------

function brief(userId: string, found?: MockCircle): UserBrief {
  const user = users.get(userId);
  return {
    id: userId,
    name: memberDisplayName({
      nickname: user?.nickname ?? null,
      groupNickname: found?.groupNicknames[userId] ?? null,
    }),
    avatarUrl: user?.avatarUrl ?? null,
  };
}

function kingOf(found: MockCircle): CircleKingDto | null {
  if (!found.king || !found.pigeonEnabled) return null;
  return {
    users: [brief(found.king.userId, found)],
    points: found.king.points,
    streakWeeks: found.king.streakWeeks,
  };
}

function summary(found: MockCircle): CircleSummaryDto {
  return {
    id: found.id,
    name: found.name,
    avatar: found.avatar,
    type: found.type,
    memberCount: found.memberIds.length + found.extraCount,
    myRole: found.ownerId === ME_ID ? "owner" : "member",
    owner: brief(found.ownerId, found),
    pigeonEnabled: found.pigeonEnabled,
    activePlanCount: found.activePlanCount,
    king: kingOf(found),
    peaceStreak: found.peaceStreak,
  };
}

function detail(found: MockCircle): CircleDetailDto {
  const isOwner = found.ownerId === ME_ID;
  return {
    ...summary(found),
    timezone: found.timezone,
    needApproval: found.needApproval,
    inviteOwnerOnly: found.inviteOwnerOnly,
    penaltyText: found.penaltyText,
    canInvite: isOwner || !found.inviteOwnerOnly,
    pendingCount: isOwner ? found.pendingIds.length : 0,
    planCount: found.planCount,
    myGroupNickname: found.groupNicknames[ME_ID] ?? null,
  };
}

function membersOf(found: MockCircle): MembersResult {
  const isOwner = found.ownerId === ME_ID;
  return {
    members: found.memberIds.map((userId, index) => ({
      user: brief(userId, found),
      role: userId === found.ownerId ? "owner" : "member",
      joinedAt: new Date(Date.now() - (found.memberIds.length - index) * 86_400_000).toISOString(),
      isMe: userId === ME_ID,
    })),
    pending: isOwner
      ? found.pendingIds.map((userId) => ({
          user: brief(userId),
          requestedAt: new Date().toISOString(),
        }))
      : [],
  };
}

function me(): MeDto {
  const user = users.get(ME_ID) as MockUser;
  return {
    id: ME_ID,
    nickname: user.nickname,
    avatarUrl: user.avatarUrl,
    theme: myTheme,
    timezone: "Asia/Shanghai",
    profileCompleted: Boolean(user.nickname),
  };
}

// ---------- 查找和权限 ----------

function find(id: string): MockCircle {
  const found = circles.find((c) => c.id === id && c.memberIds.includes(ME_ID));
  if (!found) throw err("CIRCLE_NOT_FOUND", "找不到这个群，可能已经退出或者被移出了。", 404);
  if (found.dissolved) throw err("CIRCLE_DISSOLVED", "这个群已经解散了。", 410);
  return found;
}

function findOwned(id: string): MockCircle {
  const found = find(id);
  if (found.ownerId !== ME_ID) throw err("NOT_CIRCLE_OWNER", "只有群主能做这件事。", 403);
  return found;
}

function byInvite(query: Record<string, unknown>): MockCircle | undefined {
  const t = String(query.t ?? "");
  const code = String(query.code ?? "")
    .replace(/\s/g, "")
    .toUpperCase();
  return circles.find((c) => (t && c.invite.token === t) || (code && c.invite.code === code));
}

// ---------- 对外：每个假接口一个函数 ----------

export const mockDb = {
  health(): HealthResult {
    return {
      ok: true,
      name: APP_NAME,
      role: "web",
      deps: { db: "up", redis: "up" },
      serverTime: new Date().toISOString(),
      wechatDriver: "fake",
    };
  },

  login: () => ({ user: me(), isNew: false }),
  me,
  updateProfile(body: Record<string, unknown>): MeDto {
    const user = users.get(ME_ID) as MockUser;
    user.nickname = String(body.nickname ?? user.nickname);
    if (body.avatarUrl !== undefined) user.avatarUrl = (body.avatarUrl as string | null) ?? null;
    return me();
  },
  updateSettings(body: Record<string, unknown>): MeDto {
    if (typeof body.theme === "string") myTheme = body.theme as ThemeName;
    return me();
  },

  circles: (): CircleSummaryDto[] =>
    circles.filter((c) => c.memberIds.includes(ME_ID) && !c.dissolved).map(summary),

  createCircle(body: Record<string, unknown>): CircleDetailDto {
    const id = `c-new-${newCircleSeq++}`;
    const created: MockCircle = {
      id,
      name: String(body.name),
      avatar: String(body.avatar),
      type: body.type as CircleType,
      ownerId: ME_ID,
      timezone: String(body.timezone),
      needApproval: false,
      inviteOwnerOnly: false,
      pigeonEnabled: true,
      penaltyText: null,
      memberIds: [ME_ID],
      extraCount: 0,
      pendingIds: [],
      groupNicknames: {},
      activePlanCount: 0,
      planCount: 0,
      king: null,
      peaceStreak: 0,
      stats: { plansThisMonth: 0, formedThisMonth: 0, longestPeaceStreak: 0 },
      invite: invite(`mockInviteTokenNew${String(newCircleSeq).padStart(4, "0")}`, "NEW2C8"),
      dissolved: false,
    };
    circles.push(created);
    return detail(created);
  },

  circle: (id: string) => detail(find(id)),

  updateCircle(id: string, body: Record<string, unknown>): CircleDetailDto {
    const found = findOwned(id);
    const keys = [
      "name",
      "type",
      "avatar",
      "timezone",
      "needApproval",
      "inviteOwnerOnly",
      "pigeonEnabled",
    ] as const;
    for (const key of keys) {
      if (body[key] !== undefined) (found as unknown as Record<string, unknown>)[key] = body[key];
    }
    if (body.penaltyText !== undefined) {
      found.penaltyText = String(body.penaltyText ?? "").trim() || null;
    }
    return detail(found);
  },

  members: (id: string) => membersOf(find(id)),

  updateGroupNickname(id: string, body: Record<string, unknown>): CircleDetailDto {
    const found = find(id);
    const nickname = String(body.groupNickname ?? "").trim();
    if (nickname) found.groupNicknames[ME_ID] = nickname;
    else delete found.groupNicknames[ME_ID];
    return detail(found);
  },

  removeMember(id: string, userId: string): MembersResult {
    const found = findOwned(id);
    found.memberIds = found.memberIds.filter((m) => m !== userId);
    return membersOf(found);
  },

  approve(id: string, userId: string): MembersResult {
    const found = findOwned(id);
    found.pendingIds = found.pendingIds.filter((p) => p !== userId);
    found.memberIds.push(userId);
    return membersOf(found);
  },

  reject(id: string, userId: string): MembersResult {
    const found = findOwned(id);
    found.pendingIds = found.pendingIds.filter((p) => p !== userId);
    return membersOf(found);
  },

  leavePreview(id: string) {
    const found = find(id);
    return {
      blocker: leaveBlocker({
        role: found.ownerId === ME_ID ? "owner" : "member",
        activeMemberCount: found.memberIds.length + found.extraCount,
      }),
      flakePlans: [],
      exitPlans: [],
    };
  },

  leave(id: string): null {
    const found = find(id);
    if (found.ownerId === ME_ID) {
      throw found.memberIds.length + found.extraCount > 1
        ? err("OWNER_MUST_TRANSFER", "群主要先把群主转给别人，才能退群。", 409)
        : err("OWNER_ALONE", "群里只剩你一个人了，可以直接解散群组。", 409);
    }
    found.memberIds = found.memberIds.filter((m) => m !== ME_ID);
    return null;
  },

  transfer(id: string, body: Record<string, unknown>): CircleDetailDto {
    const found = findOwned(id);
    const to = String(body.toUserId);
    if (!found.memberIds.includes(to)) throw err("TARGET_NOT_MEMBER", "对方已经不在群里了。", 409);
    found.ownerId = to;
    found.memberIds = [to, ...found.memberIds.filter((m) => m !== to)];
    return detail(found);
  },

  dissolve(id: string): null {
    findOwned(id).dissolved = true;
    return null;
  },

  invite(id: string): InviteDto {
    const found = find(id);
    if (found.inviteOwnerOnly && found.ownerId !== ME_ID) {
      throw err("INVITE_NOT_ALLOWED", "群主设置了仅群主可邀请。", 403);
    }
    const inviter = brief(ME_ID, found);
    return {
      ...found.invite,
      shareTitle: `${inviter.name}邀请你加入「${found.name}」`,
      sharePath: `/pages/join/index?t=${found.invite.token}&from=${ME_ID}`,
    };
  },

  /** 落地页按「还不在群里的人」来演示（设计稿 JoinLanding），所以状态一律是可以加入 */
  invitePreview(query: Record<string, string>): InvitePreviewDto {
    const found = byInvite(query);
    if (!found) {
      return {
        status: "invalid",
        circle: null,
        inviter: null,
        stats: { plansThisMonth: 0, formedThisMonth: 0, longestPeaceStreak: 0 },
        upcomingPlans: [],
      };
    }
    const inviterId = found.memberIds.includes(query.from ?? "")
      ? (query.from as string)
      : found.ownerId;
    if (found.dissolved) {
      return {
        status: "dissolved",
        circle: null,
        inviter: null,
        stats: { plansThisMonth: 0, formedThisMonth: 0, longestPeaceStreak: 0 },
        upcomingPlans: [],
      };
    }
    return {
      status: "ok",
      circle: {
        id: found.id,
        name: found.name,
        avatar: found.avatar,
        type: found.type,
        memberCount: found.memberIds.length + found.extraCount,
        members: found.memberIds.slice(0, 8).map((userId) => brief(userId, found)),
        king: kingOf(found),
        needApproval: found.needApproval,
      },
      inviter: brief(inviterId, found),
      stats: found.stats,
      // 「群里在约」要用阶段 2 的计划时间文案，计划做好之前先空着
      upcomingPlans: [],
    };
  },

  join(body: Record<string, unknown>) {
    const found = byInvite(body);
    if (!found) throw err("INVITE_INVALID", "邀请不对，核对一下邀请码，或者让群友再发一次。", 404);
    if (found.dissolved) throw err("CIRCLE_DISSOLVED", "这个群已经解散了。", 410);
    if (found.memberIds.includes(ME_ID)) return { status: "already", circleId: found.id };
    if (found.needApproval) {
      found.pendingIds.push(ME_ID);
      return { status: "pending", circleId: found.id };
    }
    found.memberIds.push(ME_ID);
    return { status: "joined", circleId: found.id };
  },
};

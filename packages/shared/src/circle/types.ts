/** 群类型（docs/spec.md「创建群组」：朋友 / 家人 / 同事 / 同学 / 其他） */
export const CIRCLE_TYPES = ["friends", "family", "colleagues", "classmates", "other"] as const;

export type CircleType = (typeof CIRCLE_TYPES)[number];

export const CIRCLE_TYPE_LABELS: Record<CircleType, string> = {
  friends: "朋友",
  family: "家人",
  colleagues: "同事",
  classmates: "同学",
  other: "其他",
};

export function isCircleType(value: unknown): value is CircleType {
  return typeof value === "string" && (CIRCLE_TYPES as readonly string[]).includes(value);
}

export type CircleRole = "owner" | "member";

/** 群成员状态（docs/spec.md「数据模型」circle_member.status） */
export type MemberStatus = "active" | "left" | "removed";

export type CircleStatus = "active" | "dissolved";

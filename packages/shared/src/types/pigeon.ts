import type { FlakeTier } from "../flake/tiers";
import type { UserBrief } from "./user";

/**
 * 群组主页的「本周鸽榜」。
 * 接口 GET /circles/:id/pigeon-board 在阶段 3 做；阶段 1 小程序端按真实成员生成假数据，结构和这里一致。
 */
export interface PigeonBoardRowDto {
  user: UserBrief;
  points: number;
  flakeCount: number;
  /** 最近一次鸽了哪个局、算哪一档 */
  lastFlake: { planTitle: string; tier: FlakeTier } | null;
}

export interface PigeonBoardDto {
  /** 这周一 00:00（群时区），ISO 8601 UTC */
  weekStart: string;
  /** 这周的鸽子王什么时候揭晓：下周一 10:00（群时区） */
  revealAt: string;
  /** 本周有鸽值的人，按分数从高到低 */
  rows: PigeonBoardRowDto[];
  /** 本周零鸽的人 */
  zeroUsers: UserBrief[];
}

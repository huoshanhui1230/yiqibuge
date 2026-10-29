import { DateTime } from "luxon";

import type { Instant } from "./instant";
import { toDate } from "./instant";

/** 每周一 10:00（群时区）揭晓上一周的鸽子王（docs/spec.md「每周评选」） */
export const REVEAL_HOUR = 10;

export interface WeekBounds {
  /** 这周一 00:00（群时区），UTC 时刻 */
  start: Date;
  /** 下周一 00:00（群时区），UTC 时刻；不含 */
  end: Date;
}

/**
 * instant 所在的那一周，周一开始，按群时区算（docs/spec.md「鸽值计算」：
 * 周一 00:00 至周日 23:59）。用日历运算，夏令时那周也是对的（那周不是正好 168 小时）。
 */
export function weekBounds(instant: Instant, zone: string): WeekBounds {
  const start = DateTime.fromJSDate(toDate(instant)).setZone(zone).startOf("week");

  return { start: start.toJSDate(), end: start.plus({ weeks: 1 }).toJSDate() };
}

/** 这一周的鸽子王什么时候揭晓：下周一 10:00（群时区） */
export function weekRevealAt(weekStart: Instant, zone: string): Date {
  return DateTime.fromJSDate(toDate(weekStart))
    .setZone(zone)
    .startOf("week")
    .plus({ weeks: 1 })
    .set({ hour: REVEAL_HOUR })
    .toJSDate();
}

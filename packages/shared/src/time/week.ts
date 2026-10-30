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

/** 群设置里鸽子王评选那行的说明：「每周一 10:00 揭晓」 */
export function revealRuleText(): string {
  return `每周一 ${String(REVEAL_HOUR).padStart(2, "0")}:00 揭晓`;
}

/** 一周算到哪一刻为止（weekBounds 的 end），鸽榜的提示语里用：「周日 24:00」 */
export function weekDeadlineText(): string {
  return "周日 24:00";
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

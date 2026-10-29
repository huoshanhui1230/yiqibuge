import { DateTime } from "luxon";

import type { Instant } from "./instant";
import { toDate } from "./instant";

/**
 * 日期和倒计时文案。页面和通知里不手写日期格式，一律调这里（CLAUDE.md「必须遵守」）。
 * 阶段 1 只做页面用得到的几个；计划的「相对日 · 日期 · 时段」在阶段 2 按测试驱动补齐。
 */

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

function inZone(instant: Instant, zone: string): DateTime {
  return DateTime.fromJSDate(toDate(instant)).setZone(zone);
}

/** 「10月28日」，按 zone 所在地的日期 */
export function formatMonthDay(instant: Instant, zone: string): string {
  const local = inZone(instant, zone);

  return `${local.month}月${local.day}日`;
}

/**
 * 两天之间：同月「10月19日–25日」，跨月「10月26日–11月1日」，跨年也不写年份
 * （一周最多跨一次年，「12月28日–1月3日」不会看错）。endInclusive 是最后一天里的任一时刻。
 */
export function formatDayRange(start: Instant, endInclusive: Instant, zone: string): string {
  const from = inZone(start, zone);
  const to = inZone(endInclusive, zone);
  const head = `${from.month}月${from.day}日`;

  return from.month === to.month && from.year === to.year
    ? `${head}–${to.day}日`
    : `${head}–${to.month}月${to.day}日`;
}

/** 一周（周一到周日）的日期范围，weekStart 是那周一 00:00 */
export function formatWeekRange(weekStart: Instant, zone: string): string {
  const monday = inZone(weekStart, zone);

  return formatDayRange(monday.toJSDate(), monday.plus({ days: 6 }).toJSDate(), zone);
}

/**
 * 倒计时的数字部分（docs/spec.md「时间文案规则」的四档里前三档）：
 * 超过 1 天「X 天 Y 小时」；1 天内「X 小时 Y 分」；1 小时内「X 分钟」。
 * 一律向下取整，所以不会出现还没到 1 小时却写「60 分钟」；最后不足 1 分钟时写「1 分钟」。
 * to 不晚于 from 时返回 null，由调用方决定写「进行中」还是别的。
 */
export function countdownText(from: Instant, to: Instant): string | null {
  const diff = toDate(to).getTime() - toDate(from).getTime();

  if (diff <= 0) {
    return null;
  }
  if (diff >= DAY_MS) {
    return `${Math.floor(diff / DAY_MS)} 天 ${Math.floor((diff % DAY_MS) / HOUR_MS)} 小时`;
  }
  if (diff >= HOUR_MS) {
    return `${Math.floor(diff / HOUR_MS)} 小时 ${Math.floor((diff % HOUR_MS) / MINUTE_MS)} 分`;
  }

  return `${Math.max(1, Math.floor(diff / MINUTE_MS))} 分钟`;
}

/** 鸽榜右上角：「4 天 21 小时后揭晓」，过了揭晓时刻写「揭晓啦」 */
export function formatRevealCountdown(now: Instant, revealAt: Instant): string {
  const text = countdownText(now, revealAt);

  return text === null ? "揭晓啦" : `${text}后揭晓`;
}

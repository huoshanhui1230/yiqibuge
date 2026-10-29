import { DateTime, IANAZone } from "luxon";

import type { Instant } from "./instant";
import { toDate } from "./instant";

/** 群时区取不到又猜不出来时用北京时间：用户大多在国内 */
export const FALLBACK_TIME_ZONE = "Asia/Shanghai";

export interface TimeZoneOption {
  zone: string;
  label: string;
}

/**
 * 时区选择列表：国内加上留学、工作常去的地方（面向海外用户，docs/decisions.md 第 8 条）。
 * 名字按中文习惯叫「X 时间」。
 */
export const COMMON_TIME_ZONES: readonly TimeZoneOption[] = [
  { zone: "Asia/Shanghai", label: "北京时间" },
  { zone: "Asia/Hong_Kong", label: "香港时间" },
  { zone: "Asia/Macau", label: "澳门时间" },
  { zone: "Asia/Taipei", label: "台北时间" },
  { zone: "Asia/Singapore", label: "新加坡时间" },
  { zone: "Asia/Kuala_Lumpur", label: "吉隆坡时间" },
  { zone: "Asia/Bangkok", label: "曼谷时间" },
  { zone: "Asia/Tokyo", label: "东京时间" },
  { zone: "Asia/Seoul", label: "首尔时间" },
  { zone: "Asia/Kolkata", label: "印度时间" },
  { zone: "Asia/Kathmandu", label: "加德满都时间" },
  { zone: "Asia/Dubai", label: "迪拜时间" },
  { zone: "Europe/London", label: "伦敦时间" },
  { zone: "Europe/Paris", label: "巴黎时间" },
  { zone: "Europe/Berlin", label: "柏林时间" },
  { zone: "Europe/Moscow", label: "莫斯科时间" },
  { zone: "America/New_York", label: "纽约时间" },
  { zone: "America/Toronto", label: "多伦多时间" },
  { zone: "America/Chicago", label: "芝加哥时间" },
  { zone: "America/Los_Angeles", label: "洛杉矶时间" },
  { zone: "America/Vancouver", label: "温哥华时间" },
  { zone: "Australia/Sydney", label: "悉尼时间" },
  { zone: "Australia/Melbourne", label: "墨尔本时间" },
  { zone: "Australia/Brisbane", label: "布里斯班时间" },
  { zone: "Australia/Adelaide", label: "阿德莱德时间" },
  { zone: "Australia/Perth", label: "珀斯时间" },
  { zone: "Pacific/Auckland", label: "奥克兰时间" },
];

/** 列表里没有、但其实就是北京时间的旧写法 */
const ALIASES: Record<string, string> = {
  "Asia/Chongqing": "北京时间",
  "Asia/Chungking": "北京时间",
  "Asia/Harbin": "北京时间",
  PRC: "北京时间",
};

export function isValidTimeZone(zone: string): boolean {
  return IANAZone.isValidZone(zone);
}

/** 「北京时间」「悉尼时间」；列表里没有的直接显示时区 ID */
export function timeZoneLabel(zone: string): string {
  return COMMON_TIME_ZONES.find((option) => option.zone === zone)?.label ?? ALIASES[zone] ?? zone;
}

/**
 * 某一刻这个时区相对 UTC 的偏移：「UTC+8」「UTC+5:30」「UTC-5」「UTC+0」。
 * 要带时刻，因为有夏令时的地方（悉尼、伦敦）一年里偏移会变。
 */
export function utcOffsetLabel(zone: string, at: Instant): string {
  const offset = DateTime.fromJSDate(toDate(at)).setZone(zone).offset;
  const sign = offset < 0 ? "-" : "+";
  const hours = Math.floor(Math.abs(offset) / 60);
  const minutes = Math.abs(offset) % 60;

  return minutes === 0
    ? `UTC${sign}${hours}`
    : `UTC${sign}${hours}:${String(minutes).padStart(2, "0")}`;
}

/**
 * 手机当前的时区（群时区默认取创建者手机的时区，docs/spec.md「创建群组」）。
 * 有的运行环境 Intl 拿不到时区名，就按当前 UTC 偏移在常用列表里找一个对得上的，
 * 再不行用北京时间。
 */
export function deviceTimeZone(now: Date = new Date()): string {
  try {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (zone && isValidTimeZone(zone)) {
      return zone;
    }
  } catch {
    // 落到下面按偏移猜
  }

  const offset = -now.getTimezoneOffset();
  const match = COMMON_TIME_ZONES.find(
    (option) => DateTime.fromJSDate(now).setZone(option.zone).offset === offset,
  );

  return match?.zone ?? FALLBACK_TIME_ZONE;
}

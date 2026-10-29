import { afterEach, describe, expect, it, vi } from "vitest";

import {
  countdownText,
  deviceTimeZone,
  formatDayRange,
  formatMonthDay,
  formatRevealCountdown,
  formatWeekRange,
  isValidTimeZone,
  timeZoneLabel,
  utcOffsetLabel,
  weekBounds,
  weekRevealAt,
} from "./index";

const HOUR = 60 * 60 * 1000;

describe("几月几日", () => {
  it("按时区所在地的日期写", () => {
    expect(formatMonthDay("2026-10-28T03:00:00Z", "Asia/Shanghai")).toBe("10月28日");
  });

  it("UTC 还是前一天、北京已经是第二天时，写北京的日期", () => {
    expect(formatMonthDay("2026-10-27T17:00:00Z", "Asia/Shanghai")).toBe("10月28日");
    expect(formatMonthDay("2026-10-27T17:00:00Z", "UTC")).toBe("10月27日");
  });

  it("个位数的月和日不补 0", () => {
    expect(formatMonthDay("2026-03-05T04:00:00Z", "Asia/Shanghai")).toBe("3月5日");
  });
});

describe("日期范围", () => {
  it("同月只写一次月份", () => {
    expect(formatDayRange("2026-10-18T16:00:00Z", "2026-10-25T15:00:00Z", "Asia/Shanghai")).toBe(
      "10月19日–25日",
    );
  });

  it("跨月两边都写月份", () => {
    expect(formatDayRange("2026-10-25T16:00:00Z", "2026-11-01T15:00:00Z", "Asia/Shanghai")).toBe(
      "10月26日–11月1日",
    );
  });

  it("跨年也不写年份", () => {
    expect(formatDayRange("2026-12-27T16:00:00Z", "2027-01-03T15:00:00Z", "Asia/Shanghai")).toBe(
      "12月28日–1月3日",
    );
  });

  it("一周的范围：周一到周日", () => {
    const { start } = weekBounds("2026-10-23T10:30:00Z", "Asia/Shanghai");

    expect(formatWeekRange(start, "Asia/Shanghai")).toBe("10月19日–25日");
  });
});

describe("倒计时数字", () => {
  const from = new Date("2026-10-21T00:00:00.000Z");
  const after = (ms: number) => new Date(from.getTime() + ms);

  it("超过 1 天：X 天 Y 小时（向下取整）", () => {
    expect(countdownText(from, after(4 * 24 * HOUR + 21 * HOUR + 30 * 60 * 1000))).toBe(
      "4 天 21 小时",
    );
    expect(countdownText(from, after(24 * HOUR))).toBe("1 天 0 小时");
  });

  it("1 天内：X 小时 Y 分", () => {
    expect(countdownText(from, after(24 * HOUR - 60 * 1000))).toBe("23 小时 59 分");
    expect(countdownText(from, after(HOUR))).toBe("1 小时 0 分");
  });

  it("1 小时内：X 分钟，不会出现「60 分钟」", () => {
    expect(countdownText(from, after(HOUR - 30 * 1000))).toBe("59 分钟");
    expect(countdownText(from, after(5 * 60 * 1000))).toBe("5 分钟");
  });

  it("最后不足 1 分钟写「1 分钟」", () => {
    expect(countdownText(from, after(1000))).toBe("1 分钟");
  });

  it("到点或已经过了返回 null，由调用方决定怎么写", () => {
    expect(countdownText(from, from)).toBeNull();
    expect(countdownText(from, after(-HOUR))).toBeNull();
  });

  it("鸽榜的揭晓倒计时", () => {
    expect(formatRevealCountdown(from, after(4 * 24 * HOUR + 21 * HOUR))).toBe(
      "4 天 21 小时后揭晓",
    );
    expect(formatRevealCountdown(from, after(-1))).toBe("揭晓啦");
  });
});

describe("按群时区算一周（周一开始）", () => {
  it("北京时间周五所在的那一周", () => {
    const { start, end } = weekBounds("2026-10-23T10:30:00Z", "Asia/Shanghai");

    expect(start.toISOString()).toBe("2026-10-18T16:00:00.000Z");
    expect(end.toISOString()).toBe("2026-10-25T16:00:00.000Z");
  });

  it("周一 00:00 正好属于新的一周，周日 23:59 还属于上一周", () => {
    expect(weekBounds("2026-10-18T16:00:00Z", "Asia/Shanghai").start.toISOString()).toBe(
      "2026-10-18T16:00:00.000Z",
    );
    expect(weekBounds("2026-10-18T15:59:00Z", "Asia/Shanghai").start.toISOString()).toBe(
      "2026-10-11T16:00:00.000Z",
    );
  });

  it("同一时刻，不同时区可能在不同的周", () => {
    // 北京周一 01:00，纽约还是周日中午
    const instant = "2026-10-18T17:00:00Z";

    expect(weekBounds(instant, "Asia/Shanghai").start.toISOString()).toBe(
      "2026-10-18T16:00:00.000Z",
    );
    expect(weekBounds(instant, "America/New_York").start.toISOString()).toBe(
      "2026-10-12T04:00:00.000Z",
    );
  });

  it("悉尼夏令时开始那周只有 167 小时（10 月 4 日凌晨拨快 1 小时）", () => {
    const { start, end } = weekBounds("2026-10-03T00:00:00Z", "Australia/Sydney");

    expect(start.toISOString()).toBe("2026-09-27T14:00:00.000Z");
    expect(end.toISOString()).toBe("2026-10-04T13:00:00.000Z");
    expect((end.getTime() - start.getTime()) / HOUR).toBe(167);
  });

  it("悉尼夏令时结束那周有 169 小时（2027 年 4 月 4 日拨回 1 小时）", () => {
    const { start, end } = weekBounds("2027-04-01T00:00:00Z", "Australia/Sydney");

    expect(start.toISOString()).toBe("2027-03-28T13:00:00.000Z");
    expect(end.toISOString()).toBe("2027-04-04T14:00:00.000Z");
    expect((end.getTime() - start.getTime()) / HOUR).toBe(169);
  });

  it("半小时、45 分钟时差的时区", () => {
    expect(weekBounds("2026-10-21T00:00:00Z", "Asia/Kolkata").start.toISOString()).toBe(
      "2026-10-18T18:30:00.000Z",
    );
    expect(weekBounds("2026-10-21T00:00:00Z", "Asia/Kathmandu").start.toISOString()).toBe(
      "2026-10-18T18:15:00.000Z",
    );
  });
});

describe("这周的鸽子王什么时候揭晓", () => {
  it("下周一 10:00（群时区）", () => {
    expect(weekRevealAt("2026-10-18T16:00:00Z", "Asia/Shanghai").toISOString()).toBe(
      "2026-10-26T02:00:00.000Z",
    );
  });

  it("中间跨了夏令时，揭晓时刻按新的偏移算", () => {
    // 悉尼 9 月 28 日这周，揭晓在 10 月 5 日 10:00，那时已经是 UTC+11
    expect(weekRevealAt("2026-09-27T14:00:00Z", "Australia/Sydney").toISOString()).toBe(
      "2026-10-04T23:00:00.000Z",
    );
  });
});

describe("时区的名字和偏移", () => {
  it("常用时区有中文名", () => {
    expect(timeZoneLabel("Asia/Shanghai")).toBe("北京时间");
    expect(timeZoneLabel("Australia/Sydney")).toBe("悉尼时间");
  });

  it("北京时间的旧写法也认", () => {
    expect(timeZoneLabel("Asia/Chongqing")).toBe("北京时间");
  });

  it("列表里没有的直接显示时区 ID", () => {
    expect(timeZoneLabel("Africa/Nairobi")).toBe("Africa/Nairobi");
  });

  it("UTC 偏移：整点、半点、45 分、负数", () => {
    const at = "2026-01-15T00:00:00Z";

    expect(utcOffsetLabel("Asia/Shanghai", at)).toBe("UTC+8");
    expect(utcOffsetLabel("Asia/Kolkata", at)).toBe("UTC+5:30");
    expect(utcOffsetLabel("Asia/Kathmandu", at)).toBe("UTC+5:45");
    expect(utcOffsetLabel("America/New_York", at)).toBe("UTC-5");
    expect(utcOffsetLabel("Europe/London", at)).toBe("UTC+0");
  });

  it("有夏令时的地方，偏移随日期变", () => {
    expect(utcOffsetLabel("Australia/Sydney", "2026-01-15T00:00:00Z")).toBe("UTC+11");
    expect(utcOffsetLabel("Australia/Sydney", "2026-07-15T00:00:00Z")).toBe("UTC+10");
    expect(utcOffsetLabel("America/New_York", "2026-07-15T00:00:00Z")).toBe("UTC-4");
  });

  it("合法的 IANA 时区才算数", () => {
    expect(isValidTimeZone("Asia/Shanghai")).toBe(true);
    expect(isValidTimeZone("Mars/Olympus")).toBe(false);
    expect(isValidTimeZone("")).toBe(false);
  });
});

describe("手机当前的时区", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const RealDateTimeFormat = Intl.DateTimeFormat;

  /**
   * 只假装「不带参数」的那次调用（deviceTimeZone 用它取手机时区）；
   * 带参数的照常走真的 —— luxon 校验时区、算偏移都靠它。
   */
  function fakeIntl(timeZone: string | undefined): void {
    vi.spyOn(Intl, "DateTimeFormat").mockImplementation(((
      ...args: ConstructorParameters<typeof Intl.DateTimeFormat>
    ) =>
      args.length === 0
        ? ({ resolvedOptions: () => ({ timeZone }) } as unknown as Intl.DateTimeFormat)
        : new RealDateTimeFormat(...args)) as typeof Intl.DateTimeFormat);
  }

  it("Intl 拿得到就用它", () => {
    fakeIntl("Australia/Perth");

    expect(deviceTimeZone()).toBe("Australia/Perth");
  });

  it("Intl 拿不到时按当前偏移在常用列表里找", () => {
    fakeIntl(undefined);
    const now = new Date("2026-10-28T00:00:00Z");
    vi.spyOn(now, "getTimezoneOffset").mockReturnValue(-660);

    // 10 月底悉尼是 UTC+11，列表里排在前面的是悉尼
    expect(deviceTimeZone(now)).toBe("Australia/Sydney");
  });

  it("Intl 给了个认不出的名字也按偏移找，再找不到就用北京时间", () => {
    fakeIntl("Foo/Bar");
    const now = new Date("2026-10-28T00:00:00Z");
    vi.spyOn(now, "getTimezoneOffset").mockReturnValue(-480);

    expect(deviceTimeZone(now)).toBe("Asia/Shanghai");

    vi.spyOn(now, "getTimezoneOffset").mockReturnValue(-123);
    expect(deviceTimeZone(now)).toBe("Asia/Shanghai");
  });
});

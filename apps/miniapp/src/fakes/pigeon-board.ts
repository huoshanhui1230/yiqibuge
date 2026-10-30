import { weekBounds, weekRevealAt, type PigeonBoardDto, type UserBrief } from "@yiqi/shared";

/**
 * 鸽榜的假数据（阶段 1 方案：「鸽榜先用假数据」）。
 * 鸽值要等阶段 3 才算得出来，接口 GET /circles/:id/pigeon-board 也是阶段 3 做；
 * 在那之前按群里的真成员排一份样子货：成员列表里第 2、3 个人各鸽了一次，其余本周零鸽。
 * 周的起止和揭晓时间是真算的（群时区，周一开始，下周一 10:00 揭晓）。
 *
 * 阶段 3 换成真接口时删掉这个文件，页面只认 PigeonBoardDto。
 */
export function fakePigeonBoard(
  timezone: string,
  members: UserBrief[],
  now: Date = new Date(),
): PigeonBoardDto {
  const { start } = weekBounds(now, timezone);
  const [first, second, third, ...rest] = members;

  const rows: PigeonBoardDto["rows"] = [];
  if (second) {
    rows.push({
      user: second,
      points: 2,
      flakeCount: 1,
      lastFlake: { planTitle: "周五火锅局", tier: "medium" },
    });
  }
  if (third) {
    rows.push({
      user: third,
      points: 1,
      flakeCount: 1,
      lastFlake: { planTitle: "周三奶茶局", tier: "small" },
    });
  }

  return {
    weekStart: start.toISOString(),
    revealAt: weekRevealAt(start, timezone).toISOString(),
    rows,
    zeroUsers: [first, ...rest].filter((user): user is UserBrief => Boolean(user)),
  };
}

import type { UserBrief } from "@yiqi/shared";
import { describe, expect, it } from "vitest";

import { fakePigeonBoard } from "./pigeon-board";

const person = (id: string, name: string): UserBrief => ({ id, name, avatarUrl: null });
const members = [
  person("1", "阿杰"),
  person("2", "老陈"),
  person("3", "大壮"),
  person("4", "莉莉"),
  person("5", "美美"),
];

describe("鸽榜假数据", () => {
  it("第 2、3 个人上榜（2 分、1 分），其余本周零鸽，群主在零鸽里排第一", () => {
    const board = fakePigeonBoard("Asia/Shanghai", members, new Date("2026-10-23T10:00:00Z"));

    expect(board.rows.map((row) => [row.user.name, row.points])).toEqual([
      ["老陈", 2],
      ["大壮", 1],
    ]);
    expect(board.zeroUsers.map((user) => user.name)).toEqual(["阿杰", "莉莉", "美美"]);
  });

  it("周的起止和揭晓时间是真算的：群时区周一开始，下周一 10:00 揭晓", () => {
    const board = fakePigeonBoard("Asia/Shanghai", members, new Date("2026-10-23T10:00:00Z"));

    expect(board.weekStart).toBe("2026-10-18T16:00:00.000Z");
    expect(board.revealAt).toBe("2026-10-26T02:00:00.000Z");
  });

  it("群里只有群主一个人：没人上榜", () => {
    const board = fakePigeonBoard("Asia/Shanghai", members.slice(0, 1));

    expect(board.rows).toEqual([]);
    expect(board.zeroUsers.map((user) => user.name)).toEqual(["阿杰"]);
  });
});

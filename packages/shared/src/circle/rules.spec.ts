import { describe, expect, it } from "vitest";

import {
  checkCircleName,
  checkNickname,
  checkOptionalText,
  dissolveBlocker,
  leaveBlocker,
  memberDisplayName,
  planExitOutcome,
  removeBlocker,
  transferBlocker,
  type ResponseStatus,
} from "./rules";

describe("群名校验", () => {
  it("不能为空，全是空白也算空", () => {
    expect(checkCircleName("")).toBe("群名不能为空");
    expect(checkCircleName("   ")).toBe("群名不能为空");
    expect(checkCircleName(String.fromCodePoint(0x3000))).toBe("群名不能为空");
  });

  it("最多 12 个字，按字数算，不按字节", () => {
    expect(checkCircleName("一二三四五六七八九十一二")).toBeNull();
    expect(checkCircleName("一二三四五六七八九十一二三")).toBe("群名最多 12 个字");
  });

  it("emoji 算一个字", () => {
    expect(checkCircleName("🍲".repeat(12))).toBeNull();
    expect(checkCircleName("🍲".repeat(13))).toBe("群名最多 12 个字");
  });

  it("首尾空白不算字数", () => {
    expect(checkCircleName("  一二三四五六七八九十一二  ")).toBeNull();
  });
});

describe("昵称和选填文字", () => {
  it("昵称不能为空，最多 12 个字", () => {
    expect(checkNickname("")).toBe("昵称不能为空");
    expect(checkNickname("阿杰")).toBeNull();
    expect(checkNickname("一二三四五六七八九十一二三")).toBe("昵称最多 12 个字");
  });

  it("选填文字可以留空，超长才报错", () => {
    expect(checkOptionalText("", "鸽王任务卡", 30)).toBeNull();
    expect(checkOptionalText("下次局负责订位", "鸽王任务卡", 30)).toBeNull();
    expect(checkOptionalText("字".repeat(31), "鸽王任务卡", 30)).toBe("鸽王任务卡最多 30 个字");
  });
});

describe("退群：群主不能直接退", () => {
  it("普通成员随时能退", () => {
    expect(leaveBlocker({ role: "member", activeMemberCount: 8 })).toBeNull();
  });

  it("群里还有别人，群主要先转让", () => {
    expect(leaveBlocker({ role: "owner", activeMemberCount: 2 })).toBe("OWNER_MUST_TRANSFER");
    expect(leaveBlocker({ role: "owner", activeMemberCount: 100 })).toBe("OWNER_MUST_TRANSFER");
  });

  it("只剩群主自己时只能解散", () => {
    expect(leaveBlocker({ role: "owner", activeMemberCount: 1 })).toBe("OWNER_ALONE");
  });
});

describe("移出成员和转让群主", () => {
  const base = { actorRole: "owner" as const, actorId: "1", targetId: "2" };

  for (const [label, check] of [
    ["移出", removeBlocker],
    ["转让", transferBlocker],
  ] as const) {
    it(`${label}：群主对在群里的其他人可以`, () => {
      expect(check({ ...base, targetStatus: "active" })).toBeNull();
    });

    it(`${label}：普通成员不行`, () => {
      expect(check({ ...base, actorRole: "member", targetStatus: "active" })).toBe("NOT_OWNER");
    });

    it(`${label}：不能对自己`, () => {
      expect(check({ ...base, targetId: "1", targetStatus: "active" })).toBe("TARGET_IS_SELF");
    });

    it(`${label}：对方已经退群、被移出或根本不在群里都不行`, () => {
      expect(check({ ...base, targetStatus: "left" })).toBe("TARGET_NOT_MEMBER");
      expect(check({ ...base, targetStatus: "removed" })).toBe("TARGET_NOT_MEMBER");
      expect(check({ ...base, targetStatus: null })).toBe("TARGET_NOT_MEMBER");
    });
  }

  it("只有群主能解散", () => {
    expect(dissolveBlocker({ actorRole: "owner" })).toBeNull();
    expect(dissolveBlocker({ actorRole: "member" })).toBe("NOT_OWNER");
  });
});

describe("退群时计划上的表态怎么处理", () => {
  const now = new Date("2026-10-22T10:00:00.000Z");
  const HOUR = 60 * 60 * 1000;
  const startIn = (ms: number) => new Date(now.getTime() + ms);

  it("主动退群、已跟、不到 24 小时开始：按鸽了处理（防止退群逃鸽）", () => {
    expect(
      planExitOutcome({ reason: "leave", status: "in", startAt: startIn(23 * HOUR), now }),
    ).toBe("flake");
    expect(
      planExitOutcome({ reason: "leave", status: "in", startAt: startIn(60 * 1000), now }),
    ).toBe("flake");
  });

  it("正好 24 小时也算「24 小时内」", () => {
    expect(
      planExitOutcome({ reason: "leave", status: "in", startAt: startIn(24 * HOUR), now }),
    ).toBe("flake");
  });

  it("超过 24 小时，主动退群也只是悄悄退出", () => {
    expect(
      planExitOutcome({ reason: "leave", status: "in", startAt: startIn(24 * HOUR + 1), now }),
    ).toBe("exit");
  });

  it("候补递补上来 2 小时内（含）退群，不计鸽", () => {
    const startAt = startIn(10 * HOUR);
    const promotedAt = (msAgo: number) => new Date(now.getTime() - msAgo);

    expect(
      planExitOutcome({
        reason: "leave",
        status: "in",
        startAt,
        now,
        promotedAt: promotedAt(HOUR / 2),
      }),
    ).toBe("exit");
    expect(
      planExitOutcome({
        reason: "leave",
        status: "in",
        startAt,
        now,
        promotedAt: promotedAt(2 * HOUR),
      }),
    ).toBe("exit");
  });

  it("递补超过 2 小时再退群，照样按鸽了算", () => {
    expect(
      planExitOutcome({
        reason: "leave",
        status: "in",
        startAt: startIn(10 * HOUR),
        now,
        promotedAt: new Date(now.getTime() - 2 * HOUR - 1),
      }),
    ).toBe("flake");
    expect(
      planExitOutcome({
        reason: "leave",
        status: "in",
        startAt: startIn(10 * HOUR),
        now,
        promotedAt: null,
      }),
    ).toBe("flake");
  });

  it("被群主移出，就算马上开始也不计鸽", () => {
    expect(planExitOutcome({ reason: "removed", status: "in", startAt: startIn(HOUR), now })).toBe(
      "exit",
    );
  });

  it("候补、待确认、未表态、不跟、已经鸽过的，退群都只是退出", () => {
    const statuses: ResponseStatus[] = ["waitlist", "reconfirm", "pending", "out", "flaked"];

    for (const status of statuses) {
      expect(planExitOutcome({ reason: "leave", status, startAt: startIn(HOUR), now })).toBe(
        "exit",
      );
    }
  });

  it("已经开始的计划冻结，不动", () => {
    expect(planExitOutcome({ reason: "leave", status: "in", startAt: now, now })).toBe("keep");
    expect(
      planExitOutcome({ reason: "leave", status: "in", startAt: "2026-10-22T09:00:00.000Z", now }),
    ).toBe("keep");
  });
});

describe("群里显示的名字", () => {
  it("群昵称优先，其次微信昵称", () => {
    expect(memberDisplayName({ nickname: "杰", groupNickname: "二舅" })).toBe("二舅");
    expect(memberDisplayName({ nickname: "阿杰", groupNickname: null })).toBe("阿杰");
  });

  it("群昵称只有空白时当没设", () => {
    expect(memberDisplayName({ nickname: "阿杰", groupNickname: "  " })).toBe("阿杰");
  });

  it("都没有就叫「微信用户」（从落地页直接加入、还没填资料的人）", () => {
    expect(memberDisplayName({ nickname: null })).toBe("微信用户");
    expect(memberDisplayName({ nickname: "" })).toBe("微信用户");
  });

  it("退群和被移出的人显示「某某（已退群）」", () => {
    expect(memberDisplayName({ nickname: "阿杰", status: "left" })).toBe("阿杰（已退群）");
    expect(memberDisplayName({ nickname: "阿杰", status: "removed" })).toBe("阿杰（已退群）");
    expect(memberDisplayName({ nickname: "阿杰", status: "active" })).toBe("阿杰");
  });

  it("注销的人一律「已注销用户」", () => {
    expect(memberDisplayName({ nickname: "阿杰", groupNickname: "二舅", deleted: true })).toBe(
      "已注销用户",
    );
  });
});

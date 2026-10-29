import { describe, expect, it, vi } from "vitest";

import {
  INVITE_CODE_ALPHABET,
  INVITE_CODE_LENGTH,
  generateInviteCode,
  inviteExpireAt,
  isInviteExpired,
  isValidInviteToken,
  normalizeInviteCode,
  parseInviteCode,
} from "./code";

describe("邀请码字符集", () => {
  it("30 个字符，没有重复", () => {
    expect(INVITE_CODE_ALPHABET).toHaveLength(30);
    expect(new Set(INVITE_CODE_ALPHABET).size).toBe(30);
  });

  it("去掉了念出来、看起来容易混的 0 O 1 I L U", () => {
    for (const char of ["0", "O", "1", "I", "L", "U"]) {
      expect(INVITE_CODE_ALPHABET).not.toContain(char);
    }
  });

  it("只有大写字母和数字", () => {
    expect(INVITE_CODE_ALPHABET).toMatch(/^[2-9A-Z]+$/);
  });
});

describe("生成邀请码", () => {
  it("6 位，每一位都在字符集里", () => {
    let seed = 7;
    const code = generateInviteCode((max) => (seed = (seed * 31 + 11) % max));

    expect(code).toHaveLength(INVITE_CODE_LENGTH);
    for (const char of code) {
      expect(INVITE_CODE_ALPHABET).toContain(char);
    }
  });

  it("按注入的随机数逐位取字符，随机数的范围是字符集大小", () => {
    const randomInt = vi.fn((max: number) => max - 1);

    expect(generateInviteCode(randomInt)).toBe("ZZZZZZ");
    expect(randomInt).toHaveBeenCalledTimes(6);
    expect(randomInt).toHaveBeenCalledWith(30);
  });

  it("随机数全取 0 时是第一个字符", () => {
    expect(generateInviteCode(() => 0)).toBe("222222");
  });
});

describe("整理用户输入的邀请码", () => {
  it("转大写", () => {
    expect(normalizeInviteCode("k7q2m9")).toBe("K7Q2M9");
  });

  it("去掉空格、横线（口头念的时候常常三个一组）", () => {
    expect(normalizeInviteCode(" K7Q 2M9 ")).toBe("K7Q2M9");
    expect(normalizeInviteCode("K7Q-2M9")).toBe("K7Q2M9");
    expect(normalizeInviteCode("k7q—2m9")).toBe("K7Q2M9");
  });

  it("中文输入法打出来的全角字母数字和全角空格也认", () => {
    expect(normalizeInviteCode("Ｋ７ｑ２Ｍ９")).toBe("K7Q2M9");
    expect(normalizeInviteCode(`K7Q${String.fromCodePoint(0x3000)}2M9`)).toBe("K7Q2M9");
  });
});

describe("解析邀请码", () => {
  it("合法的返回标准写法", () => {
    expect(parseInviteCode("k7q 2m9")).toBe("K7Q2M9");
  });

  it("位数不对返回 null", () => {
    expect(parseInviteCode("K7Q2M")).toBeNull();
    expect(parseInviteCode("K7Q2M9A")).toBeNull();
    expect(parseInviteCode("")).toBeNull();
  });

  it("带了被去掉的易混字符返回 null（不去猜用户想打的是哪个）", () => {
    expect(parseInviteCode("K7Q2MO")).toBeNull();
    expect(parseInviteCode("K7Q2M0")).toBeNull();
    expect(parseInviteCode("K7Q2M1")).toBeNull();
    expect(parseInviteCode("K7Q2MI")).toBeNull();
    expect(parseInviteCode("K7Q2ML")).toBeNull();
    expect(parseInviteCode("K7Q2MU")).toBeNull();
  });

  it("带汉字或符号返回 null", () => {
    expect(parseInviteCode("K7Q2M鸽")).toBeNull();
    expect(parseInviteCode("K7Q2M!")).toBeNull();
  });
});

describe("邀请 token", () => {
  it("22 位 base64url 才合法", () => {
    expect(isValidInviteToken("AbCdEfGhIjKlMnOpQrSt-_")).toBe(true);
    expect(isValidInviteToken("AbCdEfGhIjKlMnOpQrSt-")).toBe(false);
    expect(isValidInviteToken("AbCdEfGhIjKlMnOpQrSt+/")).toBe(false);
  });
});

describe("邀请有效期", () => {
  const now = new Date("2026-10-21T04:00:00.000Z");

  it("从现在起整 7 天后过期", () => {
    expect(inviteExpireAt(now).toISOString()).toBe("2026-10-28T04:00:00.000Z");
  });

  it("到期之前没过期", () => {
    expect(isInviteExpired("2026-10-28T04:00:00.000Z", new Date("2026-10-28T03:59:59.999Z"))).toBe(
      false,
    );
  });

  it("到期那一刻起算过期", () => {
    expect(
      isInviteExpired(new Date("2026-10-28T04:00:00.000Z"), new Date("2026-10-28T04:00:00.000Z")),
    ).toBe(true);
    expect(isInviteExpired("2026-10-28T04:00:00.000Z", new Date("2026-11-01T00:00:00.000Z"))).toBe(
      true,
    );
  });
});

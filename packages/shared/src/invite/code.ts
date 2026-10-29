/**
 * 邀请码和邀请有效期（docs/spec.md「邀请与加入」，docs/decisions.md 第 26 条）。
 *
 * 邀请码是「口头告诉长辈」用的，所以去掉了念出来、看起来都容易混的
 * 0/O、1/I/L 和 U（像 V），剩 30 个字符：8 个数字 + 22 个字母。
 * 卡片、海报、邀请码三种邀请共用同一个 7 天有效期。
 */
export const INVITE_CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTVWXYZ";
export const INVITE_CODE_LENGTH = 6;
export const INVITE_TTL_DAYS = 7;

/** 卡片和海报里带的 token：16 字节随机数的 base64url，正好 22 个字符 */
export const INVITE_TOKEN_LENGTH = 22;

const DAY_MS = 24 * 60 * 60 * 1000;
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{22}$/;

/**
 * 生成一个邀请码。
 * randomInt(n) 要返回 [0, n) 的均匀随机整数：后端传 crypto.randomInt，测试里可以注入固定值。
 */
export function generateInviteCode(randomInt: (maxExclusive: number) => number): string {
  let code = "";

  for (let index = 0; index < INVITE_CODE_LENGTH; index += 1) {
    code += INVITE_CODE_ALPHABET[randomInt(INVITE_CODE_ALPHABET.length)];
  }

  return code;
}

/**
 * 把用户输入的邀请码整理成标准写法：
 * 全角转半角（中文输入法常打出全角）、去掉空白和横线、转大写。
 * 只整理不校验，校验用 parseInviteCode。
 */
export function normalizeInviteCode(input: string): string {
  return Array.from(input)
    .map((char) => {
      const codePoint = char.codePointAt(0) ?? 0;
      // 全角 ASCII（！到～）和半角正好差 0xFEE0
      return codePoint >= 0xff01 && codePoint <= 0xff5e
        ? String.fromCodePoint(codePoint - 0xfee0)
        : char;
    })
    .join("")
    .replace(/[\s\-_—–]/g, "")
    .toUpperCase();
}

export function isValidInviteCode(code: string): boolean {
  return (
    code.length === INVITE_CODE_LENGTH &&
    Array.from(code).every((char) => INVITE_CODE_ALPHABET.includes(char))
  );
}

/** 用户输入 → 标准邀请码；不像邀请码就返回 null */
export function parseInviteCode(input: string): string | null {
  const code = normalizeInviteCode(input);

  return isValidInviteCode(code) ? code : null;
}

export function isValidInviteToken(token: string): boolean {
  return TOKEN_PATTERN.test(token);
}

/** 从 now 起 7 天后过期 */
export function inviteExpireAt(now: Date): Date {
  return new Date(now.getTime() + INVITE_TTL_DAYS * DAY_MS);
}

/** 到期那一刻起就算过期 */
export function isInviteExpired(expireAt: Date | string, now: Date): boolean {
  return now.getTime() >= new Date(expireAt).getTime();
}

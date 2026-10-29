import { trimText } from "./text";

/** 字母头像的底色有 8 个，三套主题用同一个下标（docs/design/tokens.json 的 avatarMapping） */
export const AVATAR_PALETTE_SIZE = 8;

/**
 * 头像底色下标：按用户 id 稳定地取 0–7。
 * 用 FNV-1a 哈希，前后端、三套主题、每次打开都是同一个颜色。
 */
export function avatarColorIndex(userId: string): number {
  let hash = 0x811c9dc5;

  for (let index = 0; index < userId.length; index += 1) {
    hash ^= userId.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }

  return hash % AVATAR_PALETTE_SIZE;
}

/** 昵称前面常见的称呼前缀：阿杰、小王、老陈、大壮，设计稿的头像上写的是杰、王、陈、壮 */
const NICKNAME_PREFIXES = new Set(["阿", "小", "老", "大"]);

/**
 * 字母头像上的字：取名字的第一个字（emoji 也算一个字）；
 * 第一个字是阿、小、老、大这类称呼前缀、后面还有字时，取第二个字。名字是空的就用「?」。
 */
export function avatarLetter(name: string): string {
  const [first, second] = Array.from(trimText(name));

  if (first && second && NICKNAME_PREFIXES.has(first)) {
    return second;
  }

  return first ?? "?";
}

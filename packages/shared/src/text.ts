/**
 * 按「字」数长度：一个汉字、一个 emoji 都算 1。
 * 界面上「最多 12 个字」说的就是这个，不能用 String.length（emoji 会算成 2）。
 */
export function textLength(text: string): number {
  return Array.from(text).length;
}

/** 去掉首尾空白后的文字（JS 的 \s 已经包含全角空格） */
export function trimText(text: string): string {
  return text.replace(/^\s+|\s+$/g, "");
}

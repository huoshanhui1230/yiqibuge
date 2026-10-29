/** 一个时刻：接口里传的是 ISO 8601 UTC 字符串，代码里多是 Date，两种都收 */
export type Instant = Date | string;

export function toDate(instant: Instant): Date {
  return instant instanceof Date ? instant : new Date(instant);
}

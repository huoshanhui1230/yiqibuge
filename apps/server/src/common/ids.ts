/**
 * 路径里的 id（:id、:userId）转成数字。库里是自增 bigint，接口里一律当字符串传。
 * 不是正整数就返回 null，调用方当「找不到」处理（不暴露格式细节）。
 */
export function parseId(raw: string): number | null {
  if (!/^\d{1,15}$/.test(raw)) {
    return null;
  }

  const id = Number(raw);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

/**
 * uni-app 的 input、textarea 事件把值放在 event.detail.value，
 * 但 vue-tsc 按 HTML 元素给它定的类型是 Event，这里统一取一下。
 */
export function inputValue(event: Event): string {
  const detail = (event as unknown as { detail?: { value?: unknown } }).detail;

  return typeof detail?.value === "string" ? detail.value : "";
}

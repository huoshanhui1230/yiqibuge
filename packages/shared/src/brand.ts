/**
 * 品牌文案的唯一出处。
 *
 * 正式名称见 docs/decisions.md 第 18 条（2026-10-27）：产品叫「一起不鸽」。
 * 设计稿 HTML 和截图里的「一起恰」是历史名称，/design-check 走查时不算差异。
 *
 * 页面标题、小程序名称、通知文案、health 接口返回的 name 都从这里取，不要在别处手写。
 * 以后再改名只动这一个常量。
 */
export const APP_NAME = "一起不鸽";

/** 历史名称。只用于说明「旧资料里的叫法」，不要显示给用户。 */
export const LEGACY_APP_NAME = "一起恰";

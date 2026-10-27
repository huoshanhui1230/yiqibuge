import { fakePlatform } from "./fake";
import type { Platform } from "./types";
import { wechatPlatform } from "./wechat";

/**
 * 按编译目标选实现：微信小程序用真的，其他（H5 预览）用假的。
 * 下面那行 #ifdef 是 uni-app 的条件编译，编译到 H5 时会被去掉。
 */
let platform: Platform = fakePlatform;

// #ifdef MP-WEIXIN
platform = wechatPlatform;
// #endif

export { platform };
export * from "./types";

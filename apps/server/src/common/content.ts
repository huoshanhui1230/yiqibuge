import type { WechatDriver } from "@yiqi/shared";

import type { ContentSecurityPort, TextScene } from "../wechat/ports";
import { Errors } from "./business-error";

/** 文本过内容安全检测，不通过就抛 CONTENT_REJECTED，提示语用检测接口给的中文 */
export async function ensureCleanText(
  security: ContentSecurityPort,
  text: string,
  scene: TextScene,
): Promise<void> {
  const result = await security.checkText(text, scene);

  if (!result.pass) {
    throw Errors.contentRejected(result.reason ?? "里面有不能用的内容，换个说法再试试。");
  }
}

/** 本地联调传图后拿到的地址：/api/v1/dev/files/<文件名>（只在假驱动下存在） */
const DEV_FILE_URL = /^https?:\/\/[^/\s]+\/api\/v1\/dev\/files\/[A-Za-z0-9._-]+$/;

/**
 * 头像、群头像只接受我们自己存的图（docs/decisions.md 第 23 条）：
 * 正式环境是云托管对象存储的 cloud:// 文件 ID；本地联调（假驱动）多认本机后端的地址。
 * 其它外链一律不收，免得库里存进别人家的图。
 */
export function isAllowedImageUrl(url: string, driver: WechatDriver): boolean {
  if (/^cloud:\/\/\S+$/.test(url)) {
    return true;
  }

  return driver === "fake" && DEV_FILE_URL.test(url);
}

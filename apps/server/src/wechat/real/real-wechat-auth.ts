import type { Env } from "../../config/env";
import type { WechatAuthPort, WechatSession } from "../ports/wechat-auth.port";

/** 真登录：调微信的 code2Session。阶段 1 做登录时实现。 */
export class RealWechatAuth implements WechatAuthPort {
  constructor(private readonly env: Env) {}

  code2Session(_code: string): Promise<WechatSession> {
    return Promise.reject(
      new Error(
        `真实的微信登录还没实现（阶段 1 做）。当前 WX_APPID=${this.env.WX_APPID || "(空)"}。` +
          "本地开发请把 WECHAT_DRIVER 设为 fake。",
      ),
    );
  }
}

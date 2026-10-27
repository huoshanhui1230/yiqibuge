export const WECHAT_AUTH = "WECHAT_AUTH";

export interface WechatSession {
  openid: string;
  /** 以后打通小程序和 App 账号要用 */
  unionid?: string;
  sessionKey?: string;
}

/** 登录：用 wx.login 拿到的 code 换 openid。 */
export interface WechatAuthPort {
  code2Session(code: string): Promise<WechatSession>;
}

import type { Env } from "../../config/env";
import type { WechatAuthPort, WechatSession } from "../ports/wechat-auth.port";

/**
 * 假登录。把 code 直接当 openid 用，也认 FAKE_USERS 里的昵称，
 * 所以本地联调和接口测试能自由切换测试用户，不用真的调微信。
 */
export class FakeWechatAuth implements WechatAuthPort {
  constructor(private readonly env: Env) {}

  code2Session(code: string): Promise<WechatSession> {
    const known = this.env.FAKE_USERS.find(
      (user) => user.openid === code || user.nickname === code,
    );

    return Promise.resolve({
      openid: known?.openid ?? code,
      sessionKey: "fake-session-key",
    });
  }
}

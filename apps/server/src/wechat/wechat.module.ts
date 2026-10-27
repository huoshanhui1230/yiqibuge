import { Global, Module } from "@nestjs/common";

import { ENV, type Env } from "../config/env";
import { FakeCloudRunIdentity } from "./fake/fake-cloud-run-identity";
import { FakeContentSecurity } from "./fake/fake-content-security";
import { FakeSubscribeMessage } from "./fake/fake-subscribe-message";
import { FakeWechatAuth } from "./fake/fake-wechat-auth";
import {
  CLOUD_RUN_IDENTITY,
  CONTENT_SECURITY,
  SUBSCRIBE_MESSAGE,
  WECHAT_AUTH,
  type CloudRunIdentityPort,
  type ContentSecurityPort,
  type SubscribeMessagePort,
  type WechatAuthPort,
} from "./ports";
import { RealCloudRunIdentity } from "./real/real-cloud-run-identity";
import { RealContentSecurity } from "./real/real-content-security";
import { RealSubscribeMessage } from "./real/real-subscribe-message";
import { RealWechatAuth } from "./real/real-wechat-auth";

/**
 * 微信能力适配器。业务代码只认 port，不知道背后是真实现还是假实现。
 *
 * WECHAT_DRIVER=fake 用假实现（本地开发、H5 预览、测试），=real 用真实现。
 * 正式环境不许用 fake —— 在 config/env.ts 的启动断言里挡住了，配错直接起不来。
 */
@Global()
@Module({
  providers: [
    {
      provide: WECHAT_AUTH,
      inject: [ENV],
      useFactory: (env: Env): WechatAuthPort =>
        env.WECHAT_DRIVER === "fake" ? new FakeWechatAuth(env) : new RealWechatAuth(env),
    },
    {
      provide: CLOUD_RUN_IDENTITY,
      inject: [ENV],
      useFactory: (env: Env): CloudRunIdentityPort =>
        env.WECHAT_DRIVER === "fake" ? new FakeCloudRunIdentity(env) : new RealCloudRunIdentity(),
    },
    {
      provide: SUBSCRIBE_MESSAGE,
      inject: [ENV],
      useFactory: (env: Env): SubscribeMessagePort =>
        env.WECHAT_DRIVER === "fake" ? new FakeSubscribeMessage() : new RealSubscribeMessage(),
    },
    {
      provide: CONTENT_SECURITY,
      inject: [ENV],
      useFactory: (env: Env): ContentSecurityPort =>
        env.WECHAT_DRIVER === "fake" ? new FakeContentSecurity() : new RealContentSecurity(),
    },
  ],
  exports: [WECHAT_AUTH, CLOUD_RUN_IDENTITY, SUBSCRIBE_MESSAGE, CONTENT_SECURITY],
})
export class WechatModule {}

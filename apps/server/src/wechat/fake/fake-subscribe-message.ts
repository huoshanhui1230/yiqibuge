import { Logger } from "@nestjs/common";

import type { SubscribeMessage, SubscribeMessagePort } from "../ports/subscribe-message.port";

/** 假订阅消息：只记一行日志，方便本地确认通知有没有按预期触发。 */
export class FakeSubscribeMessage implements SubscribeMessagePort {
  private readonly logger = new Logger(FakeSubscribeMessage.name);

  send(message: SubscribeMessage): Promise<void> {
    this.logger.log(
      `[假订阅消息] 发给 ${message.openid}，模板 ${message.templateId}，` +
        `内容 ${JSON.stringify(message.data)}`,
    );

    return Promise.resolve();
  }
}

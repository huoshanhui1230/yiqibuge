import type { SubscribeMessage, SubscribeMessagePort } from "../ports/subscribe-message.port";

/** 真订阅消息下发。阶段 3 做通知时实现，模板 ID 从 WX_SUBSCRIBE_TEMPLATE_IDS 来。 */
export class RealSubscribeMessage implements SubscribeMessagePort {
  send(_message: SubscribeMessage): Promise<void> {
    return Promise.reject(
      new Error("真实的订阅消息下发还没实现（阶段 3 做）。本地开发请把 WECHAT_DRIVER 设为 fake。"),
    );
  }
}

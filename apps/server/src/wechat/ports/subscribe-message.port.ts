export const SUBSCRIBE_MESSAGE = "SUBSCRIBE_MESSAGE";

export interface SubscribeMessage {
  openid: string;
  templateId: string;
  /** 点开通知落到哪个页面 */
  page?: string;
  data: Record<string, { value: string }>;
}

/**
 * 订阅消息下发。
 * 额度按「用户 × 模板」记，额度紧张时的优先级见 docs/spec.md「订阅消息额度策略」，
 * 这些逻辑在阶段 3 做，这个 port 只负责「把一条消息发出去」。
 */
export interface SubscribeMessagePort {
  send(message: SubscribeMessage): Promise<void>;
}

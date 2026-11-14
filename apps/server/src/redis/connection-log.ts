import type { Logger } from "@nestjs/common";

/** 同一条错误多久内只记一次。Redis 一直不通时，大约每 10 分钟再提醒一次。 */
export const REPEAT_ERROR_AFTER_MS = 10 * 60 * 1000;

export interface ConnectionLog {
  error(error: Error): void;
  ready(): void;
}

/**
 * Redis 连不上时，ioredis 和 BullMQ 每次重连都会报一次错；不挂 error 监听的话，
 * 它们会把整段错误打到控制台（REDIS_URL 填占位值时实测每分钟上百行，决定第 29 条）。
 * 这里把同一条错误压成一行，隔一段时间再提醒；重新连上时记一行。
 * 是哪个连接看日志的 context（Redis、Queue）。
 */
export function createConnectionLog(logger: Pick<Logger, "warn" | "log">): ConnectionLog {
  let lastMessage: string | undefined;
  let lastAt = 0;

  return {
    error(error) {
      const now = Date.now();
      if (error.message === lastMessage && now - lastAt < REPEAT_ERROR_AFTER_MS) {
        return;
      }
      lastMessage = error.message;
      lastAt = now;
      logger.warn(`Redis 报错：${error.message}。断线会在后台自动重连，恢复后会再提示。`);
    },
    ready() {
      if (lastMessage === undefined) {
        return;
      }
      lastMessage = undefined;
      logger.log("Redis 重新连上了。");
    },
  };
}

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createConnectionLog, REPEAT_ERROR_AFTER_MS } from "./connection-log";

const refused = () => new Error("connect ECONNREFUSED 127.0.0.1:6379");

describe("createConnectionLog", () => {
  const logger = { warn: vi.fn(), log: vi.fn() };

  beforeEach(() => {
    vi.useFakeTimers();
    logger.warn.mockClear();
    logger.log.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("一直重连失败时，同一条错误只记一次", () => {
    const log = createConnectionLog(logger);

    for (let i = 0; i < 30; i += 1) {
      log.error(refused());
      vi.advanceTimersByTime(2000);
    }

    expect(logger.warn).toHaveBeenCalledTimes(1);
    expect(logger.warn.mock.calls[0]?.[0]).toContain("ECONNREFUSED");
  });

  it("错误换了就再记一次", () => {
    const log = createConnectionLog(logger);

    log.error(refused());
    log.error(new Error("getaddrinfo ENOTFOUND redis.internal"));

    expect(logger.warn).toHaveBeenCalledTimes(2);
  });

  it("一直不通时，隔一段时间再提醒一次", () => {
    const log = createConnectionLog(logger);

    log.error(refused());
    vi.advanceTimersByTime(REPEAT_ERROR_AFTER_MS - 1);
    log.error(refused());
    expect(logger.warn).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(1);
    log.error(refused());
    expect(logger.warn).toHaveBeenCalledTimes(2);
  });

  it("出过错再连上时记一行恢复；之后再断开会重新记", () => {
    const log = createConnectionLog(logger);

    log.error(refused());
    log.ready();
    log.ready();
    expect(logger.log).toHaveBeenCalledTimes(1);

    log.error(refused());
    expect(logger.warn).toHaveBeenCalledTimes(2);
  });

  it("没出过错时连上不记日志", () => {
    const log = createConnectionLog(logger);

    log.ready();

    expect(logger.log).not.toHaveBeenCalled();
    expect(logger.warn).not.toHaveBeenCalled();
  });
});

import { Test } from "@nestjs/testing";
import { APP_NAME } from "@yiqi/shared";
import { describe, expect, it } from "vitest";

import { ENV } from "../config/env";
import { DB } from "../db/db.module";
import { REDIS } from "../redis/redis.module";
import { HealthService } from "./health.service";

const env = { APP_ROLE: "web", WECHAT_DRIVER: "fake" };

/** 假的 drizzle：只需要支持 select().from().limit() 这一条链 */
function db(result: Promise<unknown>) {
  return { select: () => ({ from: () => ({ limit: () => result }) }) };
}

function redis(result: Promise<string>) {
  return { ping: () => result };
}

/**
 * 用 Nest 的 TestingModule 建服务，而不是直接 new：
 * 这样顺便验证 Vitest + SWC 下 emitDecoratorMetadata 生效、依赖注入能解析。
 */
async function buildService(dbResult: Promise<unknown>, redisResult: Promise<string>) {
  const moduleRef = await Test.createTestingModule({
    providers: [
      HealthService,
      { provide: ENV, useValue: env },
      { provide: DB, useValue: db(dbResult) },
      { provide: REDIS, useValue: redis(redisResult) },
    ],
  }).compile();

  return moduleRef.get(HealthService);
}

describe("HealthService", () => {
  it("两个依赖都正常时 ok 为 true，并带上应用名称", async () => {
    const service = await buildService(Promise.resolve([]), Promise.resolve("PONG"));
    const result = await service.check();

    expect(result.ok).toBe(true);
    expect(result.name).toBe(APP_NAME);
    expect(result.role).toBe("web");
    expect(result.deps).toEqual({ db: "up", redis: "up" });
    expect(result.wechatDriver).toBe("fake");
  });

  it("serverTime 是 UTC 的 ISO 时间", async () => {
    const service = await buildService(Promise.resolve([]), Promise.resolve("PONG"));
    const { serverTime } = await service.check();

    expect(serverTime).toMatch(/Z$/);
    expect(new Date(serverTime).toISOString()).toBe(serverTime);
  });

  it("数据库连不上时 ok 为 false，Redis 仍然报 up", async () => {
    const service = await buildService(
      Promise.reject(new Error("表不存在，迁移没跑")),
      Promise.resolve("PONG"),
    );
    const result = await service.check();

    expect(result.ok).toBe(false);
    expect(result.deps).toEqual({ db: "down", redis: "up" });
  });

  it("Redis 连不上时 ok 为 false", async () => {
    const service = await buildService(Promise.resolve([]), Promise.reject(new Error("连不上")));
    const result = await service.check();

    expect(result.ok).toBe(false);
    expect(result.deps).toEqual({ db: "up", redis: "down" });
  });
});

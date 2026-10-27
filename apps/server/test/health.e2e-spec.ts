import { ValidationPipe, type INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { APP_NAME, type HealthResult } from "@yiqi/shared";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { AppModule } from "../src/app.module";
import { AllExceptionsFilter } from "../src/common/all-exceptions.filter";
import { ENV, type Env } from "../src/config/env";

/**
 * 接口测试：打真的 HTTP，连真的 MySQL 和 Redis。
 * 跑之前要先 pnpm dev:db 起容器、pnpm migrate 建表。
 */
describe("GET /api/v1/health", () => {
  let app: INestApplication;
  let prefix: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule.forRole("web")],
    }).compile();

    app = moduleRef.createNestApplication();

    // 和 main.ts 保持一致，不然测的就不是线上那套
    const env = app.get<Env>(ENV);
    prefix = env.API_PREFIX;
    app.setGlobalPrefix(prefix);
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalFilters(new AllExceptionsFilter());

    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  it("返回 ok、应用名称、依赖状态和 UTC 时间", async () => {
    const response = await request(app.getHttpServer()).get(`${prefix}/health`).expect(200);
    const body = response.body as HealthResult;

    expect(body.ok).toBe(true);
    expect(body.name).toBe(APP_NAME);
    expect(body.role).toBe("web");
    expect(body.deps).toEqual({ db: "up", redis: "up" });
    expect(body.wechatDriver).toBe("fake");
    // 时间一律 UTC
    expect(body.serverTime).toMatch(/Z$/);
  });

  it("不存在的路径返回统一的中文错误格式", async () => {
    const response = await request(app.getHttpServer())
      .get(`${prefix}/不存在的路径`)
      .set("x-request-id", "req-测试-1")
      .expect(404);

    expect(response.body).toMatchObject({
      code: "NOT_FOUND",
      requestId: "req-测试-1",
    });
    expect(typeof (response.body as { message: unknown }).message).toBe("string");
  });
});

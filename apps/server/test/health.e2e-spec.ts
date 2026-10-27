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
    // request_id 只能是 ASCII：HTTP 头的值不允许非 Latin-1 字符，Node 会直接拒发。
    // 小程序端的 newRequestId() 生成的是 base36，天然符合。
    const response = await request(app.getHttpServer())
      .get(`${prefix}/no-such-path`)
      .set("x-request-id", "req-test-1")
      .expect(404);

    expect(response.body).toMatchObject({
      code: "NOT_FOUND",
      requestId: "req-test-1",
    });
    // message 一律中文，能直接显示给用户（NestJS 自带的英文文案会被换掉）
    expect((response.body as { message: string }).message).toBe("找不到要看的内容。");
  });
});

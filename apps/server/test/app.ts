import { ValidationPipe, type INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { sql } from "drizzle-orm";
import request from "supertest";

import { AppModule } from "../src/app.module";
import { AllExceptionsFilter } from "../src/common/all-exceptions.filter";
import { ENV, type Env } from "../src/config/env";
import { DB, type Db } from "../src/db/db.module";
import { FAKE_OPENID_HEADER } from "../src/wechat/fake/fake-cloud-run-identity";

export interface TestApp {
  app: INestApplication;
  db: Db;
  prefix: string;
}

/** 和 main.ts 同一套装配（前缀、校验、错误格式），测的才是线上那套 */
export async function createTestApp(): Promise<TestApp> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule.forRole("web")],
  }).compile();

  const app = moduleRef.createNestApplication();
  const env = app.get<Env>(ENV);

  app.setGlobalPrefix(env.API_PREFIX);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new AllExceptionsFilter());
  await app.init();

  return { app, db: app.get<Db>(DB), prefix: env.API_PREFIX };
}

/** 业务表清空（只在 _test 库上跑，见 test-db.ts） */
export async function resetDb(db: Db): Promise<void> {
  const [rows] = (await db.execute(sql`SELECT DATABASE() AS name`)) as unknown as [
    { name: string }[],
  ];
  if (!rows[0]?.name.endsWith("_test")) {
    throw new Error(`拒绝清表：当前库是 ${rows[0]?.name}，不是测试库`);
  }

  for (const table of ["circle_join_request", "circle_member", "circle", "app_user"]) {
    await db.execute(sql.raw(`TRUNCATE TABLE \`${table}\``));
  }
}

/**
 * 以某个测试用户的身份发请求：假驱动按 X-Fake-Openid 认人（docs/decisions.md 第 22 条）。
 * 用法：client.as("e2e_owner").get("/circles")
 */
export function client({ app, prefix }: TestApp) {
  const server = app.getHttpServer();
  const withUser = (openid: string) => {
    const set = (test: request.Test) => test.set(FAKE_OPENID_HEADER, openid);
    return {
      get: (path: string) => set(request(server).get(`${prefix}${path}`)),
      post: (path: string, body?: object) =>
        set(request(server).post(`${prefix}${path}`)).send(body ?? {}),
      put: (path: string, body?: object) =>
        set(request(server).put(`${prefix}${path}`)).send(body ?? {}),
      delete: (path: string) => set(request(server).delete(`${prefix}${path}`)),
      /** multipart 传一个文件，字段名 file */
      upload: (path: string, file: Buffer, filename: string, contentType: string) =>
        set(request(server).post(`${prefix}${path}`)).attach("file", file, {
          filename,
          contentType,
        }),
    };
  };

  return { as: withUser };
}

export type Client = ReturnType<typeof client>;

/** 登录并填好昵称，返回用户 id */
export async function signUp(api: Client, openid: string, nickname: string): Promise<string> {
  const login = await api
    .as(openid)
    .post("/auth/wechat", { timezone: "Asia/Shanghai" })
    .expect(200);
  await api.as(openid).put("/me/profile", { nickname }).expect(200);
  return (login.body as { user: { id: string } }).user.id;
}

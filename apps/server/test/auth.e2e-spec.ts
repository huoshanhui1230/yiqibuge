import type { AuthResult, MeDto } from "@yiqi/shared";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { client, createTestApp, resetDb, type Client, type TestApp } from "./app";

/**
 * 登录和我的资料（docs/decisions.md 第 22 条：身份是云托管注入的 openid，后端不发 token；
 * 本地用 X-Fake-Openid 头切测试用户）。
 */
describe("登录和我的资料", () => {
  let t: TestApp;
  let api: Client;

  beforeAll(async () => {
    t = await createTestApp();
    api = client(t);
  });

  afterAll(async () => {
    await t?.app.close();
  });

  beforeEach(async () => {
    await resetDb(t.db);
  });

  it("第一次登录建用户，再登录还是同一个人（幂等）", async () => {
    const first = await api
      .as("e2e_a")
      .post("/auth/wechat", { timezone: "Australia/Sydney" })
      .expect(200);
    const again = await api.as("e2e_a").post("/auth/wechat", {}).expect(200);
    const a = first.body as AuthResult;
    const b = again.body as AuthResult;

    expect(a.isNew).toBe(true);
    expect(b.isNew).toBe(false);
    expect(b.user.id).toBe(a.user.id);
    expect(a.user).toMatchObject({
      nickname: null,
      profileCompleted: false,
      theme: "sticker",
      timezone: "Australia/Sydney",
    });
  });

  it("两个请求同时登录，只建出一个用户", async () => {
    const [x, y] = await Promise.all([
      api.as("e2e_race").post("/auth/wechat", {}),
      api.as("e2e_race").post("/auth/wechat", {}),
    ]);

    expect((x.body as AuthResult).user.id).toBe((y.body as AuthResult).user.id);
  });

  it("认不出的时区不存", async () => {
    const res = await api
      .as("e2e_a")
      .post("/auth/wechat", { timezone: "Mars/Olympus" })
      .expect(200);

    expect((res.body as AuthResult).user.timezone).toBeNull();
  });

  it("没建用户就调别的接口：401 NOT_LOGGED_IN，中文提示", async () => {
    const res = await api.as("e2e_nobody").get("/me").expect(401);

    expect(res.body).toMatchObject({ code: "NOT_LOGGED_IN", message: "还没登录，先登录一下。" });
  });

  it("填昵称和头像后算填好资料", async () => {
    await api.as("e2e_a").post("/auth/wechat", {}).expect(200);
    const res = await api
      .as("e2e_a")
      .put("/me/profile", { nickname: " 阿杰 ", avatarUrl: "cloud://env-1/avatar/1.jpg" })
      .expect(200);
    const me = res.body as MeDto;

    expect(me).toMatchObject({
      nickname: "阿杰",
      avatarUrl: "cloud://env-1/avatar/1.jpg",
      profileCompleted: true,
    });
  });

  it("昵称为空、超过 12 个字都不行，提示是中文", async () => {
    await api.as("e2e_a").post("/auth/wechat", {}).expect(200);

    const empty = await api.as("e2e_a").put("/me/profile", { nickname: "  " }).expect(400);
    const long = await api
      .as("e2e_a")
      .put("/me/profile", { nickname: "一二三四五六七八九十一二三" })
      .expect(400);

    expect((empty.body as { message: string }).message).toBe("昵称不能为空");
    expect((long.body as { message: string }).message).toBe("昵称最多 12 个字");
  });

  it("昵称过内容安全检测，不通过返回 CONTENT_REJECTED", async () => {
    await api.as("e2e_a").post("/auth/wechat", {}).expect(200);
    const res = await api.as("e2e_a").put("/me/profile", { nickname: "测试敏感词" }).expect(400);

    expect(res.body).toMatchObject({ code: "CONTENT_REJECTED" });
    expect((res.body as { message: string }).message).toContain("昵称");
  });

  it("头像只收 cloud:// 和本地联调地址，别的外链不收", async () => {
    await api.as("e2e_a").post("/auth/wechat", {}).expect(200);

    await api
      .as("e2e_a")
      .put("/me/profile", { nickname: "阿杰", avatarUrl: "https://evil.example.com/a.png" })
      .expect(400);
    await api
      .as("e2e_a")
      .put("/me/profile", {
        nickname: "阿杰",
        avatarUrl: "http://localhost:3000/api/v1/dev/files/1-abc.png",
      })
      .expect(200);
  });

  it("主题保存到用户设置，再登录还是它", async () => {
    await api.as("e2e_a").post("/auth/wechat", {}).expect(200);
    await api.as("e2e_a").put("/me/settings", { theme: "cute" }).expect(200);
    const again = await api.as("e2e_a").post("/auth/wechat", {}).expect(200);

    expect((again.body as AuthResult).user.theme).toBe("cute");
  });

  it("没有的主题不收", async () => {
    await api.as("e2e_a").post("/auth/wechat", {}).expect(200);
    const res = await api.as("e2e_a").put("/me/settings", { theme: "dark" }).expect(400);

    expect((res.body as { message: string }).message).toBe("没有这套主题。");
  });

  it("本地联调传图：传上去拿到地址，地址不带登录也打得开", async () => {
    await api.as("e2e_a").post("/auth/wechat", {}).expect(200);
    // 最小的 1×1 PNG
    const png = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
      "base64",
    );
    const upload = await api
      .as("e2e_a")
      .upload("/dev/uploads", png, "a.png", "image/png")
      .expect(200);
    const url = (upload.body as { url: string }).url;

    expect(url).toMatch(/\/api\/v1\/dev\/files\/[\w.-]+\.png$/);
    await api
      .as("e2e_nobody")
      .get(url.replace(/^https?:\/\/[^/]+\/api\/v1/, ""))
      .expect(200);
  });
});

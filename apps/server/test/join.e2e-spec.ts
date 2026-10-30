import {
  INVITE_CODE_ALPHABET,
  MAX_MEMBERS,
  type CircleDetailDto,
  type InviteDto,
  type InvitePreviewDto,
  type JoinResult,
  type MembersResult,
} from "@yiqi/shared";
import { eq, like } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { appUser, circle, circleMember } from "../src/db/schema";
import { client, createTestApp, resetDb, signUp, type Client, type TestApp } from "./app";

const DAY = 24 * 60 * 60 * 1000;

/** 邀请、落地页、加入、审核（docs/spec.md「邀请与加入」，决定第 26 条） */
describe("群组：邀请和加入", () => {
  let t: TestApp;
  let api: Client;
  let circleId: string;

  beforeAll(async () => {
    t = await createTestApp();
    api = client(t);
  });

  afterAll(async () => {
    await t?.app.close();
  });

  beforeEach(async () => {
    await resetDb(t.db);
    await signUp(api, "e2e_owner", "阿杰");
    await signUp(api, "e2e_b", "小红");
    await signUp(api, "e2e_c", "阿强");
    const res = await api
      .as("e2e_owner")
      .post("/circles", {
        name: "大学室友",
        type: "classmates",
        avatar: "preset:dorm",
        timezone: "Asia/Shanghai",
      })
      .expect(201);
    circleId = (res.body as CircleDetailDto).id;
  });

  async function invite(openid = "e2e_owner"): Promise<InviteDto> {
    const res = await api.as(openid).post(`/circles/${circleId}/invites`).expect(200);
    return res.body as InviteDto;
  }

  async function expireInvite(): Promise<void> {
    await t.db
      .update(circle)
      .set({ inviteExpireAt: new Date(Date.now() - 1000) })
      .where(eq(circle.id, Number(circleId)));
  }

  it("取邀请：22 位 token、6 位邀请码、7 天后过期，分享标题和路径带上邀请人", async () => {
    const before = Date.now();
    const got = await invite();

    expect(got.token).toMatch(/^[A-Za-z0-9_-]{22}$/);
    expect(got.code).toHaveLength(6);
    for (const char of got.code) expect(INVITE_CODE_ALPHABET).toContain(char);
    const expire = new Date(got.expireAt).getTime();
    expect(expire - before).toBeGreaterThan(7 * DAY - 5000);
    expect(expire - before).toBeLessThan(7 * DAY + 5000);
    expect(got.shareTitle).toBe("阿杰邀请你加入「大学室友」");
    expect(got.sharePath).toMatch(new RegExp(`^/pages/join/index\\?t=${got.token}&from=\\d+$`));
  });

  it("有效期内再取还是同一个；过期了再打开邀请页自动换新", async () => {
    const first = await invite();
    const second = await invite();
    expect(second).toMatchObject({ token: first.token, code: first.code });

    await expireInvite();
    const renewed = await invite();
    expect(renewed.token).not.toBe(first.token);
    expect(renewed.code).not.toBe(first.code);
  });

  it("开了「仅群主可邀请」，成员拿不到邀请", async () => {
    const got = await invite();
    await api.as("e2e_b").post("/circles/join", { code: got.code }).expect(200);
    await api.as("e2e_owner").put(`/circles/${circleId}`, { inviteOwnerOnly: true }).expect(200);

    const res = await api.as("e2e_b").post(`/circles/${circleId}/invites`).expect(403);
    expect(res.body).toMatchObject({ code: "INVITE_NOT_ALLOWED" });
  });

  it("用邀请码加入：小写、全角、带空格都认；再加一次是「已经在群里」", async () => {
    const got = await invite();
    const fullWidth = Array.from(got.code.toLowerCase())
      .map((char) => String.fromCodePoint((char.codePointAt(0) ?? 0) + 0xfee0))
      .join("");

    const joined = await api
      .as("e2e_b")
      .post("/circles/join", { code: ` ${fullWidth} ` })
      .expect(200);
    const again = await api.as("e2e_b").post("/circles/join", { code: got.code }).expect(200);

    expect(joined.body as JoinResult).toEqual({ status: "joined", circleId });
    expect(again.body as JoinResult).toEqual({ status: "already", circleId });

    const detail = await api.as("e2e_b").get(`/circles/${circleId}`).expect(200);
    expect(detail.body as CircleDetailDto).toMatchObject({ myRole: "member", memberCount: 2 });
  });

  it("用卡片 token 加入", async () => {
    const got = await invite();
    const res = await api.as("e2e_b").post("/circles/join", { t: got.token }).expect(200);

    expect((res.body as JoinResult).status).toBe("joined");
  });

  it("邀请码不对、过期都加不进去，提示是中文", async () => {
    const got = await invite();

    const wrong = await api.as("e2e_b").post("/circles/join", { code: "ZZZZZZ" }).expect(404);
    expect(wrong.body).toMatchObject({ code: "INVITE_INVALID" });
    await api.as("e2e_b").post("/circles/join", {}).expect(404);

    await expireInvite();
    const expired = await api.as("e2e_b").post("/circles/join", { code: got.code }).expect(410);
    expect(expired.body).toMatchObject({
      code: "INVITE_EXPIRED",
      message: "邀请过期了，找群友再发一次。",
    });
  });

  it("落地页预览：不在群里的人能看到群名、人数和成员头像，发卡人显示在上面", async () => {
    const got = await invite();
    const ownerId = /from=(\d+)/.exec(got.sharePath)?.[1];

    // 没注册过的人（落地页不用登录）
    const res = await api
      .as("e2e_stranger")
      .get(`/invites/preview?t=${got.token}&from=${ownerId}`)
      .expect(200);
    const preview = res.body as InvitePreviewDto;

    expect(preview.status).toBe("ok");
    expect(preview.circle).toMatchObject({ name: "大学室友", memberCount: 1, type: "classmates" });
    expect(preview.circle?.members.map((m) => m.name)).toEqual(["阿杰"]);
    expect(preview.inviter?.name).toBe("阿杰");
    expect(preview.upcomingPlans).toEqual([]);
  });

  it("落地页状态：不存在、过期、已经在群里", async () => {
    const got = await invite();

    const invalid = await api.as("e2e_stranger").get("/invites/preview?code=ZZZZZZ").expect(200);
    expect(invalid.body).toMatchObject({ status: "invalid", circle: null });

    const member = await api.as("e2e_owner").get(`/invites/preview?code=${got.code}`).expect(200);
    expect((member.body as InvitePreviewDto).status).toBe("member");

    await expireInvite();
    const expired = await api
      .as("e2e_stranger")
      .get(`/invites/preview?code=${got.code}`)
      .expect(200);
    expect((expired.body as InvitePreviewDto).status).toBe("expired");
  });

  it("开了「加入需群主同意」：先进申请，群主同意后才在群里；成员看不到申请", async () => {
    const got = await invite();
    await api.as("e2e_c").post("/circles/join", { code: got.code }).expect(200);
    await api.as("e2e_owner").put(`/circles/${circleId}`, { needApproval: true }).expect(200);

    const pending = await api.as("e2e_b").post("/circles/join", { code: got.code }).expect(200);
    expect((pending.body as JoinResult).status).toBe("pending");

    const preview = await api.as("e2e_b").get(`/invites/preview?code=${got.code}`).expect(200);
    expect((preview.body as InvitePreviewDto).status).toBe("pending");
    await api.as("e2e_b").get(`/circles/${circleId}`).expect(404);

    const ownerView = await api.as("e2e_owner").get(`/circles/${circleId}/members`).expect(200);
    const memberView = await api.as("e2e_c").get(`/circles/${circleId}/members`).expect(200);
    const requests = (ownerView.body as MembersResult).pending;
    expect(requests.map((r) => r.user.name)).toEqual(["小红"]);
    expect((memberView.body as MembersResult).pending).toEqual([]);

    const detail = await api.as("e2e_owner").get(`/circles/${circleId}`).expect(200);
    expect((detail.body as CircleDetailDto).pendingCount).toBe(1);

    await api
      .as("e2e_c")
      .post(`/circles/${circleId}/requests/${requests[0]?.user.id}/approve`)
      .expect(403);
    await api
      .as("e2e_owner")
      .post(`/circles/${circleId}/requests/${requests[0]?.user.id}/approve`)
      .expect(200);
    await api.as("e2e_b").get(`/circles/${circleId}`).expect(200);

    // 同一条申请处理过了，再点一次提示已处理
    const twice = await api
      .as("e2e_owner")
      .post(`/circles/${circleId}/requests/${requests[0]?.user.id}/approve`)
      .expect(409);
    expect(twice.body).toMatchObject({ code: "REQUEST_NOT_FOUND" });
  });

  it("群主拒绝申请：还是进不了群，可以再申请", async () => {
    const got = await invite();
    await api.as("e2e_owner").put(`/circles/${circleId}`, { needApproval: true }).expect(200);
    await api.as("e2e_b").post("/circles/join", { code: got.code }).expect(200);
    const ownerView = await api.as("e2e_owner").get(`/circles/${circleId}/members`).expect(200);
    const userId = (ownerView.body as MembersResult).pending[0]?.user.id;

    await api.as("e2e_owner").post(`/circles/${circleId}/requests/${userId}/reject`).expect(200);
    await api.as("e2e_b").get(`/circles/${circleId}`).expect(404);

    const again = await api.as("e2e_b").post("/circles/join", { code: got.code }).expect(200);
    expect((again.body as JoinResult).status).toBe("pending");
  });

  it("被移出的人再用邀请加入，一律要群主同意（没开审核也一样）", async () => {
    const got = await invite();
    await api.as("e2e_b").post("/circles/join", { code: got.code }).expect(200);
    const members = await api.as("e2e_owner").get(`/circles/${circleId}/members`).expect(200);
    const bId = (members.body as MembersResult).members.find((m) => m.user.name === "小红")?.user
      .id;

    await api.as("e2e_owner").delete(`/circles/${circleId}/members/${bId}`).expect(200);
    const rejoin = await api.as("e2e_b").post("/circles/join", { code: got.code }).expect(200);

    expect((rejoin.body as JoinResult).status).toBe("pending");
  });

  it("主动退群的人再加入不用审核", async () => {
    const got = await invite();
    await api.as("e2e_b").post("/circles/join", { code: got.code }).expect(200);
    await api.as("e2e_b").post(`/circles/${circleId}/leave`).expect(204);

    const rejoin = await api.as("e2e_b").post("/circles/join", { code: got.code }).expect(200);
    expect((rejoin.body as JoinResult).status).toBe("joined");
  });

  describe("群满 100 人", () => {
    /** 直接往库里塞人，凑到 count 个成员（含群主） */
    async function fillTo(count: number): Promise<void> {
      const now = new Date();
      const users = Array.from({ length: count - 1 }, (_, i) => ({
        openid: `e2e_filler_${i}`,
        createdAt: now,
        updatedAt: now,
      }));
      await t.db.insert(appUser).values(users);
      const fillers = await t.db
        .select({ id: appUser.id })
        .from(appUser)
        .where(like(appUser.openid, "e2e_filler_%"));
      const fillerIds = fillers.map((row) => row.id);
      await t.db.insert(circleMember).values(
        fillerIds.map((userId) => ({
          circleId: Number(circleId),
          userId,
          role: "member" as const,
          status: "active" as const,
          joinedAt: now,
        })),
      );
    }

    it("满了就加不进去，落地页提示已满", async () => {
      const got = await invite();
      await fillTo(MAX_MEMBERS);

      const res = await api.as("e2e_b").post("/circles/join", { code: got.code }).expect(409);
      expect(res.body).toMatchObject({
        code: "CIRCLE_FULL",
        message: "群已经满 100 人了，加不进去。",
      });

      const preview = await api.as("e2e_b").get(`/invites/preview?code=${got.code}`).expect(200);
      expect((preview.body as InvitePreviewDto).status).toBe("full");
    });

    it("还差 1 个位置时两个人同时加入，只进得去一个（加锁）", async () => {
      const got = await invite();
      await fillTo(MAX_MEMBERS - 1);

      const [x, y] = await Promise.all([
        api.as("e2e_b").post("/circles/join", { code: got.code }),
        api.as("e2e_c").post("/circles/join", { code: got.code }),
      ]);

      expect([x.status, y.status].sort()).toEqual([200, 409]);
      const detail = await api.as("e2e_owner").get(`/circles/${circleId}`).expect(200);
      expect((detail.body as CircleDetailDto).memberCount).toBe(MAX_MEMBERS);
    });
  });

  it("群解散后：加不进去，原成员打开显示已解散，列表里没了", async () => {
    const got = await invite();
    await api.as("e2e_b").post("/circles/join", { code: got.code }).expect(200);
    await api.as("e2e_owner").post(`/circles/${circleId}/dissolve`).expect(204);

    const join = await api.as("e2e_c").post("/circles/join", { code: got.code }).expect(410);
    expect(join.body).toMatchObject({ code: "CIRCLE_DISSOLVED" });

    const view = await api.as("e2e_b").get(`/circles/${circleId}`).expect(410);
    expect(view.body).toMatchObject({ code: "CIRCLE_DISSOLVED", message: "这个群已经解散了。" });

    const list = await api.as("e2e_b").get("/circles").expect(200);
    expect(list.body).toEqual([]);

    const preview = await api.as("e2e_c").get(`/invites/preview?code=${got.code}`).expect(200);
    expect((preview.body as InvitePreviewDto).status).toBe("dissolved");
  });
});

import type { CircleDetailDto, InviteDto, LeavePreviewDto, MembersResult } from "@yiqi/shared";
import { and, eq } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { circle, circleMember } from "../src/db/schema";
import { client, createTestApp, resetDb, signUp, type Client, type TestApp } from "./app";

/** 退群、移除、转让、解散（docs/spec.md「退出、移除与解散」，决定第 26 条） */
describe("群组：退群、移除、转让、解散", () => {
  let t: TestApp;
  let api: Client;
  let circleId: string;
  let bId: string;

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
    bId = await signUp(api, "e2e_b", "小红");
    await signUp(api, "e2e_c", "阿强");

    const created = await api
      .as("e2e_owner")
      .post("/circles", {
        name: "大学室友",
        type: "classmates",
        avatar: "preset:dorm",
        timezone: "Asia/Shanghai",
      })
      .expect(201);
    circleId = (created.body as CircleDetailDto).id;

    const invite = await api.as("e2e_owner").post(`/circles/${circleId}/invites`).expect(200);
    const { code } = invite.body as InviteDto;
    await api.as("e2e_b").post("/circles/join", { code }).expect(200);
  });

  it("成员退群：退了就看不到这个群了", async () => {
    const preview = await api.as("e2e_b").get(`/circles/${circleId}/leave-preview`).expect(200);
    expect(preview.body as LeavePreviewDto).toEqual({
      blocker: null,
      flakePlans: [],
      exitPlans: [],
    });

    await api.as("e2e_b").post(`/circles/${circleId}/leave`).expect(204);

    await api.as("e2e_b").get(`/circles/${circleId}`).expect(404);
    expect((await api.as("e2e_b").get("/circles").expect(200)).body).toEqual([]);
    const members = await api.as("e2e_owner").get(`/circles/${circleId}/members`).expect(200);
    expect((members.body as MembersResult).members.map((m) => m.user.name)).toEqual(["阿杰"]);
  });

  it("群主不能直接退：群里还有人要先转让", async () => {
    const preview = await api.as("e2e_owner").get(`/circles/${circleId}/leave-preview`).expect(200);
    expect((preview.body as LeavePreviewDto).blocker).toBe("OWNER_MUST_TRANSFER");

    const res = await api.as("e2e_owner").post(`/circles/${circleId}/leave`).expect(409);
    expect(res.body).toMatchObject({
      code: "OWNER_MUST_TRANSFER",
      message: "群主要先把群主转给别人，才能退群。",
    });
  });

  it("群里只剩群主一个人：只能解散", async () => {
    await api.as("e2e_b").post(`/circles/${circleId}/leave`).expect(204);

    const preview = await api.as("e2e_owner").get(`/circles/${circleId}/leave-preview`).expect(200);
    expect((preview.body as LeavePreviewDto).blocker).toBe("OWNER_ALONE");
    const res = await api.as("e2e_owner").post(`/circles/${circleId}/leave`).expect(409);
    expect(res.body).toMatchObject({ code: "OWNER_ALONE" });
  });

  it("群主移出成员", async () => {
    const res = await api.as("e2e_owner").delete(`/circles/${circleId}/members/${bId}`).expect(200);

    expect((res.body as MembersResult).members.map((m) => m.user.name)).toEqual(["阿杰"]);
    await api.as("e2e_b").get(`/circles/${circleId}`).expect(404);
  });

  it("移出的限制：成员不能移人，群主不能移自己，不在群里的移不了", async () => {
    const ownerMembers = await api.as("e2e_owner").get(`/circles/${circleId}/members`).expect(200);
    const ownerId = (ownerMembers.body as MembersResult).members.find((m) => m.role === "owner")
      ?.user.id;

    const byMember = await api
      .as("e2e_b")
      .delete(`/circles/${circleId}/members/${ownerId}`)
      .expect(403);
    expect(byMember.body).toMatchObject({ code: "NOT_CIRCLE_OWNER" });

    const self = await api
      .as("e2e_owner")
      .delete(`/circles/${circleId}/members/${ownerId}`)
      .expect(400);
    expect(self.body).toMatchObject({ code: "TARGET_IS_SELF" });

    // 路径里给自己的 id 前面补 0，也还是自己：群主不能借此把自己移出群
    const padded = await api
      .as("e2e_owner")
      .delete(`/circles/${circleId}/members/0${ownerId}`)
      .expect(400);
    expect(padded.body).toMatchObject({ code: "TARGET_IS_SELF" });
    const after = await api.as("e2e_owner").get(`/circles/${circleId}`).expect(200);
    expect((after.body as CircleDetailDto).myRole).toBe("owner");

    await api.as("e2e_b").post(`/circles/${circleId}/leave`).expect(204);
    const gone = await api
      .as("e2e_owner")
      .delete(`/circles/${circleId}/members/${bId}`)
      .expect(409);
    expect(gone.body).toMatchObject({ code: "TARGET_NOT_MEMBER", message: "对方已经不在群里了。" });
  });

  it("转让群主：对方变群主，原群主变成员，之后可以退群", async () => {
    const res = await api
      .as("e2e_owner")
      .post(`/circles/${circleId}/transfer`, { toUserId: bId })
      .expect(200);
    expect((res.body as CircleDetailDto).myRole).toBe("member");

    const asB = await api.as("e2e_b").get(`/circles/${circleId}`).expect(200);
    expect(asB.body as CircleDetailDto).toMatchObject({ myRole: "owner" });
    expect((asB.body as CircleDetailDto).owner.name).toBe("小红");

    await api.as("e2e_owner").post(`/circles/${circleId}/leave`).expect(204);
  });

  it("转让的限制：只能转给在群里的人", async () => {
    const outsider = await api.as("e2e_c").get("/me").expect(200);
    const res = await api
      .as("e2e_owner")
      .post(`/circles/${circleId}/transfer`, { toUserId: (outsider.body as { id: string }).id })
      .expect(409);

    expect(res.body).toMatchObject({ code: "TARGET_NOT_MEMBER" });
    await api.as("e2e_b").post(`/circles/${circleId}/transfer`, { toUserId: bId }).expect(403);

    const me = (await api.as("e2e_owner").get("/me").expect(200)).body as { id: string };
    const self = await api
      .as("e2e_owner")
      .post(`/circles/${circleId}/transfer`, { toUserId: `0${me.id}` })
      .expect(400);
    expect(self.body).toMatchObject({ code: "TARGET_IS_SELF" });
  });

  it("转让给小红的同时小红在退群：不管谁先到，群里总有一个在群里的群主", async () => {
    const [transfer, leave] = await Promise.all([
      api.as("e2e_owner").post(`/circles/${circleId}/transfer`, { toUserId: bId }),
      api.as("e2e_b").post(`/circles/${circleId}/leave`),
    ]);

    // 转让先到：小红成了群主，退群被拦下（还有人，要先转让）；退群先到：小红走了，转让被拦下
    const outcome = [transfer.status, leave.status].sort().join(",");
    expect(["200,409"]).toContain(outcome);

    const [row] = await t.db
      .select({ ownerId: circle.ownerId })
      .from(circle)
      .where(eq(circle.id, Number(circleId)));
    const [ownerMember] = await t.db
      .select()
      .from(circleMember)
      .where(
        and(eq(circleMember.circleId, Number(circleId)), eq(circleMember.userId, row!.ownerId)),
      );
    expect(ownerMember).toMatchObject({ role: "owner", status: "active" });
  });

  it("解散：只有群主能解散", async () => {
    const res = await api.as("e2e_b").post(`/circles/${circleId}/dissolve`).expect(403);
    expect(res.body).toMatchObject({ code: "NOT_CIRCLE_OWNER" });

    await api.as("e2e_owner").post(`/circles/${circleId}/dissolve`).expect(204);
    expect((await api.as("e2e_owner").get("/circles").expect(200)).body).toEqual([]);
  });
});

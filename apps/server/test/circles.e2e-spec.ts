import type { CircleDetailDto, CircleSummaryDto, MembersResult } from "@yiqi/shared";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { client, createTestApp, resetDb, signUp, type Client, type TestApp } from "./app";

const NEW_CIRCLE = {
  name: "大学室友",
  type: "classmates",
  avatar: "preset:dorm",
  timezone: "Asia/Shanghai",
};

/** 建群、列表、主页、群设置、群昵称，以及「非成员找不到、成员不能改设置」 */
describe("群组：建群、看群、改设置", () => {
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
    await signUp(api, "e2e_owner", "阿杰");
    await signUp(api, "e2e_other", "小红");
  });

  async function createCircle(): Promise<CircleDetailDto> {
    const res = await api.as("e2e_owner").post("/circles", NEW_CIRCLE).expect(201);
    return res.body as CircleDetailDto;
  }

  it("建群：建的人是群主，群里 1 个人，能邀请，鸽子王默认开", async () => {
    const created = await createCircle();

    expect(created).toMatchObject({
      name: "大学室友",
      type: "classmates",
      avatar: "preset:dorm",
      timezone: "Asia/Shanghai",
      myRole: "owner",
      memberCount: 1,
      canInvite: true,
      pigeonEnabled: true,
      needApproval: false,
      inviteOwnerOnly: false,
      // 阶段 2、3 才有的先如实返回空值
      activePlanCount: 0,
      king: null,
      peaceStreak: 0,
    });
    expect(created.owner.name).toBe("阿杰");
  });

  it("建群的校验：群名、时区、头像、内容安全，提示都是中文", async () => {
    const cases: [object, string][] = [
      [{ ...NEW_CIRCLE, name: "  " }, "群名不能为空"],
      [{ ...NEW_CIRCLE, name: "一二三四五六七八九十一二三" }, "群名最多 12 个字"],
      [{ ...NEW_CIRCLE, timezone: "Mars/Olympus" }, "时区不对，重新选一个试试。"],
      [{ ...NEW_CIRCLE, avatar: "https://evil.example.com/a.png" }, "群头像不对，重新选一个试试。"],
      [{ ...NEW_CIRCLE, type: "club" }, "群类型不对。"],
    ];

    for (const [body, message] of cases) {
      const res = await api.as("e2e_owner").post("/circles", body).expect(400);
      expect((res.body as { message: string }).message).toBe(message);
    }

    const rejected = await api
      .as("e2e_owner")
      .post("/circles", { ...NEW_CIRCLE, name: "违规内容群" })
      .expect(400);
    expect(rejected.body).toMatchObject({ code: "CONTENT_REJECTED" });
  });

  it("群组列表只有我在的群", async () => {
    await createCircle();

    const mine = await api.as("e2e_owner").get("/circles").expect(200);
    const others = await api.as("e2e_other").get("/circles").expect(200);

    expect((mine.body as CircleSummaryDto[]).map((c) => c.name)).toEqual(["大学室友"]);
    expect(others.body).toEqual([]);
  });

  it("非成员看群：一律当找不到，不暴露群在不在", async () => {
    const created = await createCircle();

    const res = await api.as("e2e_other").get(`/circles/${created.id}`).expect(404);
    expect(res.body).toMatchObject({ code: "CIRCLE_NOT_FOUND" });

    await api.as("e2e_owner").get("/circles/not-a-number").expect(404);
    await api.as("e2e_owner").get("/circles/999999").expect(404);
  });

  it("群主改群设置，只改传了的字段", async () => {
    const created = await createCircle();

    const res = await api
      .as("e2e_owner")
      .put(`/circles/${created.id}`, {
        name: "大学室友们",
        needApproval: true,
        pigeonEnabled: false,
        penaltyText: " 下次局负责订位 ",
        timezone: "Australia/Sydney",
      })
      .expect(200);
    const updated = res.body as CircleDetailDto;

    expect(updated).toMatchObject({
      name: "大学室友们",
      needApproval: true,
      pigeonEnabled: false,
      penaltyText: "下次局负责订位",
      timezone: "Australia/Sydney",
      type: "classmates",
      inviteOwnerOnly: false,
    });

    const cleared = await api
      .as("e2e_owner")
      .put(`/circles/${created.id}`, { penaltyText: "" })
      .expect(200);
    expect((cleared.body as CircleDetailDto).penaltyText).toBeNull();
  });

  it("任务卡超过 30 个字不收", async () => {
    const created = await createCircle();
    const res = await api
      .as("e2e_owner")
      .put(`/circles/${created.id}`, { penaltyText: "字".repeat(31) })
      .expect(400);

    expect((res.body as { message: string }).message).toBe("鸽王任务卡最多 30 个字");
  });

  it("普通成员改不了群设置", async () => {
    const created = await createCircle();
    const invite = await api.as("e2e_owner").post(`/circles/${created.id}/invites`).expect(200);
    await api.as("e2e_other").post("/circles/join", { code: invite.body.code }).expect(200);

    const res = await api
      .as("e2e_other")
      .put(`/circles/${created.id}`, { name: "改一下" })
      .expect(403);
    expect(res.body).toMatchObject({ code: "NOT_CIRCLE_OWNER", message: "只有群主能做这件事。" });
  });

  it("群昵称：成员列表里显示群昵称，清空就退回微信昵称", async () => {
    const created = await createCircle();

    await api
      .as("e2e_owner")
      .put(`/circles/${created.id}/members/me`, { groupNickname: "二舅" })
      .expect(200);
    const withNick = await api.as("e2e_owner").get(`/circles/${created.id}/members`).expect(200);
    expect((withNick.body as MembersResult).members[0]?.user.name).toBe("二舅");

    await api
      .as("e2e_owner")
      .put(`/circles/${created.id}/members/me`, { groupNickname: "" })
      .expect(200);
    const cleared = await api.as("e2e_owner").get(`/circles/${created.id}/members`).expect(200);
    expect((cleared.body as MembersResult).members[0]?.user.name).toBe("阿杰");
  });
});

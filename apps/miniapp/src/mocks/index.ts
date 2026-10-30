import type { RequestOptions } from "../request/types";
import { MockRouter } from "./router";
import { mockDb } from "./store";

/**
 * H5 预览用的假接口（请求层 mock 档）。H5 只在开发时用来对照设计稿截图，不连后端，
 * 所以每加一个接口就在这里加一条，路径和 src/request/index.ts 的接口清单一一对应。
 * 只编进 H5：请求层用条件编译挡住了，不进小程序包。
 */
const router = new MockRouter()
  .on("GET", "/health", () => mockDb.health())
  .on("POST", "/auth/wechat", () => mockDb.login())
  .on("GET", "/me", () => mockDb.me())
  .on("PUT", "/me/profile", ({ body }) => mockDb.updateProfile(body))
  .on("PUT", "/me/settings", ({ body }) => mockDb.updateSettings(body))
  .on("GET", "/circles", () => mockDb.circles())
  .on("POST", "/circles", ({ body }) => mockDb.createCircle(body))
  .on("POST", "/circles/join", ({ body }) => mockDb.join(body))
  .on("GET", "/circles/:id", ({ params }) => mockDb.circle(params.id as string))
  .on("PUT", "/circles/:id", ({ params, body }) => mockDb.updateCircle(params.id as string, body))
  .on("GET", "/circles/:id/members", ({ params }) => mockDb.members(params.id as string))
  .on("PUT", "/circles/:id/members/me", ({ params, body }) =>
    mockDb.updateGroupNickname(params.id as string, body),
  )
  .on("DELETE", "/circles/:id/members/:userId", ({ params }) =>
    mockDb.removeMember(params.id as string, params.userId as string),
  )
  .on("POST", "/circles/:id/requests/:userId/approve", ({ params }) =>
    mockDb.approve(params.id as string, params.userId as string),
  )
  .on("POST", "/circles/:id/requests/:userId/reject", ({ params }) =>
    mockDb.reject(params.id as string, params.userId as string),
  )
  .on("GET", "/circles/:id/leave-preview", ({ params }) => mockDb.leavePreview(params.id as string))
  .on("POST", "/circles/:id/leave", ({ params }) => mockDb.leave(params.id as string))
  .on("POST", "/circles/:id/transfer", ({ params, body }) =>
    mockDb.transfer(params.id as string, body),
  )
  .on("POST", "/circles/:id/dissolve", ({ params }) => mockDb.dissolve(params.id as string))
  .on("POST", "/circles/:id/invites", ({ params }) => mockDb.invite(params.id as string))
  .on("GET", "/invites/preview", ({ query }) => mockDb.invitePreview(query));

export function mockResponse<T>(options: RequestOptions): Promise<T> {
  const method = options.method ?? "GET";
  const run = router.match(method, options.url, options.data);

  if (!run) {
    return Promise.reject(
      new Error(`H5 预览还没有「${method} ${options.url}」的假数据，去 src/mocks/index.ts 加一条。`),
    );
  }

  try {
    return Promise.resolve(run() as T);
  } catch (error) {
    return Promise.reject(error);
  }
}

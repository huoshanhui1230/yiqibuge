import type {
  AuthBody,
  AuthResult,
  CircleDetailDto,
  CircleSummaryDto,
  CreateCircleBody,
  HealthResult,
  InviteDto,
  InvitePreviewDto,
  JoinBody,
  JoinResult,
  LeavePreviewDto,
  MeDto,
  MembersResult,
  TransferBody,
  UpdateCircleBody,
  UpdateGroupNicknameBody,
  UpdateProfileBody,
  UpdateSettingsBody,
} from "@yiqi/shared";

import { request } from "./core";

export { API_PREFIX, apiMode, newRequestId, request, setNotLoggedInHandler } from "./core";
export * from "./types";

/** GET 的参数拼进地址：callContainer 和 uni.request 对 GET 的 data 处理不一样，自己拼最稳 */
function withQuery(url: string, query: Record<string, string | undefined>): string {
  const pairs = Object.entries(query)
    .filter((entry): entry is [string, string] => entry[1] !== undefined && entry[1] !== "")
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`);

  return pairs.length > 0 ? `${url}?${pairs.join("&")}` : url;
}

const circleUrl = (id: string, rest = "") => `/circles/${encodeURIComponent(id)}${rest}`;

/**
 * 接口清单。路径和 docs/spec.md「核心接口」、阶段 1 方案对齐，/api/v1 前缀由请求层加。
 * 页面不直接调 request，每加一个接口在这里加一行，H5 预览的假数据在 src/mocks 里加一条。
 */
export const api = {
  health: (): Promise<HealthResult> => request<HealthResult>({ url: "/health" }),

  // ---- 登录和我 ----
  login: (body: AuthBody): Promise<AuthResult> =>
    request<AuthResult>({ url: "/auth/wechat", method: "POST", data: body }),
  me: (): Promise<MeDto> => request<MeDto>({ url: "/me" }),
  updateProfile: (body: UpdateProfileBody): Promise<MeDto> =>
    request<MeDto>({ url: "/me/profile", method: "PUT", data: body }),
  updateSettings: (body: UpdateSettingsBody): Promise<MeDto> =>
    request<MeDto>({ url: "/me/settings", method: "PUT", data: body }),

  // ---- 群组 ----
  circles: (): Promise<CircleSummaryDto[]> => request<CircleSummaryDto[]>({ url: "/circles" }),
  createCircle: (body: CreateCircleBody): Promise<CircleDetailDto> =>
    request<CircleDetailDto>({ url: "/circles", method: "POST", data: body }),
  circle: (id: string): Promise<CircleDetailDto> =>
    request<CircleDetailDto>({ url: circleUrl(id) }),
  updateCircle: (id: string, body: UpdateCircleBody): Promise<CircleDetailDto> =>
    request<CircleDetailDto>({ url: circleUrl(id), method: "PUT", data: body }),
  members: (id: string): Promise<MembersResult> =>
    request<MembersResult>({ url: circleUrl(id, "/members") }),
  updateGroupNickname: (id: string, body: UpdateGroupNicknameBody): Promise<CircleDetailDto> =>
    request<CircleDetailDto>({ url: circleUrl(id, "/members/me"), method: "PUT", data: body }),
  removeMember: (id: string, userId: string): Promise<MembersResult> =>
    request<MembersResult>({
      url: circleUrl(id, `/members/${encodeURIComponent(userId)}`),
      method: "DELETE",
    }),
  approveRequest: (id: string, userId: string): Promise<MembersResult> =>
    request<MembersResult>({
      url: circleUrl(id, `/requests/${encodeURIComponent(userId)}/approve`),
      method: "POST",
    }),
  rejectRequest: (id: string, userId: string): Promise<MembersResult> =>
    request<MembersResult>({
      url: circleUrl(id, `/requests/${encodeURIComponent(userId)}/reject`),
      method: "POST",
    }),
  leavePreview: (id: string): Promise<LeavePreviewDto> =>
    request<LeavePreviewDto>({ url: circleUrl(id, "/leave-preview") }),
  leave: (id: string): Promise<void> =>
    request<void>({ url: circleUrl(id, "/leave"), method: "POST" }),
  transfer: (id: string, body: TransferBody): Promise<CircleDetailDto> =>
    request<CircleDetailDto>({ url: circleUrl(id, "/transfer"), method: "POST", data: body }),
  dissolve: (id: string): Promise<void> =>
    request<void>({ url: circleUrl(id, "/dissolve"), method: "POST" }),

  // ---- 邀请和加入 ----
  invite: (id: string): Promise<InviteDto> =>
    request<InviteDto>({ url: circleUrl(id, "/invites"), method: "POST" }),
  invitePreview: (query: { t?: string; code?: string; from?: string }): Promise<InvitePreviewDto> =>
    request<InvitePreviewDto>({ url: withQuery("/invites/preview", query) }),
  join: (body: JoinBody): Promise<JoinResult> =>
    request<JoinResult>({ url: "/circles/join", method: "POST", data: body }),
};

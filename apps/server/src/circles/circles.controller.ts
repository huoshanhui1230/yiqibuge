import { Body, Controller, Delete, Get, HttpCode, Param, Post, Put, Query } from "@nestjs/common";
import type {
  CircleDetailDto,
  CircleSummaryDto,
  InviteDto,
  InvitePreviewDto,
  JoinResult,
  LeavePreviewDto,
  MembersResult,
} from "@yiqi/shared";

import { CurrentUser, OptionalUser, Public } from "../auth/auth.decorators";
import { parseId } from "../common/ids";
import type { AppUser } from "../db/schema";
import {
  CreateCircleDto,
  JoinDto,
  PreviewQueryDto,
  TransferDto,
  UpdateCircleDto,
  UpdateGroupNicknameDto,
} from "./circles.dto";
import { CirclesService } from "./circles.service";
import { InvitesService } from "./invites.service";
import { MembershipService } from "./membership.service";

/** 群组接口（阶段 1 方案「接口」）。非成员访问一律「找不到」，群主才能做的返回「只有群主能做」 */
@Controller("circles")
export class CirclesController {
  constructor(
    private readonly circles: CirclesService,
    private readonly membership: MembershipService,
    private readonly invites: InvitesService,
  ) {}

  /** POST /api/v1/circles：建群 */
  @Post()
  create(@CurrentUser() user: AppUser, @Body() body: CreateCircleDto): Promise<CircleDetailDto> {
    return this.circles.create(user, body);
  }

  /** GET /api/v1/circles：我的群组列表 */
  @Get()
  list(@CurrentUser() user: AppUser): Promise<CircleSummaryDto[]> {
    return this.circles.list(user);
  }

  /** POST /api/v1/circles/join：凭卡片 token 或邀请码加入 */
  @Post("join")
  @HttpCode(200)
  join(@CurrentUser() user: AppUser, @Body() body: JoinDto): Promise<JoinResult> {
    return this.membership.join(user, body);
  }

  /** GET /api/v1/circles/:id：群组主页 */
  @Get(":id")
  detail(@CurrentUser() user: AppUser, @Param("id") id: string): Promise<CircleDetailDto> {
    return this.circles.detail(user, parseId(id));
  }

  /** PUT /api/v1/circles/:id：群主改群设置（只传要改的） */
  @Put(":id")
  update(
    @CurrentUser() user: AppUser,
    @Param("id") id: string,
    @Body() body: UpdateCircleDto,
  ): Promise<CircleDetailDto> {
    return this.circles.update(user, parseId(id), body);
  }

  /** GET /api/v1/circles/:id/members：成员；群主多看到待审核的申请 */
  @Get(":id/members")
  members(@CurrentUser() user: AppUser, @Param("id") id: string): Promise<MembersResult> {
    return this.circles.members(user, parseId(id));
  }

  /** PUT /api/v1/circles/:id/members/me：我的群昵称 */
  @Put(":id/members/me")
  updateGroupNickname(
    @CurrentUser() user: AppUser,
    @Param("id") id: string,
    @Body() body: UpdateGroupNicknameDto,
  ): Promise<CircleDetailDto> {
    return this.circles.updateGroupNickname(user, parseId(id), body.groupNickname);
  }

  /** DELETE /api/v1/circles/:id/members/:userId：群主移出成员 */
  @Delete(":id/members/:userId")
  remove(
    @CurrentUser() user: AppUser,
    @Param("id") id: string,
    @Param("userId") userId: string,
  ): Promise<MembersResult> {
    return this.membership.remove(user, parseId(id), userId);
  }

  /** POST /api/v1/circles/:id/requests/:userId/approve：同意入群 */
  @Post(":id/requests/:userId/approve")
  @HttpCode(200)
  approve(
    @CurrentUser() user: AppUser,
    @Param("id") id: string,
    @Param("userId") userId: string,
  ): Promise<MembersResult> {
    return this.membership.approve(user, parseId(id), userId);
  }

  /** POST /api/v1/circles/:id/requests/:userId/reject：拒绝入群 */
  @Post(":id/requests/:userId/reject")
  @HttpCode(200)
  reject(
    @CurrentUser() user: AppUser,
    @Param("id") id: string,
    @Param("userId") userId: string,
  ): Promise<MembersResult> {
    return this.membership.reject(user, parseId(id), userId);
  }

  /** GET /api/v1/circles/:id/leave-preview：退群前弹窗要说明的内容 */
  @Get(":id/leave-preview")
  leavePreview(@CurrentUser() user: AppUser, @Param("id") id: string): Promise<LeavePreviewDto> {
    return this.membership.leavePreview(user, parseId(id));
  }

  /** POST /api/v1/circles/:id/leave：退群 */
  @Post(":id/leave")
  @HttpCode(204)
  leave(@CurrentUser() user: AppUser, @Param("id") id: string): Promise<void> {
    return this.membership.leave(user, parseId(id));
  }

  /** POST /api/v1/circles/:id/transfer：转让群主 */
  @Post(":id/transfer")
  @HttpCode(200)
  transfer(
    @CurrentUser() user: AppUser,
    @Param("id") id: string,
    @Body() body: TransferDto,
  ): Promise<CircleDetailDto> {
    return this.membership.transfer(user, parseId(id), body.toUserId);
  }

  /** POST /api/v1/circles/:id/dissolve：解散群组 */
  @Post(":id/dissolve")
  @HttpCode(204)
  dissolve(@CurrentUser() user: AppUser, @Param("id") id: string): Promise<void> {
    return this.membership.dissolve(user, parseId(id));
  }

  /** POST /api/v1/circles/:id/invites：取当前邀请（过期自动换新） */
  @Post(":id/invites")
  @HttpCode(200)
  invite(@CurrentUser() user: AppUser, @Param("id") id: string): Promise<InviteDto> {
    return this.invites.current(user, parseId(id));
  }
}

/** 加入落地页：不登录也能看 */
@Controller("invites")
export class InvitesController {
  constructor(private readonly invites: InvitesService) {}

  /** GET /api/v1/invites/preview?t=…|code=…&from=… */
  @Public()
  @Get("preview")
  preview(
    @OptionalUser() viewer: AppUser | undefined,
    @Query() query: PreviewQueryDto,
  ): Promise<InvitePreviewDto> {
    return this.invites.preview(query, viewer);
  }
}

import { Body, Controller, Get, HttpCode, Inject, Post, Put, Req } from "@nestjs/common";
import type { AuthResult, MeDto } from "@yiqi/shared";

import { Errors } from "../common/business-error";
import type { AppUser } from "../db/schema";
import { toMeDto, UsersService } from "../users/users.service";
import { CLOUD_RUN_IDENTITY, type CloudRunIdentityPort } from "../wechat/ports";
import { CurrentUser, Public, type AuthedRequest } from "./auth.decorators";
import { AuthBodyDto, UpdateProfileDto, UpdateSettingsDto } from "./auth.dto";

/**
 * 登录（docs/decisions.md 第 22 条）：不调 wx.login、不发 token，
 * 身份就是云托管注入的 openid，这里按它建用户或取用户。
 */
@Controller("auth")
export class AuthController {
  constructor(
    private readonly users: UsersService,
    @Inject(CLOUD_RUN_IDENTITY) private readonly identity: CloudRunIdentityPort,
  ) {}

  /** POST /api/v1/auth/wechat */
  @Public()
  @Post("wechat")
  @HttpCode(200)
  async login(@Req() request: AuthedRequest, @Body() body: AuthBodyDto): Promise<AuthResult> {
    const openid = this.identity.openidFrom(request.headers);
    if (!openid) {
      throw Errors.notLoggedIn();
    }

    const { user, isNew } = await this.users.ensure(
      openid,
      this.identity.unionidFrom(request.headers),
      body.timezone,
    );

    return { user: toMeDto(user), isNew };
  }
}

/** 我的资料和设置 */
@Controller("me")
export class MeController {
  constructor(private readonly users: UsersService) {}

  /** GET /api/v1/me */
  @Get()
  me(@CurrentUser() user: AppUser): MeDto {
    return toMeDto(user);
  }

  /** PUT /api/v1/me/profile：头像和昵称 */
  @Put("profile")
  async updateProfile(
    @CurrentUser() user: AppUser,
    @Body() body: UpdateProfileDto,
  ): Promise<MeDto> {
    return toMeDto(await this.users.updateProfile(user, body));
  }

  /** PUT /api/v1/me/settings：主题（切换后保存到用户设置） */
  @Put("settings")
  async updateSettings(
    @CurrentUser() user: AppUser,
    @Body() body: UpdateSettingsDto,
  ): Promise<MeDto> {
    return toMeDto(await this.users.updateSettings(user, body));
  }
}

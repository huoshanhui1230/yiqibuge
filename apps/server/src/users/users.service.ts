import { Inject, Injectable } from "@nestjs/common";
import {
  checkNickname,
  isValidTimeZone,
  trimText,
  type MeDto,
  type UpdateProfileBody,
  type UpdateSettingsBody,
} from "@yiqi/shared";
import { eq } from "drizzle-orm";

import { Errors } from "../common/business-error";
import { ensureCleanText, isAllowedImageUrl } from "../common/content";
import { ENV, type Env } from "../config/env";
import { DB, type Db } from "../db/db.module";
import { appUser, type AppUser } from "../db/schema";
import { CONTENT_SECURITY, type ContentSecurityPort } from "../wechat/ports";

/** MySQL 唯一键冲突 */
function isDuplicateKey(error: unknown): boolean {
  return (error as { code?: string } | null)?.code === "ER_DUP_ENTRY";
}

export function toMeDto(user: AppUser): MeDto {
  return {
    id: String(user.id),
    nickname: user.nickname,
    avatarUrl: user.avatarUrl,
    theme: user.theme,
    timezone: user.timezone,
    profileCompleted: Boolean(user.nickname),
  };
}

@Injectable()
export class UsersService {
  constructor(
    @Inject(DB) private readonly db: Db,
    @Inject(ENV) private readonly env: Env,
    @Inject(CONTENT_SECURITY) private readonly security: ContentSecurityPort,
  ) {}

  async findByOpenid(openid: string): Promise<AppUser | undefined> {
    const [user] = await this.db.select().from(appUser).where(eq(appUser.openid, openid)).limit(1);
    return user;
  }

  async findById(id: number): Promise<AppUser | undefined> {
    const [user] = await this.db.select().from(appUser).where(eq(appUser.id, id)).limit(1);
    return user;
  }

  /**
   * 登录：按 openid 取用户，没有就建（docs/decisions.md 第 22 条，建用户只在这一处）。
   * 幂等：同一个人连点两次、两个请求同时到，最后都是同一个用户。
   */
  async ensure(
    openid: string,
    unionid: string | null,
    timezone: string | undefined,
  ): Promise<{ user: AppUser; isNew: boolean }> {
    const zone = timezone && isValidTimeZone(timezone) ? timezone : null;
    const existing = await this.findByOpenid(openid);

    if (existing) {
      // 时区和 unionid 跟着最新的登录走（换了手机、出国了）
      const changes: Partial<AppUser> = {};
      if (zone && zone !== existing.timezone) changes.timezone = zone;
      if (unionid && unionid !== existing.unionid) changes.unionid = unionid;

      if (Object.keys(changes).length > 0) {
        await this.db
          .update(appUser)
          .set({ ...changes, updatedAt: new Date() })
          .where(eq(appUser.id, existing.id));
        return { user: { ...existing, ...changes }, isNew: false };
      }

      return { user: existing, isNew: false };
    }

    const now = new Date();
    try {
      await this.db
        .insert(appUser)
        .values({ openid, unionid, timezone: zone, createdAt: now, updatedAt: now });
    } catch (error) {
      // 同一个人的另一个请求刚刚建好了，按已有用户处理
      if (!isDuplicateKey(error)) throw error;
      const raced = await this.findByOpenid(openid);
      if (raced) return { user: raced, isNew: false };
      throw error;
    }

    const created = await this.findByOpenid(openid);
    if (!created) {
      throw new Error("建好的用户读不出来");
    }
    return { user: created, isNew: true };
  }

  /** 设置头像和昵称（设计稿 Login「先认识一下」），昵称过文本检测 */
  async updateProfile(user: AppUser, body: UpdateProfileBody): Promise<AppUser> {
    const nickname = trimText(body.nickname);
    const problem = checkNickname(nickname);
    if (problem) {
      throw Errors.badInput(problem);
    }

    if (
      body.avatarUrl !== undefined &&
      body.avatarUrl !== null &&
      !isAllowedImageUrl(body.avatarUrl, this.env.WECHAT_DRIVER)
    ) {
      throw Errors.badInput("头像没传上去，重新选一张试试。");
    }

    await ensureCleanText(this.security, nickname, "nickname");

    const changes: Partial<AppUser> = { nickname, updatedAt: new Date() };
    if (body.avatarUrl !== undefined) {
      changes.avatarUrl = body.avatarUrl;
    }

    await this.db.update(appUser).set(changes).where(eq(appUser.id, user.id));
    return { ...user, ...changes };
  }

  /** 用户设置：本阶段只有主题（阶段 4 加免打扰、动效开关） */
  async updateSettings(user: AppUser, body: UpdateSettingsBody): Promise<AppUser> {
    if (body.theme === undefined || body.theme === user.theme) {
      return user;
    }

    const changes: Partial<AppUser> = { theme: body.theme, updatedAt: new Date() };
    await this.db.update(appUser).set(changes).where(eq(appUser.id, user.id));
    return { ...user, ...changes };
  }
}

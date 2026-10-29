import { randomBytes } from "node:crypto";
import { mkdir, stat, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

import {
  Controller,
  Get,
  HttpCode,
  Inject,
  NotFoundException,
  Param,
  Post,
  Req,
  Res,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";

import { Public } from "../auth/auth.decorators";
import { Errors } from "../common/business-error";
import { ENV, type Env } from "../config/env";
import type { RequestHeaders } from "../wechat/ports";

/** multer 交过来的文件，只用到这几个字段（不为了类型去装 @types/multer） */
interface UploadedImage {
  buffer: Buffer;
  mimetype: string;
  size: number;
}

const UPLOAD_DIR = resolve(process.cwd(), ".uploads");
const MAX_BYTES = 5 * 1024 * 1024;
const EXTENSIONS: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

/**
 * 本地联调传图（docs/decisions.md 第 23 条）：微信开发者工具连本机后端时，头像和群头像传到这里，
 * 存在 apps/server/.uploads/（不入库）。正式环境图片直接传云托管对象存储，不经过后端，
 * 所以这两个接口只在 WECHAT_DRIVER=fake 时有，real 时一律 404。
 */
@Controller("dev")
export class DevUploadsController {
  constructor(@Inject(ENV) private readonly env: Env) {}

  private onlyInFakeDriver(): void {
    if (this.env.WECHAT_DRIVER !== "fake") {
      throw new NotFoundException();
    }
  }

  /** POST /api/v1/dev/uploads（multipart，字段名 file），返回能直接放进 <image> 的地址 */
  @Post("uploads")
  @HttpCode(200)
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: MAX_BYTES } }))
  async upload(
    @UploadedFile() file: UploadedImage | undefined,
    @Req() request: { protocol: string; headers: RequestHeaders },
  ): Promise<{ url: string }> {
    this.onlyInFakeDriver();

    const extension = file ? EXTENSIONS[file.mimetype] : undefined;
    if (!file || !extension) {
      throw Errors.badInput("只能传 jpg、png、webp、gif 图片。");
    }

    const name = `${Date.now()}-${randomBytes(6).toString("hex")}${extension}`;
    await mkdir(UPLOAD_DIR, { recursive: true });
    await writeFile(join(UPLOAD_DIR, name), file.buffer);

    const host = String(request.headers.host ?? `localhost:${this.env.PORT}`);
    return { url: `${request.protocol}://${host}${this.env.API_PREFIX}/dev/files/${name}` };
  }

  /** GET /api/v1/dev/files/:name：<image> 不带登录头，所以公开 */
  @Public()
  @Get("files/:name")
  async file(
    @Param("name") name: string,
    @Res() response: { sendFile(path: string): void },
  ): Promise<void> {
    this.onlyInFakeDriver();

    const path = join(UPLOAD_DIR, name);
    const exists = /^[A-Za-z0-9._-]+$/.test(name) && (await stat(path).catch(() => null))?.isFile();
    if (!exists) {
      throw new NotFoundException();
    }

    response.sendFile(path);
  }
}

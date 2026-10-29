import { Module } from "@nestjs/common";

import { DevUploadsController } from "./dev-uploads.controller";

/** 只在本地联调（WECHAT_DRIVER=fake）时起作用的接口 */
@Module({
  controllers: [DevUploadsController],
})
export class DevModule {}

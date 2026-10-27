import { Controller, Get } from "@nestjs/common";
import type { HealthResult } from "@yiqi/shared";

import { HealthService } from "./health.service";

@Controller("health")
export class HealthController {
  constructor(private readonly health: HealthService) {}

  /** GET /api/v1/health —— 小程序首页调它，接口测试也断言它 */
  @Get()
  check(): Promise<HealthResult> {
    return this.health.check();
  }
}

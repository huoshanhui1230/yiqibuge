/** 依赖是否可用 */
export type DepStatus = "up" | "down";

/** 后端进程角色：web 跑 HTTP，worker 跑定时和延时任务。两者是同一份代码。 */
export type AppRole = "web" | "worker";

/** 微信能力用真实现还是假实现 */
export type WechatDriver = "fake" | "real";

/**
 * GET /api/v1/health 的返回。
 * 小程序首页显示它，接口测试也断言它，所以类型放在共用包里。
 */
export interface HealthResult {
  /** 依赖都正常时为 true */
  ok: boolean;
  /** 应用名称，取自 APP_NAME */
  name: string;
  role: AppRole;
  deps: {
    db: DepStatus;
    redis: DepStatus;
  };
  /**
   * 服务器当前时间，ISO 8601 UTC。
   * 撤回窗口和鸽值档位都按服务器时间算，这里暴露出来方便对表。
   */
  serverTime: string;
  wechatDriver: WechatDriver;
}

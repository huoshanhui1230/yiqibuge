import type {
  ContainerRequest,
  ContainerResponse,
  Platform,
  ShareCardPayload,
  SharePayload,
  SubscribeResult,
} from "../types";

/** wx.cloud 的类型声明在 src/env.d.ts 里（@dcloudio/types 不带它） */
type CloudApi = NonNullable<typeof wx.cloud>;

function cloud(): CloudApi {
  const api = wx.cloud;

  if (!api) {
    throw new Error("当前环境没有 wx.cloud，无法调用云托管。");
  }

  return api;
}

let inited = false;

function ensureInit(env: string): void {
  if (inited) {
    return;
  }

  cloud().init({ env });
  inited = true;
}

export const wechatPlatform: Platform = {
  async callContainer(request: ContainerRequest): Promise<ContainerResponse> {
    const env = import.meta.env.VITE_CLOUD_ENV;
    const service = import.meta.env.VITE_CLOUD_SERVICE;

    if (!env || !service) {
      throw new Error(
        "没配 VITE_CLOUD_ENV 或 VITE_CLOUD_SERVICE，发版前要在云托管后台拿到并填上。",
      );
    }

    ensureInit(env);

    const result = await cloud().callContainer({
      config: { env },
      path: request.path,
      method: request.method,
      header: {
        "X-WX-SERVICE": service,
        "content-type": "application/json",
        "x-request-id": request.requestId,
      },
      data: request.data,
    });

    return { statusCode: result.statusCode, data: result.data };
  },

  login(): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      uni.login({
        provider: "weixin",
        success: (res) => resolve(res.code),
        fail: (err) => reject(new Error(`微信登录失败：${err.errMsg}`)),
      });
    });
  },

  share(_payload: SharePayload): Promise<void> {
    return Promise.reject(new Error("分享到微信群还没实现（阶段 3 做）。"));
  },

  requestSubscribe(_templateIds: string[]): Promise<SubscribeResult> {
    return Promise.reject(new Error("申请订阅消息还没实现（阶段 3 做）。"));
  },

  renderShareCard(_payload: ShareCardPayload): Promise<string> {
    return Promise.reject(new Error("分享配图生成还没实现（阶段 3 做）。"));
  },
};

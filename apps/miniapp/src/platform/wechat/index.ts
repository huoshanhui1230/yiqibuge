import { API_PREFIX } from "../../request/constants";
import { FAKE_OPENID_HEADER, devOpenid } from "../../request/dev-identity";
import type {
  ContainerRequest,
  ContainerResponse,
  NavMetrics,
  Platform,
  ShareCardPayload,
  SharePayload,
  SubscribeResult,
  UploadKind,
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

function cloudEnv(): string {
  const env = import.meta.env.VITE_CLOUD_ENV;

  if (!env) {
    throw new Error("没配 VITE_CLOUD_ENV，发版前要在云托管后台拿到并填上。");
  }
  if (!inited) {
    cloud().init({ env });
    inited = true;
  }

  return env;
}

function fileExtension(path: string): string {
  const match = /\.(jpe?g|png|webp|gif)$/i.exec(path);
  return match ? `.${match[1]!.toLowerCase()}` : ".jpg";
}

/** 本地联调：图片传到本机后端（只在后端用假驱动时开放的 /dev/uploads） */
function uploadToLocalServer(tempFilePath: string, kind: UploadKind): Promise<string> {
  const origin = import.meta.env.VITE_API_BASE || "http://localhost:3000";

  return new Promise<string>((resolve, reject) => {
    uni.uploadFile({
      url: `${origin}${API_PREFIX}/dev/uploads?kind=${kind}`,
      filePath: tempFilePath,
      name: "file",
      header: { [FAKE_OPENID_HEADER]: devOpenid() },
      success: (res) => {
        try {
          const body = JSON.parse(res.data) as { url?: string; message?: string };
          if (res.statusCode >= 200 && res.statusCode < 300 && body.url) {
            resolve(body.url);
          } else {
            reject(new Error(body.message ?? "图片没传上去，稍后再试。"));
          }
        } catch {
          reject(new Error("图片没传上去，稍后再试。"));
        }
      },
      fail: (err) => reject(new Error(`连不上本机后端，图片没传上去：${err.errMsg}`)),
    });
  });
}

export const wechatPlatform: Platform = {
  async callContainer(request: ContainerRequest): Promise<ContainerResponse> {
    const service = import.meta.env.VITE_CLOUD_SERVICE;

    if (!service) {
      throw new Error("没配 VITE_CLOUD_SERVICE，发版前要在云托管后台拿到并填上。");
    }

    const env = cloudEnv();
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

  getNavMetrics(): NavMetrics {
    const win = uni.getWindowInfo();
    const menu = uni.getMenuButtonBoundingClientRect();
    const safeBottom = win.safeArea ? Math.max(0, win.screenHeight - win.safeArea.bottom) : 0;

    return {
      statusBarHeight: win.statusBarHeight ?? 0,
      menuButton: { top: menu.top, left: menu.left, width: menu.width, height: menu.height },
      windowWidth: win.windowWidth,
      safeAreaBottom: safeBottom,
    };
  },

  async uploadImage(tempFilePath: string, kind: UploadKind): Promise<string> {
    if (__API_MODE__ !== "cloud") {
      return uploadToLocalServer(tempFilePath, kind);
    }

    // 正式环境：传到云托管对象存储，库里存 cloud:// 文件 ID（docs/decisions.md 第 23 条）
    const env = cloudEnv();
    const random = Math.random().toString(36).slice(2, 10);
    const result = await cloud().uploadFile({
      cloudPath: `${kind}/${Date.now()}-${random}${fileExtension(tempFilePath)}`,
      filePath: tempFilePath,
      config: { env },
    });

    return result.fileID;
  },

  openPrivacyContract(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      wx.openPrivacyContract({
        success: () => resolve(),
        fail: (err) => reject(new Error(`打不开隐私保护指引：${err.errMsg}`)),
      });
    });
  },

  loadDisplayFont(): Promise<boolean> {
    const url = import.meta.env.VITE_FONT_DISPLAY_URL;

    // 没配地址就直接用系统字体（docs/decisions.md 第 24 条）
    if (!url) {
      return Promise.resolve(false);
    }

    return new Promise<boolean>((resolve) => {
      uni.loadFontFace({
        global: true,
        family: "ZCOOL KuaiLe",
        source: `url("${url}")`,
        success: () => resolve(true),
        fail: () => resolve(false),
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

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

/** H5 预览没有微信能力。预览只用来对照设计稿截图，所以这些调用给一句说明就够。 */
function unsupported(what: string): Error {
  return new Error(`H5 预览里没有${what}。这个能力只在微信小程序里有，请在微信开发者工具里测。`);
}

/**
 * 设计稿是 390 × 844、没画状态栏，胶囊画在顶部 8px 留白下面那一行的正中（87 × 32，离右边 16）。
 * H5 预览按 390 宽的设计稿 px 给一组固定值，顶部导航才能和设计稿一一对上。
 */
const DESIGN_NAV: NavMetrics = {
  statusBarHeight: 0,
  menuButton: { top: 14, left: 287, width: 87, height: 32 },
  windowWidth: 390,
  safeAreaBottom: 0,
};

export const fakePlatform: Platform = {
  callContainer(_request: ContainerRequest): Promise<ContainerResponse> {
    // H5 预览走 mock 档，根本到不了这里；真到了说明档位配错了
    return Promise.reject(unsupported("云托管调用"));
  },

  getNavMetrics(): NavMetrics {
    return DESIGN_NAV;
  },

  uploadImage(tempFilePath: string, _kind: UploadKind): Promise<string> {
    // 预览不存图，选了什么就原样显示
    return Promise.resolve(tempFilePath);
  },

  openPrivacyContract(): Promise<void> {
    return Promise.reject(unsupported("《隐私保护指引》"));
  },

  loadDisplayFont(): Promise<boolean> {
    // 字体在 index.html 里从 Google Fonts 加载
    return Promise.resolve(true);
  },

  share(_payload: SharePayload): Promise<void> {
    return Promise.reject(unsupported("分享到微信群"));
  },

  requestSubscribe(templateIds: string[]): Promise<SubscribeResult> {
    // 预览里一律当成用户同意，方便走通后续流程
    return Promise.resolve(
      Object.fromEntries(templateIds.map((id) => [id, "accept" as const])) as SubscribeResult,
    );
  },

  renderShareCard(_payload: ShareCardPayload): Promise<string> {
    return Promise.reject(unsupported("分享配图生成"));
  },
};

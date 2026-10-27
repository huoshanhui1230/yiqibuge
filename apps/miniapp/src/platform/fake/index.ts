import type {
  ContainerRequest,
  ContainerResponse,
  Platform,
  ShareCardPayload,
  SharePayload,
  SubscribeResult,
} from "../types";

/** H5 预览没有微信能力。预览只用来对照设计稿截图，所以这些调用给一句说明就够。 */
function unsupported(what: string): Error {
  return new Error(`H5 预览里没有${what}。这个能力只在微信小程序里有，请在微信开发者工具里测。`);
}

export const fakePlatform: Platform = {
  callContainer(_request: ContainerRequest): Promise<ContainerResponse> {
    // H5 预览走 mock 档，根本到不了这里；真到了说明档位配错了
    return Promise.reject(unsupported("云托管调用"));
  },

  login(): Promise<string> {
    // 固定返回一个假 code，后端的假登录会把它当 openid 用
    return Promise.resolve("openid_test_a");
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

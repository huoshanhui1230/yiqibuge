import type {
  ContentCheckResult,
  ContentSecurityPort,
  TextScene,
} from "../ports/content-security.port";

/** 真内容安全检测：调微信的 msgSecCheck / mediaCheckAsync。阶段 4 实现。 */
export class RealContentSecurity implements ContentSecurityPort {
  checkText(_text: string, _scene: TextScene): Promise<ContentCheckResult> {
    return Promise.reject(
      new Error(
        "真实的文本内容安全检测还没实现（阶段 4 做）。本地开发请把 WECHAT_DRIVER 设为 fake。",
      ),
    );
  }

  checkImage(_imageUrl: string): Promise<ContentCheckResult> {
    return Promise.reject(
      new Error(
        "真实的图片内容安全检测还没实现（阶段 4 做）。本地开发请把 WECHAT_DRIVER 设为 fake。",
      ),
    );
  }
}

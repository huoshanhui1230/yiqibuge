import type {
  ContentCheckResult,
  ContentSecurityPort,
  TextScene,
} from "../ports/content-security.port";

/**
 * 假内容安全检测：默认通过，只有命中下面这张小词表才不通过。
 * 留一张词表是为了阶段 4 能本地测「不通过时的友好提示」，不用真的调微信。
 */
const BLOCKED_WORDS = ["测试敏感词", "违规内容"];

const SCENE_LABEL: Record<TextScene, string> = {
  circleName: "群名",
  nickname: "昵称",
  planTitle: "计划标题",
  planNote: "计划详情",
  flakeReason: "鸽了理由",
};

export class FakeContentSecurity implements ContentSecurityPort {
  checkText(text: string, scene: TextScene): Promise<ContentCheckResult> {
    const hit = BLOCKED_WORDS.some((word) => text.includes(word));

    return Promise.resolve(
      hit
        ? { pass: false, reason: `${SCENE_LABEL[scene]}里有不能用的内容，换个说法再试试。` }
        : { pass: true },
    );
  }

  checkImage(_imageUrl: string): Promise<ContentCheckResult> {
    return Promise.resolve({ pass: true });
  }
}

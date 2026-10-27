export const CONTENT_SECURITY = "CONTENT_SECURITY";

/** 文本出现的位置，决定不通过时的提示文案 */
export type TextScene = "circleName" | "nickname" | "planTitle" | "planNote" | "flakeReason";

export interface ContentCheckResult {
  pass: boolean;
  /** 不通过时给用户看的中文提示 */
  reason?: string;
}

/**
 * 内容安全检测。
 * 群名、昵称、计划标题、详情、鸽了理由在保存前过文本检测；头像和群头像过图片检测。
 * 接在哪些地方见 .claude/rules/server.md，接入时机是阶段 4。
 */
export interface ContentSecurityPort {
  checkText(text: string, scene: TextScene): Promise<ContentCheckResult>;
  checkImage(imageUrl: string): Promise<ContentCheckResult>;
}

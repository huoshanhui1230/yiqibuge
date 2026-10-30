/** 页面上的轻提示。后端的错误 message 本来就是中文、能直接给用户看（apps/server 的错误格式） */
export function toast(title: string): void {
  uni.showToast({ title, icon: "none", duration: 2200 });
}

export function errorMessage(error: unknown): string {
  return error instanceof Error && error.message ? error.message : "网络不太好，稍后再试。";
}

export function toastError(error: unknown): void {
  toast(errorMessage(error));
}

/** 后端业务错误的 code（ApiRequestError.code），别的错误返回空 */
export function errorCode(error: unknown): string {
  return (error as { code?: unknown } | null)?.code?.toString() ?? "";
}

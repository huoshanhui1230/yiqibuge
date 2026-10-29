// 由 scripts/extract-illustrations.ts 从设计稿 <symbol> 生成，不要手改。
// 重新生成：pnpm -F @yiqi/miniapp gen:art

/** 每套主题都有的插画，文件在 /static/themes/<主题>/<名字>.svg */
export const ILLUSTRATIONS = ["appicon","arrow","bell","chev","crown","done","dorm","drop","feather","fly","gg","hood-back","hood-front","house","pot","receipt","shades","splat","tea","tick","ticket","wing"] as const;

export type IllustrationName = (typeof ILLUSTRATIONS)[number];

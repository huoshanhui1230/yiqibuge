import { pxToRpx } from "./theme-tokens";

/** 只用到 PostCSS 声明节点的这几个字段；不为了类型去加 postcss 依赖（它是 Vite 带的） */
interface Declaration {
  value: string;
  source?: { input: { file?: string } };
}

/**
 * 组件和页面的样式按设计稿写 px（和设计稿 HTML 一一对得上，走查时好比对），
 * 构建时这里换成 rpx（×750/390，.claude/rules/miniapp.md「尺寸和交互」）。
 *
 * - 只动 src/ 下我们自己的样式：uni-app 自带组件的样式也是 px，不能跟着缩放。
 * - 不超过 1px 的细线保持 px，999px 胶囊圆角保持原样（规则同 theme-tokens.ts 的 pxToRpx）。
 * - 媒体查询里的宽度不动（那是窗口宽度，不是设计稿尺寸）。
 * - 用 Declaration 钩子，保证在 uni-app 自己把 rpx 换成 rem（H5）之前跑。
 */
export function pxToRpxPlugin(srcDir: string) {
  const normalizedSrc = srcDir.replace(/\\/g, "/");

  return {
    postcssPlugin: "yiqi-px-to-rpx",
    Declaration(decl: Declaration): void {
      const file = decl.source?.input.file?.replace(/\\/g, "/") ?? "";

      if (!file.startsWith(normalizedSrc) || file.includes("/node_modules/")) {
        return;
      }
      if (decl.value.includes("px")) {
        decl.value = pxToRpx(decl.value);
      }
    },
  };
}

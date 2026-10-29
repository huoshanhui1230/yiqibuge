<script setup lang="ts">
import { onLaunch } from "@dcloudio/uni-app";
import { APP_NAME } from "@yiqi/shared";

import { platform } from "./platform";
import { apiMode } from "./request";

onLaunch(() => {
  console.log(`${APP_NAME} 启动，请求层档位：${apiMode}`);
  // 快乐体运行时加载，没配地址或加载失败就用系统字体（docs/decisions.md 第 24 条）
  void platform.loadDisplayFont();
});
</script>

<style>
/* 三套主题的 CSS 变量，由 docs/design/tokens.json 生成：pnpm -F @yiqi/miniapp gen:theme */
@import "./styles/themes.css";
/* 线性图标（mask 用），由 scripts/icons.ts 生成：pnpm -F @yiqi/miniapp gen:art */
@import "./styles/icons.css";

page {
  background: var(--yq-color-bg);
  color: var(--yq-color-text);
  font-family: var(--yq-font-body);
}

/* 动效开关关掉时（阶段 4 接「设置 › 动效开关」），所有标了 yq-anim 的动画都停 */
.yq-motion-off .yq-anim {
  animation: none !important;
  transition: none !important;
}
</style>

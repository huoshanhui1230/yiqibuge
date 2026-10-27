<script setup lang="ts">
import { onLaunch } from "@dcloudio/uni-app";
import { APP_NAME } from "@yiqi/shared";

import { apiMode } from "./request";

onLaunch(() => {
  console.log(`${APP_NAME} 启动，请求层档位：${apiMode}`);
});
</script>

<style>
/* 三套主题的 CSS 变量，由 docs/design/tokens.json 生成：pnpm -F @yiqi/miniapp gen:theme */
@import "./styles/themes.css";

page {
  background: var(--yq-color-bg);
  color: var(--yq-color-text);
  font-family: var(--yq-font-body);
}
</style>

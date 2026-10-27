import { createSSRApp } from "vue";

import App from "./App.vue";

// uni-app 的 Vue 3 入口必须导出 createApp 并用 createSSRApp
export function createApp() {
  const app = createSSRApp(App);

  return { app };
}

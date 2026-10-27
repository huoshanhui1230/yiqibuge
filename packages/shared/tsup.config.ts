import { defineConfig } from "tsup";

// 后端是 CJS、小程序端是 ESM，所以两种格式都出一份，带 .d.ts。
// 这样两端都不用为了共用这个包去改自己的模块系统。
export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  target: "es2022",
  dts: true,
  sourcemap: true,
  clean: true,
});

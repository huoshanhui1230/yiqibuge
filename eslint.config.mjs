// 全仓一份 ESLint 配置（flat config）。
// 原则：只拦会让功能出错或违反项目硬规则的写法；风格交给 Prettier，不在这里管。
import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import pluginVue from "eslint-plugin-vue";
import prettier from "eslint-config-prettier";

// CLAUDE.md 的硬规则：所有日期、时段、倒计时文案都由 packages/shared 的时间文案函数生成，
// 页面和通知里不手写日期格式。下面两条让「手写格式」直接 lint 不过。
const noHandWrittenDateFormat = [
  "error",
  {
    // 只拦日期时间，不拦数字的 toLocaleString（V1.1 记账要用它格式化金额）
    selector: "MemberExpression[property.name=/^toLocale(Date|Time)String$/]",
    message:
      "不要手写日期时间格式。请用 packages/shared 的时间文案函数生成（见 CLAUDE.md「必须遵守」）。",
  },
  {
    selector: "NewExpression[callee.object.name='Intl'][callee.property.name='DateTimeFormat']",
    message: "不要直接用 Intl.DateTimeFormat。时间文案统一走 packages/shared，保证各处说法一致。",
  },
];

export default tseslint.config(
  {
    // 生成物、设计稿和锁文件不参与 lint
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/coverage/**",
      "**/unpackage/**",
      ".shots/**",
      "docs/design/**",
      "apps/miniapp/src/styles/themes.css",
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...pluginVue.configs["flat/recommended"],

  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: { ...globals.node, ...globals.es2022 },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "no-restricted-syntax": noHandWrittenDateFormat,
    },
  },

  // 时间文案函数自己要用底层 API，这里是唯一允许的地方
  {
    files: ["packages/shared/src/time/**/*.ts"],
    rules: { "no-restricted-syntax": "off" },
  },

  {
    files: ["**/*.vue"],
    languageOptions: {
      parserOptions: { parser: tseslint.parser },
    },
    rules: {
      // 小程序页面组件的文件名就是 index.vue，不强求多词命名
      "vue/multi-word-component-names": "off",
    },
  },

  // 小程序端跑在小程序或浏览器里，不是 Node
  {
    files: ["apps/miniapp/**/*.{ts,vue}"],
    languageOptions: {
      globals: {
        ...globals.browser,
        uni: "readonly",
        wx: "readonly",
        getCurrentPages: "readonly",
      },
    },
  },

  {
    files: ["**/*.{spec,test,e2e-spec}.ts"],
    rules: { "@typescript-eslint/no-explicit-any": "off" },
  },

  // 放最后：关掉所有和 Prettier 打架的规则
  prettier,
);

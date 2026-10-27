# 一起不鸽 · 项目说明

微信小程序「一起不鸽」：朋友和家人在固定的群组里约局。有人发起计划，群友点「跟了 / 不跟」，人够了就成局；跟了又退出叫「鸽了」，会通知全群，每周评一次「鸽子王」。

## 资料（按需读，不要一次全读）
- 产品方案：docs/spec.md（很长，按章节读）
- 已定的决定：docs/decisions.md。和方案冲突时以它为准
- 设计稿目录：docs/design/README.md。每个页面都有三套主题的 HTML 和截图
- 设计 token：docs/design/tokens.json
- 分阶段任务和验收标准：docs/prompts.md
- 开发进度、版本锁定的原因、待确认问题：docs/progress.md

## 必须遵守
- IMPORTANT：不做任何用户之间的聊天功能，也不接微信聊天工具模式。
- 产品正式名称是「一起不鸽」。设计稿 HTML 和截图、docs/spec.md 里的「一起恰」是历史名称，`/design-check` 走查时不算差异；代码和文案里的品牌名只从 packages/shared 的 `brand.ts` 取，不手写。
- 每次表态（跟了、不跟、鸽了、撤回）前都弹确认卡，写清日期、星期和时间段，例如「跟了 · 周五 10月23日 18:30–20:30」。
- 时间一律存 UTC，按群组时区显示。所有日期、时段、倒计时文案都用 packages/shared 里的时间文案函数生成，页面和通知里不手写日期格式。
- 只做简体中文。
- 三套主题（sticker 贴纸风默认、cute 软糖风、clean 清爽风）页面结构和文案完全一样，只换 token 和插画。组件和页面里不写死颜色、圆角、阴影、字体，只用主题变量。
- 首版不做 V1.1 的功能（AA 记账、管理员、发起人转交、事后点名、动态消息、徽章等），任务里明确要求时才做。
- 微信能力（登录、订阅消息、内容安全、分享、云托管调用）都包一层适配器，本地开发和测试用假实现。

## 技术栈
- apps/miniapp：uni-app（Vue 3 + TypeScript + Vite），只编译微信小程序；另有一个只在开发时用的 H5 预览，接口走假数据，用来截图对照设计稿
- apps/server：NestJS 模块化单体；同一份代码另起一个 Worker 进程跑定时和延时任务（BullMQ + Redis）
- 数据库 MySQL 8；图片存储在第 1 阶段定
- 部署在微信云托管，小程序用 wx.cloud.callContainer 调后端
- packages/shared：前后端共用的类型、时间文案、鸽值计算
- 包管理用 pnpm workspace

## 常用命令

装机一次（装依赖、起 MySQL 和 Redis、构建共用包、跑迁移）：
```
cp .env.example .env     # Windows：copy .env.example .env
pnpm bootstrap
pnpm -F @yiqi/tools-shots install:browser   # 截图用的浏览器，装一次就行
```

平时：
```
pnpm dev:db           # 起 MySQL 8 + Redis（docker compose），要先开 Docker Desktop
pnpm dev:db:down      # 停掉；pnpm dev:db:reset 清库重来
pnpm migrate          # 跑数据库迁移
pnpm migrate:gen      # 改了 src/db/schema 后生成迁移 SQL
pnpm dev:server       # 起后端，http://localhost:3000/api/v1
pnpm dev:worker       # 起 Worker 进程（定时和延时任务）
pnpm dev:h5           # H5 预览，http://localhost:5173
pnpm dev:mp           # 编译小程序（watch），产物给微信开发者工具
pnpm build:mp         # 编译小程序（一次性），产物在 apps/miniapp/dist/build/mp-weixin
pnpm shots            # Playwright 给 H5 截图到 .shots/，走查用
```

提交前三件套：
```
pnpm typecheck        # 全仓类型检查
pnpm lint             # 全仓 lint（pnpm lint:fix 自动修）
pnpm test             # 全仓单元测试
pnpm test:e2e         # 后端接口测试，要先 pnpm dev:db 和 pnpm migrate
```

小程序界面要你自己看：`pnpm build:mp` 后在微信开发者工具里导入 `apps/miniapp/dist/build/mp-weixin`。
本地联调（请求层 local 档）需要在开发者工具里关掉「校验合法域名」。

## 做事方式
- 改动涉及多个文件时，先在计划模式里出方案，我确认后再写代码。
- 需求不清楚就问我，不要猜。发现方案、决定和设计稿互相矛盾时，停下来告诉我。
- 每做完一块：跑类型检查、lint 和相关测试，把结果给我看；改了页面就对照设计稿三套主题检查。
- 小步提交，提交信息用中文写清做了什么。
- 引入新的大依赖之前先问我。

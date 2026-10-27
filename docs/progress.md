# 开发进度

每做完一个阶段往这里追加一段（`/phase-done` 的第 5 步刚好产出这些内容）。

## 当前状态

- **阶段**：第 0 步 · 搭工程 —— 已完成并全部验证过（2026-10-27）
- **下一步**：阶段 1（主题、组件、登录、群组），见 `docs/prompts.md`
- **没有遗留**：接口测试和 Dockerfile 构建当天都补验通过了，见下面「第 0 步」的验证表。

---

## 环境与版本

本机实测（2026-10-27）：Node v24.15.0、pnpm 12.15.0、Docker 29.4.2 + Compose v5.1.3、git 2.45.1。

### 为什么好几个依赖不能用最新版

一句话：**uni-app 的 Vue 3 通道把 Vite 锁死在 5.2.8**，一串版本都得跟着它走。以后看到「有新版本」想升级，先看这张表。

`@dcloudio/*` 在 npm 上的 `latest` 标签是 **Vue 2 线**（`2.0.2-*`）。Vue 3 线在 **`vue3` dist-tag**，我们用的是 `3.0.0-5030320261023001`。这一版 `@dcloudio/vite-plugin-uni` 的 peer 写死 `vite: 5.2.8`，内部打包的是 `@vue/compiler-* 3.4.21` + `@vitejs/plugin-vue 5.2.4`。

| 包 | npm latest | 我们用 | 为什么 |
| --- | --- | --- | --- |
| vite | 8.3.5 | **5.2.8** | `vite-plugin-uni@vue3` 的 peer 锁死 5.2.8 |
| vue | 3.5.44 | **3.4.21** | 要和 uni-app 内置的 `@vue/compiler-* 3.4.21` 对齐，否则 runtime 和 compiler 版本不一致 |
| typescript | 7.0.2 | **5.9.3** | TS 7 是 Go 重写版；`typescript-eslint@8` 的 peer 明确写着 `typescript >=4.8.4 <6.1.0` |
| vitest | 5.0.5 | **3.2.7** | Vitest 5 的 peer 是 `vite ^6.4 \|\| ^7 \|\| ^8`，和 Vite 5.2.8 冲突。3.2.7 接受 `vite ^5`，全仓一个版本就能覆盖三个包 |
| pinia | 4.1.0 | **没装** | pinia 2/3/4 所有在用的版本 peer 都要 `vue ^3.5.11`，和 Vue 3.4.21 对不上。见下面「待确认 3」 |

### 选型结论

- **ORM：Drizzle 0.45.4**（2026-10-27 确认）。schema 写在 TypeScript 里，和共用包同一套语言；`drizzle-kit generate` 产出纯 SQL 迁移，能 code review；没有原生引擎二进制，云托管镜像小、冷启动快；能显式写 `datetime` 而不是会被会话时区折算的 `timestamp`。
- **测试框架：全仓 Vitest 3.2.7**，后端也用，不用 Jest。一个 runner 一套配置覆盖三个包；假时钟（`vi.setSystemTime`）配 Luxon 做夏令时用例顺手。NestJS 的依赖注入靠 `emitDecoratorMetadata`，esbuild 不生成，所以 `apps/server/vitest.config.ts` 挂了 `unplugin-swc`，`.swcrc` 开 `legacyDecorator` + `decoratorMetadata`。`health.service.spec.ts` 特意用 `Test.createTestingModule` 建服务，就是为了把这条路验穿。
- **后端接入：只走 `wx.cloud.callContainer`**（decisions 第 19 条），不自建域名、不做 ICP 备案。所以请求层只有 cloud / local / mock 三档，后端也不签发登录态。

### pnpm 12 的两个坑

- 放行安装脚本，**pnpm 12 认 `allowBuilds`，不认 `onlyBuiltDependencies`**（后者是 pnpm 10/11 的写法）。`pnpm-workspace.yaml` 里两份都留着。
- 第一次装如果报 `ERR_PNPM_IGNORED_BUILDS`，跑一次 `pnpm install --allow-build=<包名>` 就好。
- `msgpackr-extract`（bullmq 底下的原生加速模块）和 `core-js`（只打募捐横幅）**故意不编译**，列在 `ignoredBuiltDependencies` 里。

---

## 阶段记录

### 第 0 步 · 搭工程 — 2026-10-27

**做了什么**

- pnpm workspace 单仓：`apps/miniapp`、`apps/server`、`packages/shared`、`tools/shots`，统一 TypeScript 5.9.3 / ESLint 10 flat config / Prettier。
- `packages/shared` 用 tsup 出 ESM + CJS + `.d.ts`，后端（CJS）和小程序端（ESM）各吃一份。品牌名只在 `src/brand.ts` 一处。
- `apps/server`：NestJS 模块化单体，`main.ts` 起 HTTP、`worker.ts` 起 Worker，同一个 `AppModule`（`AppModule.forRole()` 按角色装配），同一个镜像。Drizzle 迁移、BullMQ 队列（只注册不放任务）、`GET /api/v1/health`。
- 微信能力适配器：`WechatAuthPort`、`CloudRunIdentityPort`、`SubscribeMessagePort`、`ContentSecurityPort`，各有假实现；`WECHAT_DRIVER=fake|real` 切换。假身份用 `X-Fake-Openid` 请求头换测试用户（`FAKE_USERS` 里配了小明、小红、阿强）。
- `apps/miniapp`：uni-app + Vue 3，请求层三档（cloud / local / mock，由 `vite.config.ts` 按平台和环境在编译期定），平台适配器用 uni-app 条件编译分流，首页调 health 并显示。
- `tools/shots`：Playwright 按 390 × 844 给 H5 预览截图，三套主题各一张，输出到 `.shots/`（不入库）。
- `scripts/gen-theme-css.ts`：从 `docs/design/tokens.json` 生成三套主题共 154 个 CSS 变量。
- 正式名称改成「一起不鸽」：改了 `CLAUDE.md`、`docs/decisions.md`（加第 18、19 条）、`START_HERE.md`、`.claude/rules/miniapp.md`；`docs/spec.md` 只在顶部加了一行注记，正文和设计稿保留历史名。

**验证结果**

| 验了什么 | 命令 | 结果 |
| --- | --- | --- |
| 全仓类型检查 | `pnpm typecheck` | 通过（三个包） |
| 全仓 lint | `pnpm lint` | 通过 |
| 全仓单测 | `pnpm test` | 31 个通过（shared 2、server 25、miniapp 2、另有 2 个在 mocks） |
| Prettier | `pnpm format:check` | 通过 |
| 迁移生成 | `pnpm migrate:gen` | 出 `drizzle/0000_init_app_meta.sql`，列类型是 `datetime(0)` 不是 `timestamp`，符合「时间一律存 UTC」 |
| 后端构建 | `pnpm build:server` | 出 `dist/main.js` 和 `dist/worker.js` |
| 后端起得来、接口通 | `node dist/main.js` + `curl /api/v1/health` | 200，返回 `{"ok":false,"name":"一起不鸽","deps":{"db":"down","redis":"down"},...}`。db/redis 是 down 因为当时 Docker 没开——健康检查没崩，按设计降级了 |
| 统一错误格式 | `curl /api/v1/nope` | `{"code":"NOT_FOUND","message":"找不到要看的内容。","requestId":"..."}` |
| 小程序编译 | `pnpm build:mp` | 成功，`dist/build/mp-weixin` 下 `app.json`/`app.js`/`app.wxss`/`project.config.json`/页面文件齐全；条件编译选中了真的微信适配器，`__API_MODE__` 替换成 `cloud` |
| H5 预览 | `pnpm dev:h5` | `http://localhost:5173` 打得开，显示 mock 档的 health 结果和「一起不鸽」 |
| 截图 | `pnpm shots` | 三套主题各一张，贴纸风和清爽风视觉明显不同（底色、描边、投影、主按钮都变了），说明主题变量链路通了 |
| 生产产物可用 | `pnpm --filter @yiqi/server deploy --prod` | 产物自带 `dist/`、`drizzle/` 和 `@yiqi/shared` 的 CJS+ESM，`require('@yiqi/shared')` 拿得到 `APP_NAME` |
| 数据库迁移真跑 | `pnpm dev:db` + `pnpm migrate` | 建出 `app_meta` 和 `__drizzle_migrations`；库里 `@@global.time_zone` 和 `@@session.time_zone` 都是 `+00:00`，`updated_at` 落成 `datetime`，「时间一律存 UTC」在数据库层坐实了 |
| 后端接口测试 | `pnpm test:e2e` | 2 个通过，连的是真 MySQL + Redis |
| 全链路（真依赖） | `pnpm dev:server` + `curl /api/v1/health` | `{"ok":true,...,"deps":{"db":"up","redis":"up"}}` |
| Worker 进程 | `node dist/worker.js` | 起得来，日志里 `ScheduleModule` 只在 worker 角色加载，`AppModule.forRole()` 的按角色装配生效 |
| Dockerfile 构建 | `docker build -f apps/server/Dockerfile -t yiqi-server .` | 成功，镜像 364MB |
| 镜像跑起来 | `docker run ... yiqi-server` | 配齐 `WECHAT_DRIVER=real` + 凭据时正常启动，容器里 `curl /api/v1/health` 返回 `ok:true`、`db:up`、`redis:up` |
| 假开关防线（在正式镜像里） | 同上但 `WECHAT_DRIVER` 留默认 | 容器退出码 1，日志第二行就是中文原因「正式环境（NODE_ENV=production）不允许用微信能力的假实现…」 |

**顺手修掉的两个问题**

- ESLint 加了一条硬规则：禁止 `toLocaleDateString` / `toLocaleTimeString` / `Intl.DateTimeFormat`（`packages/shared/src/time/**` 除外），把 CLAUDE.md 的「不手写日期格式」变成 lint 不过。用探针文件验过会报错，而数字的 `toLocaleString` 不受影响（V1.1 记账要用）。
- 统一错误返回原本会把 NestJS 自带的英文文案（`Cannot GET /x`）直接吐给用户，违反「message 用中文」。改成只认带中文的 message，其余换中文兜底，并补了 6 条单测。

**补验时又修掉的两件事**

- **MySQL 容器端口从 3306 改成 3307**。本机装了 MySQL 服务占着 3306，容器起不来（`ports are not available`）。没去动已装的那个 MySQL，改成把容器映射到宿主机 3307；`docker-compose.yml` 和 `.env.example` 都跟着改了。换机器部署时注意这个端口不是默认值。
- **`request_id` 只能是 ASCII**。接口测试里原本用了中文的 `req-测试-1`，Node 直接拒发：HTTP 头的值不允许非 Latin-1 字符。小程序端的 `newRequestId()` 生成的是 base36，天然没问题，已在代码注释和测试里写清楚。

---

## 待确认问题

按发现的顺序编号，解决后把结论写进 `docs/decisions.md` 并在这里划掉。

1. **`PATCH` 发不出去（影响阶段 2）**。微信的 `wx.request` / `uni.request` 只认 OPTIONS、GET、HEAD、POST、PUT、DELETE、TRACE、CONNECT，**没有 PATCH**。而 `docs/spec.md`「核心接口」写的是 `PATCH /plans/{id}`。要改成 `PUT /plans/{id}` 还是 `POST /plans/{id}/update`？阶段 2 做计划编辑前要定。现在 `apps/miniapp/src/request/types.ts` 的 `HttpMethod` 已经去掉了 PATCH。
2. ~~**多币种和 `circle.currency`（影响阶段 1）**~~ —— 已定，见 `docs/decisions.md` 第 20 条（2026-10-28）：**不建**，V1.1 做 AA 记账时再加。关键依据是「创建者所在地区」这个信号已经以 `circle.timezone` 存下来了，以后推得出来，没有信息损失。
3. **主题 store 用什么（影响阶段 1）**。pinia 所有在用的版本都要 `vue ^3.5.11`，和 uni-app 锁的 Vue 3.4.21 对不上，所以第 0 步没装。主题 store 很小（当前主题 + 存到本地缓存），建议直接用 Vue 的 `ref` 写个 composable，不引 pinia；真要用 pinia 得先确认老版本能不能配 Vue 3.4。
4. **token 里的 px 要不要换成 rpx（影响阶段 1）**。`.claude/rules/miniapp.md` 要求设计稿的 px 乘 750/390 换成 rpx。生成器现在按 tokens.json 原样输出 px —— 因为 `border` 和 `shadow` 的值是「2.5px solid #2A1E16」这种复合字符串，要解析里面的 px 才能换。阶段 1 做主题系统时定。
5. ~~**原生导航栏用不了主题变量（影响阶段 1）**~~ —— 已定，见 `docs/decisions.md` 第 21 条（2026-10-28）：**全局 `navigationStyle: "custom"`**，顶部导航自己画成组件。查设计稿发现这其实没得选：25 个手机页面全都从 `top: 0` 开始、自绘 44px header、右上角留了胶囊位，根本没给原生导航栏留空间。三个实现坑（状态栏高度、胶囊实测位置、H5 没有胶囊）记在 `.claude/rules/miniapp.md`「顶部导航」。
6. **云托管的身份请求头名字要按官方文档核对**。`apps/server/src/wechat/real/real-cloud-run-identity.ts` 和 `apps/miniapp/src/env.d.ts` 里按 `x-wx-openid` / `x-wx-from-openid` 写的，`.claude/rules/server.md` 要求「以微信云托管官方文档为准」，接云托管时核一遍。
7. **字体还没接**。三套主题要「站酷快乐体」和「思源黑体」，现在只在 CSS 变量里写了字体名，没加载字体文件，H5 截图里是系统默认字体。阶段 1 要决定怎么引（小程序不能用网络字体 `@font-face` 加载本地文件要用 `wx.loadFontFace`）。
8. **图片存储（影响阶段 1）**。`spec.md` 选型表写的是腾讯云 COS，`CLAUDE.md` 说第 1 阶段定。`.env.example` 里留了 `COS_BUCKET`、`COS_REGION` 占位。
9. **提审前要查的两个开关（阶段 5）**。`apps/miniapp/src/manifest.json` 里 `mp-weixin.setting.urlCheck: false`（方便本地联调关掉域名校验），提审前确认要不要改回 true。另外后端已经做了硬拦截：`NODE_ENV=production` 配 `WECHAT_DRIVER=fake` 时直接启动失败。

### 仓库之外

`D:\一起恰-仓库起步包\` 下除了 `yiqibuge\`（就是本仓库）之外，还有一份同样的 `CLAUDE.md`、`START_HERE.md`、`docs\`、`.claude\`，以及一个 `一起恰-仓库起步包\` 子目录，看着是解压残留。开发只在 `yiqibuge\` 里进行，那些副本没动过，要清理请自行处理。

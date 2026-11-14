# 开发进度

每做完一个阶段往这里追加一段（`/phase-done` 的第 5 步刚好产出这些内容）。

## 当前状态

- **阶段**：阶段 1 · 主题、组件、登录、群组 —— 已完成（2026-10-30），2026-11-07 合入 `main`
- **部署**：首次部署云托管的代码已备好（2026-11-07），线上还没发布过。步骤见 `docs/platform-checklist.md`「部署到微信云托管」
- **审查**：2026-11-14 做了一次全仓审查，修正在 `chore/audit-2026-11` 分支上，还没合入 `main`。见「全仓审查」和「待确认」第 18–22 条
- **本机要做的**：把 Node 升到 24.22.2 以上。现在的 v24.15.0 在这台 Windows 上跑接口测试约四分之一的概率崩溃，见「首次部署准备」的已知问题
- **下一步**：阶段 2 · 时间文案、发起计划、计划详情、表态（开工前先定下面「待确认」的 1、10、11）
- **上一步**：第 0 步 · 搭工程，已完成并全部验证过（2026-10-27）

---

## 环境与版本

本机实测（2026-10-27）：Node v24.15.0、pnpm 12.15.0、Docker 29.4.2 + Compose v5.1.3、git 2.45.1。

**Node 要 24.22.2 以上**（2026-11-07）：更老的 24.x 在 Windows build 26200 上会随机崩溃，见「首次部署准备」的已知问题。线上镜像用 `node:24-alpine`，构建时拿到的是最新的 24.x。

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
- `msgpackr-extract`（bullmq 底下的原生加速模块）和 `core-js`（只打募捐横幅）的安装脚本**故意不跑**，列在 `ignoredBuiltDependencies` 里。注意 `msgpackr-extract` 的预编译包是可选依赖，照样会装上、被 BullMQ 加载，跳过的只是编译。

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
| Dockerfile 构建 | `docker build -t yiqi-server .` | 成功，镜像 364MB（当时 Dockerfile 还在 `apps/server/`，2026-10-30 为适配云托管挪到了仓库根，构建上下文和指令都没变） |
| 镜像跑起来 | `docker run ... yiqi-server` | 配齐 `WECHAT_DRIVER=real` + 凭据时正常启动，容器里 `curl /api/v1/health` 返回 `ok:true`、`db:up`、`redis:up` |
| 假开关防线（在正式镜像里） | 同上但 `WECHAT_DRIVER` 留默认 | 容器退出码 1，日志第二行就是中文原因「正式环境（NODE_ENV=production）不允许用微信能力的假实现…」 |

**顺手修掉的两个问题**

- ESLint 加了一条硬规则：禁止 `toLocaleDateString` / `toLocaleTimeString` / `Intl.DateTimeFormat`（`packages/shared/src/time/**` 除外），把 CLAUDE.md 的「不手写日期格式」变成 lint 不过。用探针文件验过会报错，而数字的 `toLocaleString` 不受影响（V1.1 记账要用）。
- 统一错误返回原本会把 NestJS 自带的英文文案（`Cannot GET /x`）直接吐给用户，违反「message 用中文」。改成只认带中文的 message，其余换中文兜底，并补了 6 条单测。

**补验时又修掉的两件事**

- **MySQL 容器端口从 3306 改成 3307**。本机装了 MySQL 服务占着 3306，容器起不来（`ports are not available`）。没去动已装的那个 MySQL，改成把容器映射到宿主机 3307；`docker-compose.yml` 和 `.env.example` 都跟着改了。换机器部署时注意这个端口不是默认值。
- **`request_id` 只能是 ASCII**。接口测试里原本用了中文的 `req-测试-1`，Node 直接拒发：HTTP 头的值不允许非 Latin-1 字符。小程序端的 `newRequestId()` 生成的是 base36，天然没问题，已在代码注释和测试里写清楚。

### 阶段 1 · 主题、组件、登录、群组 — 2026-10-30

方案和定下的规则见 `docs/decisions.md` 第 22–26 条。

**做了什么**

- **主题**：`docs/design/tokens.json` 补齐设计稿里有的值（决定第 25 条；走查时又补了 `tilt.scale`，清爽风不歪着贴）。生成器 `apps/miniapp/scripts/gen-theme-css.ts` 重写成「角色表」：三套主题生成同一套 179 个 CSS 变量，px 换成 rpx，任何一套缺了角色就报错。主题 store 是一个模块级 `ref`（`src/theme/useTheme.ts`）：本地缓存 `yq.theme`，登录了存到用户设置，登录后以服务端为准。
- **插画和图标**：从三套设计稿的 `<symbol>` 抽出 22 个插画（`src/static/themes/<主题>/`），线性图标做成按主题切换的 CSS mask（`src/styles/icons.css`），群头像图标块、白鸽、月度鸽王的披风另外生成。命令 `pnpm -F @yiqi/miniapp gen:art`。
- **组件**（`src/components/`，23 个）：按钮、标签、卡片、头像（含三种鸽王头套版）、头像叠放、底部弹层、确认卡、改文字弹层、选一项弹层、顶部导航（按胶囊实测位置对齐）、底部导航（三套几何不同）、空状态、设置行和分组、开关、输入框、分段标签、群头像图标块、邀请码格子、悬浮按钮、图标、插画、页面根节点。演示页 `pages/dev/components` 对上设计稿 Main。
- **登录**（决定第 22 条）：不调 `wx.login`，`POST /auth/wechat` 按云托管注入的 openid 建用户或取用户；请求层收到 `NOT_LOGGED_IN` 先登录再重试一次。登录页用头像昵称填写组件，勾选协议才能开始。
- **后端**：`app_user`、`circle`、`circle_member`、`circle_join_request` 四张表（迁移 `drizzle/0001_phase1_users_circles.sql`）；全局 Guard 按 openid 找人；群组、成员、入群审核、退群、移出、转让、解散、邀请、加入的接口；业务错误码透传；文本过内容检测（假实现）；本地联调的传图接口只在 `WECHAT_DRIVER=fake` 时注册。加入、审核在事务里锁群那一行，并发也不会超过 100 人。
- **小程序页面**：主壳（启动页，群组列表 + 三个占位 tab，决定第 26 条不用原生 tabBar）、建群、群组主页（鸽榜是假数据，`src/fakes/pigeon-board.ts`）、群设置（群主版、成员只读版，都加了「我在本群」）、邀请、加入落地页、主题选择、登录、用户协议占位。
- **H5 假数据**：`src/mocks/` 换成按路径模式匹配的内存仓库，内容照设计稿；后端还返回空值的字段（鸽王、和平周、进行中 N、落地页统计）在 H5 里按设计稿给值，走查看得到。
- **共用包**：主题列表和文案、DTO 类型、邀请码（生成、全角和大小写整理、校验）、群组规则（退群、移出、转让、解散的拦截，`planExitOutcome` 的 24 小时规则）、字母头像、时间文案（月日、周范围、揭晓倒计时、时区名、UTC 偏移）、鸽值四档。

**验证结果**

| 验了什么 | 命令 | 结果 |
| --- | --- | --- |
| 全仓类型检查 | `pnpm typecheck` | 通过（shared、server、miniapp、shots 四个包） |
| 全仓 lint | `pnpm lint` | 通过 |
| 全仓单测 | `pnpm test` | 161 个通过：shared 98（含邀请码、退群规则、时间文案）、server 30、miniapp 33（含主题 store、生成器、假数据、假鸽榜） |
| 后端接口测试 | `pnpm test:e2e` | 47 个通过，用独立的 `yiqibuge_test` 库：建群 → 邀请 → 用码和 token 加入（大小写、全角、过期、满员、重复）→ 审核 → 移出后再申请 → 权限 → 退群 → 转让 → 解散 → 内容检测，外加审查后补的 3 个（见下面「审查」） |
| 并发加入 | 接口测试 | 群里 99 人时两个人同时加入：一个 200、一个 409 |
| 小程序编译 | `pnpm build:mp` | 成功，815K；组件样式里的 px 都换成了 rpx。H5 的假数据不进小程序包（只有 dev 演示页引用了 `mocks/people`，阶段 5 连页面一起拿掉） |
| 走查 | `pnpm shots` + 对照设计稿 | 8 个页面 × 3 套主题，结果见下 |
| 流程 | H5 预览里点一遍 | 建群 → 邀请页 → 返回列表；成员退群；群主移出成员；输入小写邀请码 → 落地页，都走得通 |
| 格式 | `pnpm format:check` | 通过 |

**走查（/design-check）**

| 页面 | 结果 | 有意的差异 |
| --- | --- | --- |
| Main（组件演示页） | 对上 | 品牌名；右上角写「主题 N / 3 · 用户在设置里切换」；贴纸风的「方案 B · 未采用」统一换成软糖风、清爽风那种结构；颈羽色块用 token 颜色；清爽风选中卡加了选中圈 |
| Login | 对上（修了卡片标题行高；清爽风三个小标签摆正） | 品牌名 |
| Groups | 对上 | 无 |
| GroupHome | 对上 | 周范围和倒计时是真实的当周；H5 的任务卡用了 GroupSettings 里那句长的，横幅里截断 |
| GroupSettings | 对上（修了行高：分隔线不算在行高里；任务卡框撑满一行） | 加了「我在本群」（群昵称、退出群组） |
| Invite | 对上（修了卡片示意里多出来的「+4」） | 卡片配图阶段 3 才画，现在发出去是微信默认的页面截图，页面上那张只是示意；海报点了提示「后面的阶段上线」 |
| JoinLanding | 对上（修了清爽风群头像不该歪） | 「群里在约」和「近期 N 个计划」要用阶段 2 的计划时间文案，先不显示；成员头像按入群先后排 |
| ThemePicker | 对上 | 软糖风小样左下角的小星星没画；五个色块统一取「底色、强调色、鸽王黄、成局绿、鸽子灰」，个别颜色和设计稿不同 |

没改的小差异：清爽风「4 天 21 小时后揭晓」标签的字是蓝色（用的是「招募中」标签配色），设计稿是黑字；「邀请好友」「群设置」两个小按钮高 25（沿用 Main 的 mini 档），设计稿约 28；「保存到相册」「复制」高 30，设计稿约 34。

**和方案的出入**

- 多了三个组件：`YqTextSheet`、`YqOptionSheet`（群设置的各个编辑弹层）、`pages/circle/CircleAvatarGrid.vue`（建群和群设置共用的选群头像）。
- 群组主页默认停在「计划」tab（spec 的顺序），设计稿截的是鸽榜；走查用 `?tab=board`。主题选择页走查用 `?preview=next`（选中下一套，和设计稿画的状态一样）。

**审查（/phase-done 第 3 步，子代理在新上下文里看了 main...phase-1 的全部改动）**

没有高危问题。100 人上限在并发下守得住、非成员一律 404、被移出的人一律要审核、邀请码字符集和全角大小写、UTC 存储、品牌名、正式环境拒绝假实现，这些都核对过。查出来并已经修掉的：

- **群主用补 0 的 id 能把自己移出群**（`DELETE /circles/12/members/07`）：规则函数按字符串比「是不是自己」，「07」≠「7」，群就没有群主了、谁也管不了。改成按解析后的数字比；转让同样处理。接口测试补了。
- **退群、移出、转让、解散不加锁**：先查后改，同时发生时可能出现「转让给正在退群的人」（群主状态是已退群）或「被移出的人状态落成已退群、回来不用审核」。改成都在事务里先锁群那一行再重新查（`CircleStore.lockForMember`），审核同意也在锁里确认还是群主。接口测试补了「转让和退群同时发」。
- **解散的群，拿着旧邀请还能在落地页接口看到群名和成员**：改成只返回「已解散」。
- **审核开着时申请过、后来群主关了审核**：落地页还显示「等群主同意」、按钮灰着。改成按能直接加入显示，加入时把旧申请一并了结（被移出过的人照样要审核）。接口测试补了。
- **「递补后 2 小时内退出不计鸽」**（docs/spec.md「满员后有人鸽了」）：`planExitOutcome` 没有这条，补上 `promotedAt` 参数和单测，阶段 2 接计划时直接用。
- **页面里手写的时刻**：群设置的「每周一 10:00 揭晓」、鸽榜提示语的「周日 24:00」改成共用包的 `revealRuleText()`、`weekDeadlineText()`；落地页「7 天」改用 `INVITE_TTL_DAYS`。

没改、要你定的：见「待确认」第 15 条（开了「仅群主可邀请」以后，之前发出去的邀请还能用到过期）。另外审查提醒云托管只走 callContainer 时要关掉公网访问，已写进 `docs/platform-checklist.md`。

**顺手修掉的问题**

- 并发登录时第二个请求报 500：Drizzle 把 MySQL 的 `ER_DUP_ENTRY` 包在 `error.cause` 里，判重认不出来。加了 `apps/server/src/db/errors.ts` 的 `isDuplicateKey`，登录和换邀请码都用它。
- 本地传的图读不出来（404）：Express 的 `sendFile` 默认不认点开头的目录（`.uploads/`），改成用 `root` 选项。

**已知问题**

- `apps/server` 的 `health.service.spec.ts` 第一个用例在 `pnpm test` 三个包并行跑时出现过一次超过 5 秒超时（Nest TestingModule 冷启动），单独跑 95ms 通过。先记着，再出现就把这个文件的超时调大。
- 改了 `packages/shared` 以后：要先 `pnpm -F @yiqi/shared build`；H5 预览要停掉、删 `apps/miniapp/node_modules/.vite` 再起，不然 Vite 预打包的旧版共用包里没有新导出，页面直接白屏（这次碰到了）。
- 这些只能在微信开发者工具里看（H5 预览替代不了）：CSS 变量里的 rpx、mask 图标、SVG 插画、`loadFontFace`、顶部导航和胶囊对齐、头像昵称填写、分享卡片、组件标签上写的 class 能不能落到组件根节点上。

### 首次部署准备 — 2026-11-07

决定见 `docs/decisions.md` 第 27–30 条，操作步骤见 `docs/platform-checklist.md`「部署到微信云托管」。

**查到的问题**（用生产镜像 + 全新空库实测出来的）

- 没有东西跑迁移：部署上去 `health` 报 `db:down`，登录 500（`Table 'app_user' doesn't exist`）。
- 两个实例同时迁移，后到的报 `Table 'app_meta' already exists`，3 轮都这样。
- 开发者工具一直是游客模式（`touristappid`）：AppID 填在了顶层，`mp-weixin.appid` 是空的，`wx.cloud` 用不了。
- `WX_APP_SECRET` 是启动必填项，但没有代码读它。

**改了什么**

- `Dockerfile`：换腾讯 npm 镜像；只装后端依赖；启动时先跑迁移再起服务。
- `apps/server/src/db/migrate.ts`：加 `GET_LOCK`，多实例同时启动时排队。
- `apps/server/src/config/env.ts`：`WECHAT_DRIVER=real` 不再要求 AppID 和 AppSecret，正式环境拒绝假实现的断言保留。
- `apps/miniapp/src/manifest.json`：AppID 挪到 `mp-weixin.appid`，顶层留空。

**验证结果**

| 验了什么 | 结果 |
| --- | --- |
| `pnpm typecheck`、`lint`、`format:check` | 通过 |
| `pnpm test` | 160 个通过：shared 98、server 29、miniapp 33 |
| `pnpm test:e2e` | Node 24.22.2 上 47 个全过，连跑 30 次无崩溃；Node 24.15.0 上随机崩溃，见下面「已知问题」 |
| 接口测试放进 Linux 容器（Node 24.22.2，和线上同一套基础镜像） | 连跑 12 次，47 个全过 |
| `pnpm build:mp` | 成功，`project.config.json` 的 `appid` 是真实 AppID |
| 镜像构建 | 成功，365MB |
| 两个容器同时启动，指向同一个空库 | 都起来了，各跑一次迁移没报错，6 张表、2 条迁移记录 |
| 重启已迁移的容器 | 正常 |
| 带 `x-wx-openid` 登录 | 200；不带身份头、只带假身份头都是 401 |
| `REDIS_URL` 占位 | 登录正常，运行约 4 分钟进程没崩；`health` 约 10 秒后返回 `ok:false`、`redis:down` |
| Worker 启动命令 | 能起，不跑迁移 |
| 数据库连不上 | 容器退出码 1 |
| 正式环境留着假驱动 | 容器退出码 1，日志写明原因 |

**没验证到的**：微信云托管的线上构建、真实的 callContainer 请求、云托管 MySQL。这些要发布后才知道。

**已知问题**

- **接口测试在 Node 24.15.0 上随机崩溃，升级 Node 解决**。现象是 `Error: Channel closed`，Vitest 子进程退出码 `0xC0000409`，没有 stderr、没有 JS 栈，Windows 事件日志和 `--report-on-fatalerror` 都没有记录。这是 Node 在 Windows build 26200 上的已知问题 [nodejs/node#62260](https://github.com/nodejs/node/issues/62260)（还开着），里面有人的环境和这台机器一样（Node 24.15.0、build 26200）。和我们的代码无关。

  | 环境 | 运行次数 | 崩溃 |
  | --- | --- | --- |
  | Windows，Node 24.15.0 | 63 | 16（约 25%） |
  | Windows，Node 24.15.0 + `--no-maglev` | 21 | 1（少了，没根除） |
  | Windows，Node 24.22.2 | 62 | 0 |
  | Linux 容器，Node 24.22.2 | 12 | 0 |

  已排除：具体测试文件（去掉 `join`、只跑 `join` 都会崩）、`app.close()`（也崩在测试中途）、每个文件换进程（`singleFork` 没用）、`msgpackr-extract` 原生模块（关掉还崩）。不走 Vitest 的子进程时跑 60 次没复现，和 issue 里「要走测试运行器的子进程路径」一致。没定位到是 Node 的哪个改动修好的：24.x 的 V8 版本都一样，libuv 从 1.51.0 升到了 1.52.1，这只是线索。只实测了 24.22.2，issue 里有人报告 24.19.0 也不崩。
- **本机 Docker 构建偶尔报 `EAI_AGAIN`**：构建容器第一次解析某个域名时超时，和代码、镜像源都无关。先 `docker run --rm node:24-alpine node -e "require('dns').lookup('<域名>',console.log)"` 解析一次再构建就好。

**顺手修掉的问题**

- 换到 Node 24.22.2 后暴露了一个写窄的测试：`membership.e2e-spec.ts`「转让给小红的同时小红在退群」只接受转让先到（`200,409`），退群先到（`204,409`）也是合法结果。24.15 上恰好总是转让先到，24.22.2 上约三成是退群先到，断言失败。改成两种都接受，后面「群里总有一个在群里的群主」的检查不变。不是后端 bug。
- `pnpm-workspace.yaml` 里写的「`msgpackr-extract` 故意不装」不对，改了注释：跳过的只是编译，预编译包照样会装上。

### 全仓审查 — 2026-11-14

把整个仓库读了一遍，找坏掉的、不一致的、低效的、用不到的。确定的直接修了，拿不准的记在「待确认」第 18–22 条。改动在 `chore/audit-2026-11` 分支上。

**改了什么**

- 后端
  - 队列改成只给 BullMQ 地址，由它自己建、自己关连接。原来传的是共享的 ioredis 实例，`app.close()` 之后连接不断开，进程退不掉。
  - Redis 客户端和队列都挂了 error 监听（`src/redis/connection-log.ts`）：同一条错误只记一行，约每 10 分钟再提醒一次，连回来时记一行。
  - `health` 查数据库和 Redis 各最多等 2 秒。
  - 加群时在锁里判断群是否已解散。原来只在上锁前看，查邀请和上锁之间群主刚好解散的话，人会被加进已解散的群。
  - 删掉 `WechatAuthPort`（接口和真假实现），以及只有它在读的 `WX_APPID`、`WX_APP_SECRET`、`FAKE_USERS`。
  - 没单独列出的 4xx（比如 413）不再报成 `INTERNAL_ERROR` 和「服务器出了点问题」；413 单独给 `PAYLOAD_TOO_LARGE`。
  - Worker 启动日志、`app_meta` 注释里过时的说法；`health.e2e-spec` 改用 `test/app.ts` 的 `createTestApp`。
- 小程序
  - cloud 档 `callContainer` 抛错时提示「网络不太好，稍后再试。」，不把微信的英文 errMsg 弹给用户。
  - 群卡片横条的底色先看 `pigeonEnabled`，和横条内容用同一套判断。
  - 三处小的不一致：文字弹层保存中「算了」也禁用；登录页昵称上限用 `NICKNAME_MAX`；两个 `.env` 的注释不再提 `FAKE_USERS`。
- 文档：`platform-checklist` 里 health 耗时、日志的说法和「callContainer 已定」；待确认第 16、17 条。

**验证结果**

| 验了什么 | 结果 |
| --- | --- |
| `pnpm typecheck`、`lint`、`format:check` | 通过 |
| `pnpm test` | 166 个通过：shared 98、server 35、miniapp 33 |
| `pnpm test:e2e`（Linux 容器，Node 24.22.2） | 47 个全过，连跑 3 次 |
| `pnpm build:mp` | 成功 |
| Redis 没开，后端跑 30 秒 | 日志只有 2 行（`[Redis]`、`[Queue]` 各一行）；原来每分钟上百行 |
| 后端运行中停掉 Redis 12 秒再启动 | 停的时候各记一行，启动后约 5 秒各记一行「重新连上了」 |
| 只有 Redis 没开时的 `health` | 0.4–1.7 秒返回 `db:up`、`redis:down`；原来约 10 秒。两个都没开时 0.5–1.6 秒 |
| 都开着时的 `health` | 2–52 毫秒，`db:up`、`redis:up` |
| `app.close()` 之后 | 进程自己退出；原来 8 秒后还挂着 |
| 重新跑 `gen:theme`、`gen:art` | 和仓库里的生成文件完全一致 |
| H5 预览的群组列表 | 四张卡横条的底色和内容对得上，控制台没有报错 |

**顺带发现**

- 本机开发库 `yiqibuge` 还停在第 0 步：只有 `app_meta`，没有阶段 1 的四张表，本地起后端登录会报错。已经补跑 `pnpm migrate`（接口测试用的是 `yiqibuge_test`，自己会迁移，所以一直没暴露）。
- 之前下载的 Node 24.22.2 便携版已经清掉了。本机还是 v24.15.0，接口测试要么在 Docker 里跑，要么先升级 Node。

---

## 待确认问题

按发现的顺序编号，解决后把结论写进 `docs/decisions.md` 并在这里划掉。

1. **`PATCH` 发不出去（影响阶段 2）**。微信的 `wx.request` / `uni.request` 只认 OPTIONS、GET、HEAD、POST、PUT、DELETE、TRACE、CONNECT，**没有 PATCH**。而 `docs/spec.md`「核心接口」写的是 `PATCH /plans/{id}`。要改成 `PUT /plans/{id}` 还是 `POST /plans/{id}/update`？阶段 2 做计划编辑前要定。现在 `apps/miniapp/src/request/types.ts` 的 `HttpMethod` 已经去掉了 PATCH。
   - 阶段 1 的群设置已经用了 `PUT /circles/:id` 做部分更新（只传要改的字段），计划编辑可以照这个写法。
2. ~~**多币种和 `circle.currency`（影响阶段 1）**~~ —— 已定，见 `docs/decisions.md` 第 20 条（2026-10-28）：**不建**，V1.1 做 AA 记账时再加。关键依据是「创建者所在地区」这个信号已经以 `circle.timezone` 存下来了，以后推得出来，没有信息损失。
3. ~~**主题 store 用什么（影响阶段 1）**~~ —— 已定（2026-10-30 阶段 1 方案）：用 Vue 的 `ref` 写成 composable（`apps/miniapp/src/theme/useTheme.ts`），不引入 pinia。
4. ~~**token 里的 px 要不要换成 rpx（影响阶段 1）**~~ —— 已定（2026-10-30 阶段 1 方案）：生成器把复合值里的 px 也解析出来，乘 750/390 换成 rpx；1px 细线和 999px 胶囊圆角保持原样。H5 预览在 `pages.json` 里把 rpx 的计算宽度固定成 390，这样 1240 宽截 Main 时和设计稿是 1:1。
5. ~~**原生导航栏用不了主题变量（影响阶段 1）**~~ —— 已定，见 `docs/decisions.md` 第 21 条（2026-10-28）：**全局 `navigationStyle: "custom"`**，顶部导航自己画成组件。查设计稿发现这其实没得选：25 个手机页面全都从 `top: 0` 开始、自绘 44px header、右上角留了胶囊位，根本没给原生导航栏留空间。三个实现坑（状态栏高度、胶囊实测位置、H5 没有胶囊）记在 `.claude/rules/miniapp.md`「顶部导航」。
6. ~~**云托管的身份请求头名字要按官方文档核对**~~ —— 已核对（2026-11-07）：官方就是 `X-WX-OPENID`、`X-WX-UNIONID`，资源复用时是 `X-WX-FROM-OPENID`、`X-WX-FROM-UNIONID`，和代码一致（Express 收到的头名都是小写，代码按小写读）。真实的云托管请求还没验证过，第一次连通时看一眼。
7. ~~**字体还没接**~~ —— 已定，见 `docs/decisions.md` 第 24 条（2026-10-30）：H5 预览从 Google Fonts 加载；小程序里正文用系统字体，快乐体运行时用 `uni.loadFontFace` 从云存储加载，失败就退回系统字体。
8. ~~**图片存储（影响阶段 1）**~~ —— 已定，见 `docs/decisions.md` 第 23 条（2026-10-30）：微信云托管对象存储，库里存 `cloud://` 文件 ID。`.env.example` 里的 `COS_BUCKET`、`COS_REGION` 占位不再需要。
9. **提审前要查的几项（阶段 5）**。
   - `apps/miniapp/src/manifest.json` 里 `mp-weixin.setting.urlCheck: false`（方便本地联调关掉域名校验），提审前确认要不要改回 true。
   - AppID 已填好（2026-11-07）：`mp-weixin.appid` 是真实的微信 AppID，顶层 `appid` 留空。**更正**：这里原来写「顶层 appid 是 uni-app 生成的 DCloud ID」是错的，提交 `2fe8017` 的说明也一样。那个值就是微信 AppID，只是填错了位置（uni 的 ID 都是 `__UNI__` 开头，也没有代码回写 manifest）。
   - uni 统计已经显式关掉（`uniStatistics.enable: false`），正式产物里核对过没有任何上报端点。但 uni-app 运行时仍会在本地存一个设备标识 `__DC_STAT_UUID`（只落在小程序自己的 storage 里，不外发），填「用户隐私保护指引」时留意要不要声明。
   - 后端这边已经是硬拦截，不用人查：`NODE_ENV=production` 配 `WECHAT_DRIVER=fake` 时直接启动失败，正式镜像里验证过。
   - `pages/dev/components`、`pages/dev/health` 两个开发页面要从 `pages.json` 里拿掉（「我的」里的入口只在非 cloud 档出现，但页面本身还在包里）。
10. **发起人退群时，自己发起、还没开始的计划怎么办（阶段 2）**。现在只定了参与者那边的规则（`planExitOutcome`：开始前 24 小时内已跟的算鸽了）。发起人走了，计划是取消、转给别人，还是留着没人管？做计划时要定。
11. **群组列表上「进行中 N」按什么算（阶段 2）**。现在恒为 0。是「还没开始的计划数」，还是「招募中 + 已成局、还没结束的」？
12. **用户协议正文和隐私保护指引（阶段 4）**。`pages/legal/agreement` 现在是占位文案。另外从加入落地页直接加入的人没有勾选同意协议这一步，要不要补，和合规一起看。
13. **邀请码手动重新生成、邀请海报和小程序码（阶段 3）**。现在邀请过期后打开邀请页自动换新，没有手动「重新生成」的入口（设计稿里也没有）；海报只占了位。
14. **按钮高度**：设计稿的中号按钮是 46，`docs/spec.md` 写的是「主要按钮高度不低于 48」。现在按设计稿做，长辈友好要不要整体加高，阶段 4 走查时定。
15. **开了「仅群主可邀请」，之前发出去的邀请还能用（影响阶段 1）**。三种邀请全群共用一个 token 和邀请码（决定第 26 条），分不出是谁发的；群主打开这个开关时没有换新，所以成员之前转出去的卡片和邀请码在 7 天内照样能进群。两种做法：① 打开开关时立刻换一套新邀请（群主自己发出去的也一起失效）；② 维持现状，最多 7 天后自然失效。审查时发现，还没改。
16. **Redis 怎么解决（阶段 3 之前要定）**。云托管不能直接开 Redis（决定第 29 条）。要么买腾讯云上海地域的 Redis，走私有网络，持续付费；要么提醒任务改用云托管定时触发器（spec 选型表的备选），但要重新评估「精确到分钟的延时任务」这条要求。（原来这里记的「连不上时每分钟约 170 行重连日志」已经修掉，2026-11-14：每个连接只记一行，同样的错误约每 10 分钟再记一次。）
17. ~~**`WechatAuthPort` 已经没人用了**~~ —— 已删（2026-11-14）：`WechatAuthPort` 的接口、真假两个实现，以及只有它在读的 `WX_APPID`、`WX_APP_SECRET`、`FAKE_USERS` 三个环境变量。旧 `.env` 里留着这几行也能照常启动，不认识的变量会被忽略。
18. **`CLAUDE.md` 的「图片存储在第 1 阶段定」过时了**。决定第 23 条已经定了云托管对象存储。建议改成「图片存在微信云托管对象存储（决定第 23 条）」，等你点头再改。
19. **空的 `QueueModule` 和 Worker 的装配（阶段 3）**。队列现在没有任务，web 进程却要为它连一次 Redis；Worker 也装了 Auth、Health、Circles、Dev 这些 HTTP 模块。都不影响运行。可以现在把队列拿掉、阶段 3 再加，也可以留到阶段 3 一起整理。
20. **不可逆操作的确认按钮用什么样式**。解散、退出、移出、转让的确认卡用的是主按钮；`YqButton` 有给不可逆操作用的 `danger`（鸽子灰）。这几个确认卡没有设计稿。
21. **群设置的开关连点可能停在旧值**。连点两下、两个请求的返回顺序颠倒时，界面显示的是先发那个请求的结果。可以给开关加一个「保存中」锁。
22. **几项纯清理，做不做都行**。
    - 根 `package.json` 的 `cross-env`、`tsx`、`@types/node` 在根目录没人用，删掉要动 `pnpm-lock.yaml`。
    - `pnpm-workspace.yaml` 的 `minimumReleaseAgeExclude` 是 10-27 装依赖时加的冷却期白名单，现在多半用不上了。
    - vitest 运行时有一条「Vite 的 CJS API 已弃用」的警告，把 `vitest.config*.ts` 改名成 `.mts` 能去掉。
    - `feat/step-0-scaffold`、`phase-1` 两个分支已经合入 `main`，可以删。

### 仓库之外

`D:\一起恰-仓库起步包\` 下除了 `yiqibuge\`（就是本仓库）之外，还有一份同样的 `CLAUDE.md`、`START_HERE.md`、`docs\`、`.claude\`，以及一个 `一起恰-仓库起步包\` 子目录，看着是解压残留。开发只在 `yiqibuge\` 里进行，那些副本没动过，要清理请自行处理。

# 上线前要办的平台手续

这些事 Claude Code 替你办不了，要你自己在微信公众平台和腾讯云上操作。和开发同时进行，越早开始越好。规则会调整，办的时候以后台页面和官方文档为准（下面的内容核对于 2026-10-27）。

## 第一周就办
- [ ] **注册小程序（个人主体）**，拿到 AppID；在后台把自己加为开发者，微信开发者工具里登录。
- [ ] **选服务类目**：从「工具」下选效率类子类目。个人主体没有「社交」类目，提审描述突出「活动日程工具」，少用交友、社区一类说法（见 docs/spec.md「主体与类目」）。
- [ ] **小程序备案**：2023 年 9 月起，新小程序要先备案才能上架。在公众平台「设置 › 小程序备案」里按引导办。要等管局审核，官方给小游戏的办结时限是 5–30 个工作日，普通小程序也按几周预留。
- [ ] **开通微信云托管**，和小程序关联。小程序用 `wx.cloud.callContainer` 调后端时，不用在小程序后台配置服务器域名，后端也能直接拿到用户的 openid。
  - 已定只走 `callContainer`（决定第 19 条）：首版不买自己的域名、不做域名备案。方案里「自建后端的域名要 ICP 备案」那条不用办。

## 部署到微信云托管（后端）

这一节核对于 2026-11-07。

**先准备**

- [ ] **开通 MySQL 8.0**：在云托管后台开通，拿到内网地址和账号。库要自己建：库名 `yiqibuge`，字符集选 utf8mb4（群名、昵称里会有 emoji）。迁移只建表，不建库。
- [ ] **基础库最低版本**：小程序后台设到 2.23.0 以上，`callContainer` 要求这个版本。
- Redis 先不用买（决定第 29 条）。云托管不能直接开 Redis，官方做法是买腾讯云**上海地域**的 Redis，在「服务详情 → 设置 → 私有网络设置」里打通。阶段 3 之前用不到。

**新建服务**

在云托管「服务管理 → 新建服务」里建，**不要用它首页那些「免费快速部署」模板**——那些是空白脚手架，我们自己有 `Dockerfile`。

| 字段 | 填什么 |
| --- | --- |
| 选择方式 | 绑定 GitHub 仓库（本仓库是公开的，不用 CLI） |
| 分支 | `main` |
| 端口 | `3000` |
| 目标目录 | **留空**（就是仓库根） |
| Dockerfile 文件 / 名称 | 有 / `Dockerfile` |

目标目录必须留空。`Dockerfile` 放在仓库根就是为了这个：构建上下文要包含 `pnpm-workspace.yaml`、`pnpm-lock.yaml` 和 `packages/shared`，而云托管要求 Dockerfile 与目标目录同级。填成 `apps/server` 会在安装依赖那步失败。

环境变量：

```
DATABASE_URL=mysql://<用户>:<密码>@<内网地址>:3306/yiqibuge?timezone=Z
REDIS_URL=redis://127.0.0.1:6379
WECHAT_DRIVER=real
```

- `DATABASE_URL` **必须连得上**。容器启动时先跑数据库迁移，连不上就起不来，云托管不会切到新版本（决定第 27 条）。
- `REDIS_URL` 现在是占位值，指向一个没有 Redis 的地址。`GET /api/v1/health` 会在 2 秒内返回 `ok:false`、`redis:down`（HTTP 状态码还是 200）。日志里 `[Redis]`、`[Queue]` 各记一行连不上，之后同样的错误大约每 10 分钟再记一次。这些都是预期的，登录和群组不受影响。如果云托管的健康检查要配路径，不要指向 `/health`：它每次都查数据库和 Redis，Redis 占位期间一直是 `ok:false`。
- `WECHAT_DRIVER` 必须是 `real`：配成 `fake` 时后端会拒绝启动（防止假数据开关漏进正式版）。
- 不用填 AppID 和 AppSecret，后端没有这两个变量（决定第 30 条）。不要把 AppSecret 放进云托管。
- `NODE_ENV=production`、`APP_ROLE=web`、`PORT=3000` 已经写在 Dockerfile 里，不用再填。

**发布之后**

- [ ] **关掉公网访问**：小程序只用 `wx.cloud.callContainer` 调后端（决定第 19 条），用不到公网入口，官方也建议关掉。后端按云托管注入的 openid 认人，不留公网入口最省心。
- [ ] **填小程序的环境变量**：把环境 ID 和服务名填进 `apps/miniapp/.env.production` 的 `VITE_CLOUD_ENV`、`VITE_CLOUD_SERVICE`（不是秘密，可以入库），重新 `pnpm build:mp`，在微信开发者工具里连起来测。
- 绑定 GitHub 后云托管会生成流水线，之后往 `main` 推代码可能会自动部署。`main` 就是线上分支（决定第 28 条），以流水线的实际设置为准。

Worker 以后部署成**第二个服务**，同一个镜像，启动命令改成 `node dist/worker.js`、环境变量 `APP_ROLE=worker`。Worker 不跑迁移，只有 web 服务负责。

## 开发期间办
- [ ] **订阅消息模板**：按 docs/spec.md「通知矩阵」和「订阅消息额度策略」，在公众平台的订阅消息里挑一次性订阅模板，记下模板 ID 交给开发。个人主体只能用一次性订阅。
- [ ] **用户隐私保护指引**：在小程序后台填写，把用到的接口（选择位置、头像昵称、保存图片到相册等）全部声明。阶段 1 已经用到的：
  - 头像昵称填写（登录页的「选择头像」按钮和昵称输入框）
  - 选中的照片（建群、群设置里给群头像传照片，用的是 `chooseImage`）
  - 剪切板（邀请页「复制」邀请码）
- [ ] **云托管对象存储的权限**（决定第 23 条）：头像、群头像存在这里，群友要能看到彼此的图，所以读权限设成「所有用户可读」，写入只允许上传的人。具体选项名以云托管后台为准。
- [ ] **上传站酷快乐体字体文件**（决定第 24 条）：把字体文件传到云存储，拿到 https 地址填进小程序构建的环境变量 `VITE_FONT_DISPLAY_URL`。`loadFontFace` 加载网络字体要求跨域放行小程序（官方文档写的来源是 `servicewechat.com`），在存储的 CORS 设置里加上。没配或加载失败时标题退回系统字体，不影响使用。
- [ ] **隐私政策和用户协议**：写明收集哪些信息、数据存在境内、账号注销规则（7 天内可撤销，之后匿名化），也要考虑海外用户所在地的隐私法律。
- [ ] **内容安全**：群名、昵称、计划标题、详情、鸽了理由过文本检测，头像和群头像过图片检测（开发第 7–8 周接上）。
- [ ] **测试群**：拉 10–20 个真实的群做种子用户，体验版先给他们用。

## 提审前
- [ ] 体验版跑完种子群测试，门槛看 docs/spec.md「数据指标与埋点」里的初始目标。
- [ ] 准备审核说明：产品定位（活动日程工具）、测试账号或测试群的进入方式。
- [ ] 检查没有诱导分享：免鸽卡、鸽值减免都不能拿分享或邀请来换。
- [ ] 鸽子王相关文案没有人身攻击。
- [ ] 从正式包里拿掉开发用的页面：`pages/dev/components`（组件演示）、`pages/dev/health`（健康检查），见 docs/progress.md「待确认」第 9 条。

## 参考
- 小程序备案要求：https://www.secrss.com/articles/57609
- 小程序备案办理（小游戏版说明，含办结时限）：https://developers.weixin.qq.com/minigame/introduction/guide/xcxba
- 云托管 callContainer：https://docs.cloudbase.net/en/run/develop/access/mini
- 小程序调用云托管（官方）：https://developers.weixin.qq.com/miniprogram/dev/wxcloudrun/src/development/call/mini.html
- 云托管请求头（官方）：https://developers.weixin.qq.com/minigame/dev/wxcloudrun/src/development/weixin/
- 云托管内网调用 Redis（官方）：https://developers.weixin.qq.com/minigame/dev/wxcloudrun/src/practice/redis.html
- 提高构建效率（官方）：https://developers.weixin.qq.com/miniprogram/dev/wxcloudrun/src/scene/build/speed.html
- 动态消息（V1.1 加强版）：https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/share/updatable-message.html

# 上线前要办的平台手续

这些事 Claude Code 替你办不了，要你自己在微信公众平台和腾讯云上操作。和开发同时进行，越早开始越好。规则会调整，办的时候以后台页面和官方文档为准（下面的内容核对于 2026-10-27）。

## 第一周就办
- [ ] **注册小程序（个人主体）**，拿到 AppID；在后台把自己加为开发者，微信开发者工具里登录。
- [ ] **选服务类目**：从「工具」下选效率类子类目。个人主体没有「社交」类目，提审描述突出「活动日程工具」，少用交友、社区一类说法（见 docs/spec.md「主体与类目」）。
- [ ] **小程序备案**：2023 年 9 月起，新小程序要先备案才能上架。在公众平台「设置 › 小程序备案」里按引导办。要等管局审核，官方给小游戏的办结时限是 5–30 个工作日，普通小程序也按几周预留。
- [ ] **开通微信云托管**，和小程序关联。小程序用 `wx.cloud.callContainer` 调后端时，不用在小程序后台配置服务器域名，后端也能直接拿到用户的 openid。
  - 这样首版可以先不买自己的域名、不做域名备案。方案里写的是「自建后端的域名要 ICP 备案」，二选一，开工前定下来，告诉 Claude Code。

## 部署到微信云托管（后端）

在云托管「服务管理 → 新建服务」里建，**不要用它首页那些「免费快速部署」模板**——那些是空白脚手架，我们自己有 `Dockerfile`。

选择代码这一步：

| 字段 | 填什么 |
| --- | --- |
| 选择方式 | 绑定 GitHub 仓库（本仓库是公开的，不用 CLI） |
| 分支 | `main` |
| 端口 | `3000` |
| 目标目录 | **留空**（就是仓库根） |
| Dockerfile 文件 / 名称 | 有 / `Dockerfile` |

目标目录必须留空。`Dockerfile` 放在仓库根就是为了这个：构建上下文要包含 `pnpm-workspace.yaml`、`pnpm-lock.yaml` 和 `packages/shared`，而云托管要求 Dockerfile 与目标目录同级。填成 `apps/server` 会在 `pnpm install --frozen-lockfile` 那步失败。

环境变量（不填服务起不来，后端有启动断言）：

```
DATABASE_URL=mysql://<用户>:<密码>@<内网地址>:3306/yiqibuge?timezone=Z
REDIS_URL=redis://<内网地址>:6379
WECHAT_DRIVER=real
WX_APPID=wx...
WX_APP_SECRET=...
```

- `NODE_ENV=production`、`APP_ROLE=web`、`PORT=3000` 已经写在 Dockerfile 里，不用再填。
- `WECHAT_DRIVER` 必须是 `real`：配成 `fake` 时后端会拒绝启动（防止假数据开关漏进正式版）。
- MySQL 和 Redis 要先在云托管后台开通，拿内网地址。只想先验证镜像能不能跑通的话，这两个填占位值也能启动，`GET /api/v1/health` 会返回 `ok:false` 加 `db:down`、`redis:down`，服务本身是活的。

Worker 以后部署成**第二个服务**，同一个镜像，启动命令改成 `node dist/worker.js`、环境变量 `APP_ROLE=worker`。

## 开发期间办
- [ ] **订阅消息模板**：按 docs/spec.md「通知矩阵」和「订阅消息额度策略」，在公众平台的订阅消息里挑一次性订阅模板，记下模板 ID 交给开发。个人主体只能用一次性订阅。
- [ ] **用户隐私保护指引**：在小程序后台填写，把用到的接口（选择位置、头像昵称、保存图片到相册等）全部声明。
- [ ] **隐私政策和用户协议**：写明收集哪些信息、数据存在境内、账号注销规则（7 天内可撤销，之后匿名化），也要考虑海外用户所在地的隐私法律。
- [ ] **内容安全**：群名、昵称、计划标题、详情、鸽了理由过文本检测，头像和群头像过图片检测（开发第 7–8 周接上）。
- [ ] **测试群**：拉 10–20 个真实的群做种子用户，体验版先给他们用。

## 提审前
- [ ] 体验版跑完种子群测试，门槛看 docs/spec.md「数据指标与埋点」里的初始目标。
- [ ] 准备审核说明：产品定位（活动日程工具）、测试账号或测试群的进入方式。
- [ ] 检查没有诱导分享：免鸽卡、鸽值减免都不能拿分享或邀请来换。
- [ ] 鸽子王相关文案没有人身攻击。

## 参考
- 小程序备案要求：https://www.secrss.com/articles/57609
- 小程序备案办理（小游戏版说明，含办结时限）：https://developers.weixin.qq.com/minigame/introduction/guide/xcxba
- 云托管 callContainer：https://docs.cloudbase.net/en/run/develop/access/mini
- 动态消息（V1.1 加强版）：https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/share/updatable-message.html

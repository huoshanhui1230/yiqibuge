# 设计稿目录

每个页面有三套主题：`html/sticker/`（贴纸风，默认）、`html/cute/`（软糖风）、`html/clean/`（清爽风），文件名相同；`png/` 下是对应截图（1 倍图）。

- 读 HTML 时只看结构、文案、尺寸和样式。`<x-dc>`、`<helmet>`、`sc-if`、`data-theme-keep`、`support.js` 都是设计工具的标记，实现时忽略。
- 手机页面按 390 × 844 画；`Main`、`Onboarding`、`ShareCard`、`Compare` 是 1240 宽的说明板。
- 三套主题的样式数值整理在 `tokens.json`，实现时以它为准；设计稿里个别数值不一致时问一下。
- `ShareChat` 里的微信聊天界面只是示意，配图才是要实现的部分。
- `Compare` 只是三套主题的对比说明，不用实现。

| 分组 | 文件名 | 页面 | 版本 |
| --- | --- | --- | --- |
| 风格基础与核心页面 | Main | 风格基础与鸽王头像 | MVP |
| 风格基础与核心页面 | Home | 首页 | MVP |
| 风格基础与核心页面 | Flake | 鸽了确认卡 | MVP |
| 鸽子王专属 | Reveal | 鸽子王揭晓 | MVP |
| 鸽子王专属 | KingPublish | 鸽王发布成功 · 鸽子屎特效 | MVP |
| 鸽子王专属 | KingPlan | 群友打开鸽王局 · 点鸽屎擦掉 | MVP |
| 发起与参与 | CreatePlan | 发起计划 | MVP |
| 发起与参与 | PlanDetail | 计划详情 · 已成局 | MVP |
| 发起与参与 | JoinSheet | 跟了确认卡 | MVP |
| 发起与参与 | Calendar | 日历 | MVP |
| 群组 | Groups | 群组列表 | MVP |
| 群组 | GroupHome | 群组主页 · 鸽榜 | MVP |
| 群组 | GroupSettings | 群设置 | MVP |
| 群组 | Invite | 邀请页 | MVP |
| 群组 | JoinLanding | 加入落地页（非成员） | MVP |
| 账号与个人 | Login | 登录与资料 | MVP |
| 账号与个人 | Onboarding | 新手引导 · 3 屏 | MVP |
| 账号与个人 | Profile | 我的 | MVP |
| 账号与个人 | Notifications | 通知中心 | MVP |
| 账号与个人 | Settings | 设置 | MVP |
| 账号与个人 | ThemePicker | 主题选择 | MVP |
| AA 记账（V1.1） | PlanEnded | 计划结束 · 记一笔入口 | V1.1 |
| AA 记账（V1.1） | AddBill | 记一笔 | V1.1 |
| AA 记账（V1.1） | BillDetail | 本局账单 · 转账方案 | V1.1 |
| AA 记账（V1.1） | Settled | 全员两清 · 盖章动效 | V1.1 |
| AA 记账（V1.1） | PayBack | 我已还 · 欠款人视角（澳元账） | V1.1 |
| AA 记账（V1.1） | Ledger | 群组主页 · 账本 | V1.1 |
| 分享到群的卡片 | ShareChat | 群聊里的样子 · 示意 | MVP |
| 分享到群的卡片 | ShareCard | 分享卡片配图 · 4 种状态 | MVP |
| 参考 | Compare | 三套主题对比 · 默认贴纸风，设置里可换 | 参考 |

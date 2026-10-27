# 一起不鸽 · 仓库起步包

> 产品正式名称是「一起不鸽」（见 `docs/decisions.md` 第 18 条）。下面提到的文件里还留着历史名称「一起恰」，那是 2026-10-27 导出的快照，没有改。

## 怎么用
1. 新建一个空的 Git 仓库，把这个包里的所有文件放到仓库根目录（包括以点开头的 `.claude` 文件夹，有的系统默认会隐藏它），先提交一次。
2. 装好：Node.js（LTS 版）、pnpm、Docker（本地跑 MySQL 和 Redis）、微信开发者工具、Claude Code。
3. 在仓库目录里打开 Claude Code，从 `docs/prompts.md` 的「第 0 步」开始，一个阶段开一个新会话。
4. 平台手续和开发同时办，清单在 `docs/platform-checklist.md`。小程序备案要等几周，最先办。

## 包里有什么
| 路径 | 用途 |
| --- | --- |
| `CLAUDE.md` | Claude Code 每次开会话都会读的项目说明：硬性规则、技术栈、做事方式 |
| `.claude/rules/miniapp.md` | 改小程序端代码时才加载的规则（主题、尺寸、确认卡） |
| `.claude/rules/server.md` | 改后端和共享包时才加载的规则（时区、接口、任务、内容安全） |
| `.claude/skills/design-check/` | `/design-check 页面名`：对照设计稿走查一个页面 |
| `.claude/skills/phase-done/` | `/phase-done 阶段号`：阶段验收 |
| `docs/spec.md` | 产品方案（2026-10-27 导出，图已转成文字） |
| `docs/decisions.md` | 已定的决定，和方案冲突时以它为准 |
| `docs/prompts.md` | 分阶段提示词和平时常用的提示词 |
| `docs/platform-checklist.md` | 上线前要办的平台手续 |
| `docs/design/` | 设计稿：三套主题的 HTML、截图和 tokens.json，目录在 README.md |

## 以后改东西
- 方案或决定变了：先改 `docs/decisions.md`（写上日期），再让 Claude Code 照着改代码。
- Claude 老是犯同一个错：把规则补进 `CLAUDE.md` 或 `.claude/rules/`。规则要短，太长它反而会漏看。

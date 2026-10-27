---
name: phase-done
description: 一个开发阶段结束时做验收检查
disable-model-invocation: true
---

要验收的阶段：$ARGUMENTS（对应 docs/prompts.md 里的阶段）

1. 对照 docs/prompts.md 里这个阶段的「验收」逐条检查，每一条都给出证据：命令和输出、测试结果、截图。
2. 跑全部类型检查、lint 和测试，贴出结果。
3. 用子代理在新的上下文里审查这个阶段的改动。只报影响正确性和需求的问题（时间文案、表态规则、时区、权限、数据一致性、隐私），不报风格偏好。
4. 看 CLAUDE.md 和 docs/decisions.md 要不要更新（新命令、新约定、新决定）。要更新就先把改动给我看。
5. 最后给我一份清单：做完了什么、没做完什么、下个阶段要注意什么。

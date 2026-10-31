完成条件见 RULES.md §9。下面各栏对应该节，不另写一套。

## 改了什么、为什么

关联的 US / AC：

## 切片与热点文件

- 切片：
- 热点文件（没有就写「无」）：
- 任务类型：UI 改动 / seam 变更 / core 改动（三选一）

任务类型为「UI 改动」时，不得修改 core 目录（domain、application、`index.ts`、`pure.ts`、`contracts/src/ipc/**`）。见 RULES N-16、N-21 与 ARCHITECTURE §2.1。

## 测试证据

- 所在提交 SHA：
- 命令：
- 结果摘要（通过 / 失败 / 跳过）：
- 失败项与重跑记录：

## 证据目录

- `docs/evidence/<PR号>/`：
- 大文件的 CI artifact 链接（没有就写「无」）：

## agent 工作记录

一小段即可。不另建完整 agent 对话记录，Cursor 已保存 transcript。不新建 `docs/agent-logs/`。

- 读了哪些规格：
- 关键决定：
- 跑了哪些命令与结果：
- 坑：

## 完成条件里尚未单独成栏的三项（RULES §9）

不另写规则，只填结果。验收编号、命令与退出码、证据目录、工作记录已在上面的栏目里。

- 日志：未改日志 / 已按 RULES §4 与 ARCHITECTURE §11
- N-10 / N-11 文件：未改 / 用户明确要求（写出是哪一次）
- 规格变更记录：`docs/spec-changelog.md` 已加本 PR 一行 / 这次不改规格，不适用

## 未验证项与风险

## UI–core 交接说明（ARCHITECTURE §2.1 / RULES §8）

改动了 UI 或 core 路径时填写。只改文档且不涉及实现路径时写「不适用」。

- 任务类型：UI 改动 / seam 变更 / core 改动（三选一）
- 涉及切片：
- 改了哪些 UI 文件：
- core 是否没动：是 / 否（UI 改动任务中出现 core 改动即不合格）
- 用到的 seam：
- seam 是否够用：够用 / 不够用
- 核心测试是否通过：M1 前写不适用（脚本尚未提供）；M1 起以 package.json 实际脚本为准，于提交 `<SHA>`：通过 N / 失败 N / 跳过 N
- 未验证项与风险：

本任务受 UI 与业务核心解耦约束：ARCHITECTURE.md §2.1 与 RULES.md §8。改 UI 不得改变核心行为，也不得让核心测试失败；seam 不够用时先停下来说明缺什么。

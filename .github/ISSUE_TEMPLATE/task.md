---
name: 任务
about: 一个实现或文档任务
title: ""
labels: ""
assignees: ""
---

## 关联的 US / AC

## 切片名

## 任务类型

UI 改动 / seam 变更 / core 改动（三选一）

任务类型为「UI 改动」时，不修改 core 目录（RULES N-16、N-21）。

## 约束

本任务受 UI 与业务核心解耦约束：ARCHITECTURE.md §2.1 与 RULES.md §8。改 UI 不得改变核心行为，也不得让核心测试失败；seam 不够用时先停下来说明缺什么。

## 涉及文件/模块

必填。预计改动的路径，一行一个。每个路径写明模块边界：所在层，以及切片或公共包（ARCHITECTURE.md §2、§3、§4.2）。热点文件（RULES §3）单独标出。

-

## 参照实现

必填。要模仿的现有模块，写仓库里的路径。例如 `packages/features/jobs`。没有可参照的实现时写「无」，并写原因。

-

## 要做的事

## 不要做的事

## 验收命令与预期退出码

必填。每条一行：确切命令 → 预期退出码。例如 `pnpm check` → `0`，`pnpm test` → `0`，或 `pnpm exec vitest run tools/check-file-size/limit.test.ts` → `0`。只列这次要跑的命令。

-

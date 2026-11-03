# 0003 删除 repair 到 quality

状态：采纳。日期：2026-11-04（Asia/Shanghai）。决定人：Wisdom。

规格已在 [ARCHITECTURE.md](../../ARCHITECTURE.md) §4.2 的 `repair` 行、§4.3 与 §16。本页只登记这条边的删除，不另写一份规格。批准是架构评审修复 A 的 P0-1，Wisdom 2026-10-30 19:57。

## 背景

补救若依赖 `quality`，重新评分就会写在补救切片里。规格改为：补救只产出新的识别候选，重新评分由 `ingest` 调用 `quality`。

## 选项

每条都是规格里已经对照过的做法。

1. 保留 `repair → quality`，补救之后由 `repair` 自己重评。
2. 删除这条边。`repair` 只产出候选。重新评分由 `ingest` 调用 `quality`。

## 决定

取第 2 条。`repair` 不再依赖 `quality`。它还可以 import 的切片是 `formula` 与 `jobs`，与 §4.3 的图以及 `tools/check-deps/feature-edges.mjs` 里 `repair` 的数组一致。

本页不把这条边加回去，也不改那份数组。

## 后果

- 依赖检查里没有 `repair → quality`。补救后的重评仍由 `ingest` 调 `quality`。
- 本页不改架构图，也不改 dependency-cruiser 的规则文本。
- 多模态识别仍在 `repair`，那不是补救，也不因此恢复这条边。

## 状态

采纳。被取代时改本页状态并指向新页，不在正文里追加「后来改为」。

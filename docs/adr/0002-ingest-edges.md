# 0002 ingest 的九条出边

状态：采纳。日期：2026-11-04（Asia/Shanghai）。决定人：Wisdom。

规格已在 [ARCHITECTURE.md](../../ARCHITECTURE.md) §4.3 与 §16。本页只登记那九条出边，不另写一份规格。批准是架构评审，Wisdom 2026-10-30 19:57。

## 背景

打开 PDF 之后要按路线依次调用多个切片。这个顺序如果写进 `jobs`、`document`、装配根或 UI，就和这几处已经写明的职责冲突。

## 选项

每条都是 §4.3 已经点名的做法。

1. 编排放进 `jobs`、`document`、装配根或 UI。
2. 单独的 `ingest` 切片做编排，只允许下面九条出边，并且没有切片依赖 `ingest`。

## 决定

取第 2 条。`ingest` 可以 import 这九个切片的 `index.ts`：`library`、`parsing`、`document`、`quality`、`formula`、`formula-source`、`repair`、`translation`、`jobs`。任何切片都不依赖 `ingest`。

这九条已经画在 §4.3，也已经写在 `tools/check-deps/feature-edges.mjs` 的 `ingest` 数组里。本页不新增边，也不改那份数组。

## 后果

- 依赖检查继续用现有的 `feature-dependency-matrix`。`ingest` 以外的切片 import `ingest` 仍然失败。
- 本页不改架构图，也不改 dependency-cruiser 的规则文本。
- 编排仍只在 `ingest`。`jobs` 仍只管任务状态机。

## 状态

采纳。被取代时改本页状态并指向新页，不在正文里追加「后来改为」。

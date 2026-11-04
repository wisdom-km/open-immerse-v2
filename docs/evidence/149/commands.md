# 命令

日期：2026-11-04。分支 `feature/ci-depgraph-28`。下面各条跑在 `968b5450c04860eb4d44dc5a9420c2657aad1e90`。工作目录是仓库根，除非另写。Node 是 `.nvmrc` 的 22.23.4。没有跑全量 `pnpm check` 或 `pnpm test`。

## 依赖图报告

```
node tools/check-arch-graph/check.mjs
```

退出码 0。

```
arch-graph: undocumented 0
arch-graph: planned 22
arch-graph: unmapped 1
arch-edge-planned	ADP	APP
arch-edge-planned	ADP	DOM
arch-edge-planned	ADP	PN
arch-edge-planned	ADP	PV
arch-edge-planned	ADP	PY
arch-edge-planned	ADP	WC
arch-edge-planned	APP	C
arch-edge-planned	APP	DOM
arch-edge-planned	APP	K
arch-edge-planned	DOM	K
arch-edge-planned	MAIN	ADP
arch-edge-planned	MAIN	APP
arch-edge-planned	MAIN	PV
arch-edge-planned	PRE	C
arch-edge-planned	PV	C
arch-edge-planned	PV	K
arch-edge-planned	PV	PN
arch-edge-planned	PY	C
arch-edge-planned	UI	C
arch-edge-planned	UI	DOM
arch-edge-planned	UI	UK
arch-edge-planned	WC	C
arch-edge-unmapped	SEAM	DOM	packages/features/jobs/src/index.ts:1
```

对得上 §5.1、因此没有单独成行的 5 条：C → K `packages/contracts/src/diag-events.ts:1`（全部 type-only）；DOM → C `packages/features/jobs/src/domain/job-id.ts:1`；MAIN → PN `apps/desktop/src/main/composition-root.ts:3`；PN → C `packages/platform-node/src/logging/value-guard.ts:1`；PN → K `packages/platform-node/src/logging/debug-retention.ts:4`。

## strict 临时夹具

临时目录未提交。里面有一份只画 `UI --> C` 的 mermaid、一份 cruise JSON，以及 `packages/features/ingest/src/ui/panel.ts` 对 `../application/run.js` 的 import。在该目录执行：

```
node <仓库>/tools/check-arch-graph/check.mjs --strict --mermaid docs-arch.md --cruise-json cruise.json
```

退出码 1。输出含 `arch-edge-undocumented	UI	APP	packages/features/ingest/src/ui/panel.ts:1` 和一行「修复：」，以及 `arch-edge-planned	UI	C`。

## Vitest

```
corepack pnpm exec vitest run tools/check-arch-graph tools/check-deps
```

退出码 0。13 个文件、53 条通过，失败 0，跳过 0。

## eslint 与 tsc

```
corepack pnpm exec eslint --max-warnings 0 tools/check-arch-graph
corepack pnpm exec tsc --noEmit --pretty false
```

退出码 0，0。eslint 没有输出。

## 其余定向检查

```
node tools/check-deps/check.mjs
node tools/check-file-size/check.mjs
node tools/compare-spec-bytes/compare.mjs
node tools/check-docs/check.mjs
```

退出码都是 0。dependency-cruiser：109 modules，197 dependencies，no dependency violations。行数：225 个源文件在硬上限内。compare-spec-bytes：PRD 36 段、ARCHITECTURE 66 段、RULES 一段，对得上 `f8d5d01dc8af81b73689c7229c983192551fa6fe`。check-docs：links 0、anchors 0、status 0、verbatim 0、tree 0、findings 0。

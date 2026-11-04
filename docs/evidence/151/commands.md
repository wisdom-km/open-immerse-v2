# 命令

日期：2026-11-04。分支 `feature/arch-graph-unmapped-28`。下面各条跑在 `7f21dd3312881168808c76ed4860f7311dbb88fd`。工作目录是仓库根，除非另写。Node 是 `.nvmrc` 的 22.23.4。没有跑全量 `pnpm check` 或 `pnpm test`。其后的 `c9d4311` 只补了执行计划的实际列，没有改 `tools/check-arch-graph`。

## 依赖图报告

```
node tools/check-arch-graph/check.mjs
```

退出码 0。

```
arch-graph: undocumented 0
arch-graph: planned 22
arch-graph: unmapped 0
arch-graph: index 0
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
```

planned 仍是 22。穿透只去掉原先那条 `SEAM → DOM`（`packages/features/jobs/src/index.ts:1`）。没有产品代码 import 这些 index，所以没有新的层间边。

```
node tools/check-arch-graph/check.mjs --strict
```

退出码 0。输出与上面相同。

## strict 夹具

临时目录未提交。Vitest 在 `tools/check-arch-graph/check.test.ts` 里覆盖：

- 只有一条 unmapped（`packages/features/jobs/src/notes.ts` 对不上层）时，不带 `--strict` 退出码 0，带 `--strict` 退出码 1。
- 纯转出的 `jobs/src/index.ts` 没有导入方时，`--strict` 退出码 0，报告里没有 `arch-edge-unmapped`。
- `export const ready = 1` 的 feature index 打出 `arch-index	packages/features/jobs/src/index.ts:1`。不带 `--strict` 退出码 0，带 `--strict` 退出码 1。

## Vitest

```
corepack pnpm exec vitest run tools/check-arch-graph
```

退出码 0。6 个文件、51 条通过，失败 0，跳过 0。类型检查无错。

## eslint 与 tsc

```
corepack pnpm exec eslint --max-warnings 0 tools/check-arch-graph
corepack pnpm exec eslint --max-warnings 0 --rule 'max-params: [error, 4]' tools/check-arch-graph
corepack pnpm exec tsc --noEmit --pretty false
```

退出码 0，0，0。

## 文档链接

```
node tools/check-docs/check.mjs
```

退出码 0。links 0、anchors 0、status 0、verbatim 0、tree 0、findings 0。

## PR 体量

```
node tools/check-pr-size/check.mjs --base origin/main
```

在提交说明写入 `G12:` 之后退出码 0。打印 `check-pr-size: 809 non-generated lines`。

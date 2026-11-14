# 第 1 笔 settings 存储

Node v22.23.4。工作目录是仓库根。没有改 `docs/arch/05-01.md`。没有 Ready、合入或发版。

## node tools/check-arch-graph/check.mjs

退出码 0。`undocumented` 是 0，`unmapped` 是 0，`index` 是 0。`planned` 12 条是图上已有、代码里还没有的边，不是这次新增。

```
arch-graph: undocumented 0
arch-graph: planned 12
arch-graph: unmapped 0
arch-graph: index 0
arch-edge-planned	ADP	PV
arch-edge-planned	ADP	PY
arch-edge-planned	ADP	WC
arch-edge-planned	MAIN	PV
arch-edge-planned	PRE	C
arch-edge-planned	PV	C
arch-edge-planned	PV	K
arch-edge-planned	PV	PN
arch-edge-planned	PY	C
arch-edge-planned	UI	C
arch-edge-planned	UI	UK
arch-edge-planned	WC	C
```

适配器不直接 import `@oi/kernel` 或 `@oi/contracts`。第一次跑出过 `ADP → C` 和 `ADP → K`，05-01 没有这两条边。删掉这两处 import 之后上面的输出是 0。

## corepack pnpm exec vitest run packages/features/settings

退出码 0。3 个文件，15 通过，类型错误 0。其中 `credential_slot` 为空串的用例有两条：分类一条，SQLite 一条。

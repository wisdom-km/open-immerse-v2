# 第 2 笔 parsing 接线

Node v22.23.4。工作目录是仓库根。没有改台账、CSP、协议注册、reader、`composition-root.ts`。没有 Ready、合入或发版。

## node tools/check-arch-graph/check.mjs

退出码 0。`undocumented` 是 0，`unmapped` 是 0，`index` 是 0。`planned` 仍是 12。main 对 settings 适配器的 import 走图上已有的 MAIN→ADP。

## corepack pnpm test

退出码 0。185 个文件，816 通过，3 跳过，类型错误 0。3 个跳过是 `GITLEAKS_BIN` 未设置时的 detect。

## GATE_BASE=origin/main corepack pnpm run check

退出码 0。`check-one-slice: 1 feature slice(s)`。codegen 之后工作区无 diff。

check-pr-size: 0000 non-generated lines

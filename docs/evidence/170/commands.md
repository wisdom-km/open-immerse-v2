# 命令

日期：2026-11-05。分支 `feature/docs-m2-library-sync-166`。工作目录是仓库根。Node 是 `.nvmrc` 的 22.23.4。PATH 把 `/home/ubuntu/.nvm/versions/node/v22.23.4/bin` 放在前面。

## check-docs

提交 `d6ce9a78d88003a18d8b83f1ac62d10be0056236`：

```
node tools/check-docs/check.mjs
```

退出码 0。`findings: 0`。links、anchors、status、verbatim、tree 都是 0。

## compare-spec-bytes

同一提交：

```
node tools/compare-spec-bytes/compare.mjs
corepack pnpm exec vitest run tools/compare-spec-bytes/compare.test.ts
```

两条都是退出码 0。比对：PRD.md 36 部分、ARCHITECTURE.md 66 部分、RULES.md span 与基线 `f8d5d01` 一致；68 条路径前缀。vitest 14 passed。

## check

同一提交，第一次：

```
GATE_BASE=origin/main corepack pnpm run check
```

退出码 1。停在 lint。389 条都在 `packages/features/library`，类型解析失败。当时 `@oi/feature-library` 还没链进 `node_modules`。随后：

```
corepack pnpm install --frozen-lockfile
```

退出码 0。Lockfile is up to date。`pnpm-lock.yaml` 没有改动。

同一提交再跑：

```
GATE_BASE=origin/main corepack pnpm run check
```

退出码 0。`check-pr-size: 97 non-generated lines`。`check-one-slice: 0 feature slice(s)`。`check-commits` 通过。codegen 无 diff。

`test:core`：不适用（`package.json` 没有这个脚本）。没有跑全量 `pnpm test`。

## 核对

```
git grep -n importPdf -- '*.md'
```

无匹配。`docs/approvals.md` 里 `2026-11-04 23:40` 与 `2026-11-05 09:20` 各 1 行。批准计数脚本：101 批准、1 反馈、3 决定、3 合入同步。

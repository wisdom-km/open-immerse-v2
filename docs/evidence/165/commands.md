# 命令

日期：2026-11-05。分支 `feature/m2-sqlite-storage-163`。下面各条跑在 `caa5a5e39c641024bd8a931aa934528191905de5`，证据文件本身不在这一笔里。工作目录是仓库根。Node 是 `.nvmrc` 的 22.23.4。

## 定向测试

```
corepack pnpm exec vitest run packages/platform-node/test/data-root.test.ts packages/platform-node/test/json-document.test.ts packages/platform-node/test/open-storage.test.ts --reporter=verbose
```

退出码 0。12 通过。其中 AC-66 三条：迁移失败后原库字节不变；`app_schema` 为 9、支持版本为 1 时只读且 `writes` 为 0；JSON 未知字段写回仍在，更高主版本 `writes` 为 0。

## 全量测试

```
corepack pnpm test
```

退出码 0。123 个文件，456 通过，3 跳过。

## check

```
GATE_BASE=origin/main corepack pnpm run check
```

第一次退出码 1。ESLint 报在 `packages/features/markdown`（main 新增的解析依赖还没装进 `node_modules`）。执行 `corepack pnpm install --frozen-lockfile`（退出码 0，锁文件未改）之后重跑，退出码 0。`check-pr-size: 1605 non-generated lines`。提交说明里有 `G12:`。`check:deps` 无违规。

## 规格字节与文档

```
node tools/compare-spec-bytes/compare.mjs
node tools/check-docs/check.mjs
```

两条退出码都是 0。compare-spec-bytes：ARCHITECTURE.md 66 个部分与基线 `f8d5d01` 在两条 amendment 之后一致。check-docs findings 0。

## Forge 复查后的定向测试

日期仍是 2026-11-05。覆盖 WAL 检查点备份、`-wal`/`-shm` 失败写回、`storage.backup_failed`。`json-document.ts` 没改。

```
corepack pnpm exec vitest run packages/platform-node/test/data-root.test.ts packages/platform-node/test/json-document.test.ts packages/platform-node/test/open-storage.test.ts
```

退出码 0。3 个文件，14 通过。新增两条：`restores wal and shm bytes when a migration fails`；`returns backup_failed when the backup file cannot be written`。

```
GATE_BASE=origin/main corepack pnpm run check
```

提交前工作区还有这次改动时，退出码 1。G7 的 `git diff --exit-code` 看到的是未提交的源文件，不是 codegen 改写了已提交文件。在 `69aa241c3edf329d63a50dfb85e86bc482004cd4` 的干净工作区重跑，退出码 0。`check-pr-size: 1816 non-generated lines`。提交说明里已有的 `G12:` 仍在。

```
node tools/check-docs/check.mjs
```

退出码 0。findings 0。

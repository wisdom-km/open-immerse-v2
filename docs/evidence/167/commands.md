# 命令

日期：2026-11-05。分支 `feature/m2-storage-perm-163`。工作目录是仓库根。Node 是 `.nvmrc` 的 22.23.4。PATH 把 `/home/ubuntu/.nvm/versions/node/v22.23.4/bin` 放在前面。证据文件本身不在下面这些提交里。

## 定向测试

提交 `fb7d461` 上：

```
corepack pnpm exec vitest run packages/platform-node/test/open-storage-errors.test.ts packages/platform-node/test/open-storage.test.ts --reporter=verbose
```

退出码 0。2 个文件，15 通过。其中 `storage.open_failed`（`EISDIR` 与无 `code` 的 Error）、`EACCES` / `EPERM` / `EBUSY` 归 `storage.locked`、`-wal` / `-shm` 读失败同样归类、文案「被锁定或没有权限」、绝对路径不进 `message` / `StorageError` / 诊断日志。

## 全量测试

提交 `4a5fe01`：

```
corepack pnpm test
```

退出码 1。124 个文件，1 失败 / 464 通过 / 3 跳过。失败是 `tools/gate-remediation/g3.test.ts`：`tools/typecheck.mjs` 退出码 2。`packages/platform-node/test/open-storage-errors.test.ts` 把带 `cause` 的对象直接断言成 `DiagEvent`，联合类型重叠不够。

## 失败项重跑

提交 `d53d4f6` 把断言改成 `as unknown as DiagEvent`。只重跑失败项，并带上改过的存储错误测试：

```
corepack pnpm exec vitest run tools/gate-remediation/g3.test.ts packages/platform-node/test/open-storage-errors.test.ts --reporter=verbose
```

退出码 0。2 个文件，5 通过。同一个 tip 没有再跑全量 vitest。

## check

提交 `d53d4f6`：

```
GATE_BASE=origin/main corepack pnpm run check
```

退出码 0。`check-pr-size: 213 non-generated lines`。没有 `G12:`。没有改 CI，没有跳过测试。

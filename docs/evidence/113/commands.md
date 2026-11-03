# PR #113 命令

日期：2026-11-04（Asia/Shanghai）。分支 `feature/docs-m1-followups-2`。工作目录是仓库根。测量基线 `origin/main` `6c59339`（#110）。未改日志。没有改代码、`tools/**`、`package.json`、`.github/workflows/*`。

只跑 `corepack pnpm run check`。没有跑 `corepack pnpm test`。`test:core`：不适用（`package.json` 没有这个脚本）。没有执行。

Node 放在 PATH 前面的是 `/home/ubuntu/.nvm/versions/node/v22.23.4/bin`，再用 `corepack pnpm`。`node -v` 是 v22.23.4，`corepack pnpm --version` 是 10.34.9。跑检查前执行了 `corepack pnpm install --frozen-lockfile`（锁文件无改动，补上 #110 的 `prettier` 3.6.2）。工作区干净。

## 门禁

在 `2414f54e2aca6a41cfd18322cfab491b3ff9dad7` 上跑。当时本文件还没有这一节。

```bash
corepack pnpm run check
```

退出码 0。`check:format` 打印 `All matched files use Prettier code style!`。`check-pr-size: 65 non-generated lines`。`check-commits` 通过。codegen 1 个 generator，随后的 `git diff --exit-code` 通过。

写入这一节的提交只追加记录。该提交上再跑一次的退出码写在 PR 描述。

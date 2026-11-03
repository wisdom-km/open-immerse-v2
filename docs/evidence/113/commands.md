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

写入这一节的提交只追加记录。该提交上再跑一次的退出码写在 PR 描述。tip `b50a129f438a587b543ca81a82c05dc6b98feebf` 上再跑一次，退出码 0。`check-pr-size` 当时是 73 行。

## Anvil 三处（2026-11-04）

核对：

- `gh pr diff 106 --name-only`：`docs/evidence/106/commands.md`、`tools/check-deps/check.mjs`、`tools/check-deps/launch-depcruise.d.mts`、`tools/check-deps/launch-depcruise.mjs`、`tools/check-deps/launch-depcruise.test.ts`。
- `gh pr diff 109 --name-only`：`docs/evidence/109/commands.md`、`packages/contracts/src/ids.ts`、`packages/contracts/src/index.ts`、`packages/contracts/src/worker/health.ts`、`packages/contracts/src/worker/worker-version.ts`、`packages/contracts/test/ids.test.ts`、`packages/contracts/test/worker-version.test.ts`。
- `git ls-tree -r --name-only origin/main` 没有 `packages/worker-client/`，也没有 `supervisor-protocol.ts`。标为计划中。
- `gh api repos/wisdom-km/open-immerse-v2/branches/main/protection` 与 `.../required_status_checks` 都是 403（`Resource not accessible by integration`）。以 2026-11-04 Anvil 查到的为准：`CI / worker-health-windows` 与 `CI / worker-health-macos` 已是 required。没有改设置。Issue #33 仍 OPEN。

在 `aff441558f5a300f15a366101ec9affdda39e85a` 上跑：

```bash
corepack pnpm run check
```

退出码 0。`check-pr-size: 83 non-generated lines`。写入这一节的提交只追加记录。该提交上再跑一次的退出码写在 PR 描述。

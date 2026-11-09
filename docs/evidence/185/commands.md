# F-08 解析公开面测试

校验对象是 merge 提交 `3927cee8ce2131509e4fb9f3c5e9ff2d5024f0b1`（tree `0147999be8bafdb89d8be62a7dd917899a4a10d3`）。父提交是测试提交 `29a82993400458a9a216755325d61cddc9609e66` 与 `main` `f59851d83fa8135d5cbb60e5ed08fcc40e2058b7`。Node v22.23.4。pnpm 10.34.9。`GATE_BASE=origin/main`（`f59851d83fa8135d5cbb60e5ed08fcc40e2058b7`）。

gitleaks 8.30.1 装在 `/tmp/gitleaks`。压缩包 sha256 `551f6fc83ea457d62a0d98237cbad105af8d557003051f41f3e7ca7b3f2470eb` 核对通过。`GITLEAKS_BIN=/tmp/gitleaks`。`apps/desktop/node_modules/electron/dist` 不存在，没有 Electron 二进制。

12:25 的路径批准只在 Issue 评论 [6732221360](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6732221360)，没有写入 `docs/approvals.md`。

## gitleaks detect

`node tools/gate-remediation/run.mjs --id G9 -- /tmp/gitleaks detect --source . --config .gitleaks.toml --redact --no-banner`

退出码 0。638 commits scanned。no leaks found。

## corepack pnpm run check

`GATE_BASE=origin/main`。退出码 0。里面含 prettier、eslint、`typecheck`（`tsconfig.json`、`tsconfig.ui.json`、preload）、`typecheck:core`。

`check-pr-size: 331 non-generated lines`。`check-one-slice: 0 feature slice(s)`。`check-hotspots` 通过。`check-file-size: 422 source files within hard limits`。dependency-cruiser：327 modules，921 dependencies，no violations。codegen 之后 `git diff --exit-code` 通过。

## corepack pnpm test

退出码 1。Vitest 169 个文件，1 个失败，168 个通过。测试 719 条：1 失败，718 通过，0 跳过。类型错误 0。

失败的一条是 `tools/check-commits/message.test.ts` 的 `rejects a subject outside Conventional Commits`，5000ms 超时，日志记了 9537ms。与解析公开面无关。同一提交上只重跑这个文件：1 个文件、1 条通过、类型错误 0，退出码 0，耗时 254ms。没有重跑整份 `pnpm test`。

三条 G9 detect 这次没有跳过。日志是 `phase=binary` 然后 `phase=detect`：`rejects a committed access key that lacks the oitest_ prefix (G9)`、`allows a synthetic key that uses the oitest_ prefix (G9)`、`rejects the same suffix when the prefix is nottest_ (G9)`。它们在上面的 718 条通过里。加上仓库上的 detect 退出码 0，这次本机 G9 跑过了。

`apps/desktop/test/parse-capability-surface.test.ts` 在这 168 个通过的文件里。提交前单独跑过：1 个文件，2 条通过，类型错误 0。

## node tools/check-arch-graph/check.mjs

退出码 0。`undocumented 0`，`planned 15`，`unmapped 0`，`index 0`。CI 里这一步是 continue-on-error。

## 步骤 4 的 diff

相对 `34f9ae1ac0cd4aabb105614ee4fd27d8ff118cfa`，`29a82993400458a9a216755325d61cddc9609e66` 只有四个文件：

| 文件 | 行数 |
| --- | --- |
| `apps/desktop/test/parse-capability-surface.test.ts` | 157 增，21 删。文件 158 行 |
| `eslint.config.js` | 1 增，0 删 |
| `tsconfig.json` | 1 增，0 删 |
| `tsconfig.ui.json` | 1 增，0 删 |

三处都只插入 `apps/desktop/test/parse-capability-surface.test.ts`，夹在 `oi-keys.test.ts` 与 `reading-command-surface.test.ts` 之间。`maximumDefaultProjectFileMatchCount` 仍是 64。没有改 `compilerOptions` 或规则。

## 本机未跑

Electron 未跑：没有 Electron 二进制。Box 未跑：不改运行时、不改 `expose`、不开窗口。Windows 真机未跑。AC-11、3A、PRC-01–26、UIX-57 与 8 GB 录屏仍未验收。python-worker 未跑：相对 `origin/main` 没有 `workers/parser` 的 diff。

## 补上证据链接之后

本文件和执行计划的实际列在 `3927cee8ce2131509e4fb9f3c5e9ff2d5024f0b1` 之后补上。上面的 331 行和测试计数是这个 merge 提交的记录，不含本文件。本文件提交之后的 tip 会再跑一次全量、typecheck 与 lint。那次的计数不回写本文件。

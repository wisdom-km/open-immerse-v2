# PR #122 命令

日期：2026-11-04（Asia/Shanghai）。分支 `feature/m1-empty-slices-adr`。工作目录是仓库根。Node 放在 PATH 前面的是 `/home/ubuntu/.nvm/versions/node/v22.23.4/bin`。`node -v` 是 v22.23.4，`corepack pnpm --version` 是 10.34.9。未改日志。没有改 `.github/workflows/**`。没有改依赖版本。`pnpm-lock.yaml` 只加了 `packages/providers` 的 workspace 链接。

`test:core`：不适用（`package.json` 没有这个脚本）。没有执行。

代码提交是 `6eba91f8a9fbe3702b746ee47d0a90eb3e6b84cd`。下面的全量 check 跑在这个提交上，工作区干净。本文件是随后的记录。

## 违规样例

在 `packages/providers/src/index.ts` 临时写成：

```ts
import { sameJobId } from "../../features/jobs/src/index.ts";

export const leaked = sameJobId;
```

然后跑：

```bash
corepack pnpm run check:deps
```

退出码 1。dependency-cruiser：

```text
error providers-boundary: packages/providers/src/index.ts → packages/features/jobs/src/index.ts

x 1 dependency violations (1 errors, 0 warnings). 105 modules, 184 dependencies cruised.
```

随后把该文件恢复成 `export {}`。`git diff -- packages/providers/src/index.ts` 无输出。这行导入没有进入任何提交。

## 恢复后的门禁

在 `6eba91f8a9fbe3702b746ee47d0a90eb3e6b84cd` 上跑。当时还没有本文件。

```bash
GATE_BASE=origin/main corepack pnpm run check
```

退出码 0。`check:format` 打印 `All matched files use Prettier code style!`。`check-file-size: 197 source files within hard limits`。dependency-cruiser：`no dependency violations found (105 modules, 183 dependencies cruised)`。`check-one-slice: 4 feature slice(s)`。`check-core-tests: core tests stay on the node project`。npm / pip / 模型许可证通过。`check-commits` 通过。`check-hotspots` 通过。`check-pr-size: 279 non-generated lines`。codegen 1 个 generator，随后的 `git diff --exit-code` 通过。日志在 `/opt/cursor/artifacts/pnpm-check-m1.log`。

四个占位测试：

```bash
corepack pnpm exec vitest run packages/features/formula-source/test/core/index.test.ts packages/features/markdown/test/core/index.test.ts packages/features/ingest/test/core/index.test.ts packages/features/budget/test/core/index.test.ts
```

退出码 0。4 个文件，4 passed。Type Errors: no errors。

写入本文件的提交只加记录。该提交上再跑一次 `GATE_BASE=origin/main corepack pnpm run check` 的退出码写在 PR 描述。

## 合入 main 之后

`git merge origin/main`，merge commit `4368b8522a90b94586150a433ab3f9c3d72f30c0`，对方是 `4d83106678448ce6108be8ecafc0e020c122388b`，无冲突。随后 `840e29177d378509dc423ca7af3e2d70154b9a23` 补上 `docs/spec-changelog.md` 的 #122 行，并改 ARCHITECTURE §4.3、§16 与 `docs/backlog.md` 里因此失真的句子。在这个提交上、工作区干净时跑：

```bash
GATE_BASE=origin/main corepack pnpm run check
```

退出码 0。`check:format` 打印 `All matched files use Prettier code style!`。`check-file-size: 197 source files within hard limits`。dependency-cruiser：`no dependency violations found (105 modules, 183 dependencies cruised)`。`check-one-slice: 4 feature slice(s)`。`check-core-tests: core tests stay on the node project`。npm / pip / 模型许可证通过。`check-commits` 通过。`check-hotspots` 通过。`check-pr-size: 343 non-generated lines`。codegen 1 个 generator，随后的 `git diff --exit-code` 通过。Node v22.23.4，pnpm 10.34.9。

写入上面这段的提交只加记录，不再另跑一次全量 check。

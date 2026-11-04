# PR #69 命令

日期：2026-11-04。分支 `feature/m2-oi-app-content-type-69`。实现提交是 `161c16eb6d0369f0dd024301e317f08fbca9ab07`。下面的 vitest、eslint、typecheck、`check:format` 与 e2e 跑在该提交的文件内容上（命令先于 `git commit`，提交没有再改这些文件）。`check:size`、`check-docs`、`check:commits` 跑在 `161c16e` 上。工作目录是仓库根，除非另注。

Node 放在 PATH 前面的是 `/home/ubuntu/.nvm/versions/node/v22.23.4/bin`。`node -v` 是 v22.23.4。`corepack pnpm --version` 是 10.34.9。未改日志。`test:core` 不适用（`package.json` 没有这个脚本）。没有跑 `pnpm test`，没有跑 `pnpm run check`。没有改 `.github/`。

## 命令

| 命令 | 退出码 | 备注 |
| --- | --- | --- |
| `corepack pnpm exec vitest run apps/desktop/test/mime-types.test.ts apps/desktop/test/static-file.test.ts apps/desktop/test/protocol-response.test.ts apps/desktop/test/scheme-response.test.ts` | 0 | 4 files，17 passed。含表的每一行、大写扩展名、`x.bin` 与无扩展名、非 `.html` 仍 missing、200/HEAD/404/405 的 nosniff |
| `corepack pnpm exec eslint --max-warnings 0`（交接点名的 7 个文件） | 0 | 无输出 |
| `corepack pnpm run typecheck` | 0 | `node tools/typecheck.mjs` |
| `corepack pnpm run check:format` | 0 | All matched files use Prettier code style! |
| `cd apps/desktop && xvfb-run -a corepack pnpm run e2e -- e2e/csp.spec.ts` | 0 | 见下方。25 passed（11.8s） |
| `corepack pnpm run check:size` | 0 | `check-file-size: 214 source files within hard limits`。`mime-types.ts` 17 行 |
| `node tools/check-docs/check.mjs` | 0 | report-only。links 0，anchors 0，verbatim 0，status 9。这 9 条是既有文件缺状态行，本 PR 没改它们 |
| `corepack pnpm run check:commits` | 0 | subjects match Conventional Commits。当时 HEAD 是 `161c16e` |

eslint 的 7 个文件：

```bash
corepack pnpm exec eslint --max-warnings 0 \
  apps/desktop/src/main/mime-types.ts \
  apps/desktop/src/main/static-file.ts \
  apps/desktop/src/main/protocol-response.ts \
  apps/desktop/test/mime-types.test.ts \
  apps/desktop/test/static-file.test.ts \
  apps/desktop/test/protocol-response.test.ts \
  apps/desktop/e2e/csp.spec.ts
```

e2e 的脚本行是 `pnpm run build && playwright test -- e2e/csp.spec.ts`。`e2e` 脚本本身是 `pnpm run build && playwright test`，追加的路径没有收窄收集范围，Playwright 跑了 `e2e/` 下 25 条。新用例 `sends nosniff and html when the oi-app document reloads` 在其中通过。原先三条 CSP 断言也通过。第一次启动时打印了 `Downloading Electron binary...`。没有改用别的命令再收窄。

`check-docs` 的 9 条 status 都不是本 PR 的文件：`docs/README.md`、`docs/WORKFLOW.md`、`docs/architecture/inputs/pdf_translation_architecture.md`、`docs/ci-and-environment.md`、`docs/design/md-reader.md`、`docs/gate-remediation.md`、`docs/incidents/TEMPLATE.md`、`docs/reviews/2026-10-30-architecture-review.md`。脚本只报告，退出码仍是 0。

写入本文件并回填执行计划的「实际」列之后，再跑一次 `check:size`、`node tools/check-docs/check.mjs` 与 `check:commits`。结果补在下面。

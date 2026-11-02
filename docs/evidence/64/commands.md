# PR #64 命令

日期：2026-11-02。工作目录是仓库根，除非另行写出。Node 是 `.nvmrc` 的 v22.23.4，PATH 前置 `/home/ubuntu/.nvm/versions/node/v22.23.4/bin`。`node` 与 `corepack` 都来自这一支：`node -v` 为 v22.23.4，corepack 0.36.0，`corepack pnpm --version` 为 10.34.9。Python 3.11.18，uv 0.13.6。没有截图。大文件：无。未改日志。

基线 `GATE_BASE=origin/main`（`578a59dec6be8a8ccba2a0771da25b8bc21b8012`）。

## `366deaaba853472ef3d4cc962ae17a4241e8c47c`

全量检查跑在这一笔。其后的证据记录不重跑这套。

| 命令 | 退出码 | 备注 |
| --- | --- | --- |
| `nvm install`，然后 `nvm use` | 0，0 | 已有 22.23.4。打印 Now using node v22.23.4（npm v10.9.9） |
| `corepack enable` | 0 | 随后 `corepack pnpm --version` 为 10.34.9 |
| `corepack pnpm install --frozen-lockfile` | 0 | Lockfile is up to date，Already up to date。`pnpm-lock.yaml` 无 diff |
| `GATE_BASE=origin/main corepack pnpm run check` | 0 | lint、typecheck、typecheck:core、行数（116 个源文件）、dependency-cruiser（35 modules，无违例）、core 测试位置、npm/pip/模型许可证、G18（0 个功能切片）、Conventional Commits、热点、PR 体量（25 行非生成 diff）、codegen（1 个生成器）、G7。其后工作树干净 |
| `corepack pnpm test` | 0 | Vitest 51 个文件、81 通过、2 跳过。跳过的是 `tools/check-secrets/leak.test.ts`：当时未设 `GITLEAKS_BIN` |
| `node tools/gate-remediation/run.mjs --id G9 -- /tmp/gitleaks detect --source . --config .gitleaks.toml --redact --no-banner` | 0 | gitleaks 8.30.1。192 commits，no leaks found |
| `GITLEAKS_BIN=/tmp/gitleaks corepack pnpm exec vitest run tools/check-secrets/leak.test.ts` | 0 | 2 通过。补上上面被跳过的 G9 用例，不是第二次全量 |

`test:core`：不适用（`package.json` 没有这个脚本）。没有执行。

`@types/node` 保持 22.20.5。2026-11-02 查 npm，22 线最新就是这个版本。

对照 N-10 / N-11：diff 不含 `DESIGN.md`、`docs/design-principles.md`、`docs/design/**`、`.cursor/environment.json`、`.cursor/install.sh`。

本环境没有跑 Windows 与 macOS 的 worker 健康检查。那两项看 GitHub Actions。

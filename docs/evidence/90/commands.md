# PR #90 命令

日期：2026-11-03。工作目录是仓库根，除非另行写出。Node 是 `.nvmrc` 的 v22.23.4，PATH 前置 `/home/ubuntu/.nvm/versions/node/v22.23.4/bin`。`node -v` 为 v22.23.4，`corepack pnpm --version` 为 10.34.9。未改日志。

代码提交是 `e33d9e449973be897cfaafd01233527bf0155072`（收集排除与守卫）和 `1306d74cd92eab5c134b08c1434c5957d8417e01`（权限断言与启动耗时）。下面的命令跑在这两笔所含的工作树上。本文件提交之后只改 docs。

基线是 `origin/main` 的 `98ebf218609fe25c3bb6c6ee40b93e4e00b13fff`。全量 `corepack pnpm test` 与 `corepack pnpm run check` 没有跑。`test:core`：不适用（`package.json` 没有这个脚本）。没有执行。

## 收集计数

`vitest list` 的实验性 typecheck 横幅在 stderr，不计入下面的行数。

| 命令 | 基线 `98ebf21` | 排除生效后 |
| --- | --- | --- |
| `corepack pnpm exec vitest list` | 164 行，其中 4 行路径在 `packages/contracts/node_modules/@oi/kernel` | 161 行。路径段含 `node_modules` 的是 0。整行出现该字符串的 1 行是新守卫的标题 |
| `corepack pnpm exec vitest list --filesOnly` | 71 行，3 个 symlink 文件 | 69 行，0 个 `node_modules` 路径 |
| `corepack pnpm exec vitest list --typecheck.only --filesOnly` | 14 行，0 个 `node_modules` | 14 行，0 个 `node_modules` |

`--filesOnly` 的差集：去掉 `clock.test.ts`、`logger.test.ts`、`result.test.ts` 的 symlink 副本，加上 `tools/vitest-collect/no-node-modules.test.ts`。71 − 3 + 1 = 69。用例行 164 − 4 + 1 = 161。重复收集正好少 4 条用例、3 个文件。`typecheck.exclude` 未改。

## 命令

| 命令 | 退出码 | 备注 |
| --- | --- | --- |
| `corepack pnpm install --frozen-lockfile` | 0 | Lockfile is up to date。`pnpm-lock.yaml` 无改动。此时 electron 二进制仍缺 |
| `node node_modules/.pnpm/electron@45.2.1/node_modules/electron/install.js` | 0 | 包自带安装脚本。装完后 `require('electron')` 指向该包 `dist/electron`。锁文件无改动 |
| `corepack pnpm exec vitest run tools/vitest-collect/no-node-modules.test.ts` | 1，随后 0 | 第一次整行匹配 `node_modules`，被守卫自己的标题打中，1 失败。改为只看 ` > ` 左侧路径段后重跑：1 个文件、1 通过。Type Errors: no errors |
| `corepack pnpm exec vitest list` 与 `--filesOnly` | 0 | 见上表。路径段含 `node_modules` 的条数为 0 |
| `corepack pnpm --dir apps/desktop run build` | 0 | 写出 `apps/desktop/dist/main/index.js`。`dist/` 被 gitignore，未入库 |
| `corepack pnpm exec eslint --max-warnings 0 vitest.config.ts tools/vitest-collect/no-node-modules.test.ts apps/desktop/e2e/permissions.spec.ts apps/desktop/e2e/fixtures/electron-app.ts` | 0 | 四个改动文件 |
| `corepack pnpm exec tsc --noEmit --pretty false --project tsconfig.json` | 0 | 项目 typecheck，不是全量 `pnpm test` |

## permissions.spec.ts（本机 xvfb）

工作目录 `apps/desktop`。命令：

`xvfb-run -a corepack pnpm exec playwright test e2e/permissions.spec.ts`

第一次在断言收成 `granted` 之前（当时最后一条是 `not.toBe("denied")`，该写法没有提交）。退出码 0。6 passed（3.0s）。覆盖后日志：`notification query after override: granted granted`。启动毫秒：634、279、250、257、259、267。合计 1946，平均 1946/6 ms。

第二次是已提交的 `toBe("granted")`。退出码 0。6 passed（2.7s）。覆盖后日志仍是 `notification query after override: granted granted`。启动毫秒：270、265、257、279、256、249。合计 1576，平均 1576/6 ms。

两次覆盖前的查询都由用例断言为 `denied`，否则这 6 条不会通过。fixture 的 `scope` 仍是 `test`。本机没有跑其余 18 个 e2e。全套平均启动 T 用下面的 Windows 日志，不用本机这 6 次。

## desktop-e2e-windows

run `41610915781`，job `125832260932`，结论 success。head SHA `da2a901281c37fc2f3d35893823068d0f363eb82`。日志步骤 Playwright Electron smoke：`Running 24 tests using 1 worker`，结尾 `24 passed (23.3s)`。23.3s 是这条墙钟，不是启动合计。

覆盖用例 `e2e\permissions.spec.ts:23:1 › grants notifications when the check handler is overridden to allow` 的下一行是：

`notification query after override: granted granted`

24 条 `electron launch ms` 按出现顺序：6680、444、443、438、462、457、456、451、425、428、416、416、447、444、415、428、419、425、417、421、419、411、423、421。条数 24，合计 16606 ms，平均 16606/24 ms。第一条 6680 的前面有一行 `Downloading Electron binary...`，平均含这次下载。

门槛按这个平均重算：用例数 × (16606/24) 达到 Playwright `timeout` 120_000 ms 时，再改为 worker 级 fixture。173 × 16606 / 24 = 2872838/24 ms，低于 120_000。174 × 16606 / 24 = 2889444/24 ms，高于 120_000。当前 24 条的启动合计就是 16606 ms。

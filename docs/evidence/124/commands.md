# PR #124 命令

日期：2026-11-04。分支 `feature/m1-windows-check-fix`。工作目录是仓库根。Node 放在 PATH 前面的是 `/home/ubuntu/.nvm/versions/node/v22.23.4/bin`。`node -v` 是 v22.23.4，`corepack pnpm --version` 是 10.34.9。基线 `origin/main` 是 `be998cc250e95a3f54c802cab5ea7900ea6aee69`。未改日志。没有改 `.github/workflows/**`。没有改依赖版本，没有改许可证白名单。

`test:core`：不适用（`package.json` 没有这个脚本）。没有执行。没有跑全量 `corepack pnpm test`。没有跑 worker pytest（未改 Python）。未在 Windows 上跑 `pnpm run check`。

代码提交是 `d6653a1`（`fix(check): 在 Windows 上为 .cmd 垫片补扩展名`）和 `78ab6de1e76e26de7b11a32c8994218e882afba2`（`fix(codegen): 生成文件固定写成 LF`）。下面的命令跑在 `78ab6de` 上，工作区干净。本文件是随后的记录。

## 单测

```bash
corepack pnpm exec vitest run tools/spawn-bin/spawn-bin.test.ts tools/codegen/line-endings.test.ts tools/gate-remediation/run.test.ts tools/codegen/drift.test.ts
```

退出码 0。4 个文件，14 passed，失败 0，跳过 0。Type Errors: no errors。Vitest 5.0.5，开始于 02:20:15，耗时 599ms。

`tools/spawn-bin/spawn-bin.test.ts` 注入 `platform: "win32"` 和一张假的查找表：`git`、`node`、`uv` 一次成功；`prettier`、`corepack`、`eslint`、`tsc` 的裸名返回 `ENOENT`，同名 `.cmd` 返回退出码 0。同一张表上，单次 spawn 裸名得到 `ENOENT`；`spawnCommand` 得到退出码 0，调用顺序是裸名然后 `.cmd`。`platform: "linux"` 只启动裸名。prettier 的 glob 留在 argv 里，`options.shell` 未设置。

`tools/codegen/line-endings.test.ts`：含 `\r` 的文本与 LF 索引不相等；`toLf` 之后相等。`copyGenerators` 读入 CRLF 源文件后写出 LF。`publishModels` 读入 CRLF 的 `model.py` 后写出 LF。

## 门禁

在 `78ab6de1e76e26de7b11a32c8994218e882afba2` 上跑。当时还没有本文件。

```bash
GATE_BASE=origin/main corepack pnpm run check
```

退出码 0。`check:format` 打印 `All matched files use Prettier code style!`。eslint 与两次 tsc 无输出、退出码 0。`check-file-size: 199 source files within hard limits`。dependency-cruiser：`no dependency violations found (105 modules, 183 dependencies cruised)`。`check-core-tests: core tests stay on the node project`。npm / pip / 模型许可证通过。`check-one-slice: 0 feature slice(s)`。`check-commits` 通过。`check-hotspots` 通过。`check-pr-size: 333 non-generated lines`。codegen 1 个 generator，随后的 `git diff --exit-code` 通过。日志在 `/opt/cursor/artifacts/check-78ab6de.log`。

`98ee03a8d896d454a5421296ca63a81162cf3442` 只加本文件。在该提交上再跑 `GATE_BASE=origin/main corepack pnpm run check`，退出码 0。`check-pr-size: 364 non-generated lines`。其余步骤与上面相同。日志在 `/opt/cursor/artifacts/check-98ee03a.log`。

## colorama 按包名映射

Wisdom 2026-11-04 10:27：`colorama` 按包名放行为 BSD-3-Clause，写法与 httpx、Jinja2 相同。不对 `BSD License` 做全局映射。Windows CI 不改，未改 `.github/workflows/**`。未改 `whitelist.json`、`dev-only.json`、RULES §1.5。

标签 0.4.6 的 `LICENSE.txt` 是三条 BSD（保留版权声明、二进制再分发带声明、不得用版权持有人名义背书），对应 SPDX `BSD-3-Clause`。这条写在 `tools/check-license/package-aliases.json` 的 `reason` 里。别名文件用 `reason` 字段，没有另加注释。

规格变更记录：不加行。`docs/spec-changelog.md` 只记规格文档。这次不改 PRD、ARCHITECTURE、RULES、DESIGN。BSD-3-Clause 已在白名单。映射沿用已有的按包名别名，不改 G10 的句子。

代码提交是 `448de25780f622005e5f726621631aee9fea60ad`。

```bash
corepack pnpm exec vitest run tools/check-license/package-aliases.test.ts
```

退出码 0。1 个文件，3 passed，失败 0，跳过 0。Type Errors: no errors。开始于 02:31:09，耗时 239ms。`colorama` 报 `BSD License` 时映射为 `BSD-3-Clause`，`check-pip --from-json` 退出码 0。`not-colorama` 报同一字样时原样返回，门禁退出码非 0，输出含 `not-colorama: BSD License` 与 G10。`grimp` 仍映射为 `BSD-2-Clause`。

在 `448de25` 上、工作区干净、当时还没有本节时跑：

```bash
GATE_BASE=origin/main corepack pnpm run check
```

退出码 0。`check:format` 打印 `All matched files use Prettier code style!`。`check-file-size: 200 source files within hard limits`。dependency-cruiser：`no dependency violations found (105 modules, 183 dependencies cruised)`。npm / pip / 模型许可证通过。`check-one-slice: 0 feature slice(s)`。`check-commits` 通过。`check-hotspots` 通过。`check-pr-size: 428 non-generated lines`。codegen 1 个 generator，随后的 `git diff --exit-code` 通过。日志在 `/opt/cursor/artifacts/check-448de25.log`。

写入本节的提交是 `bd19b16a1129335b094d7efa1c577a36689de382`。相对 `448de25` 增加 27 行、删除 1 行；被删的一行是本分支先前加上的，相对 `origin/main` 的 `check-pr-size` 为 454。在该提交上再跑 `GATE_BASE=origin/main corepack pnpm run check`，退出码 0。日志在 `/opt/cursor/artifacts/check-bd19b16.log`。

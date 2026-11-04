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

本文件这一笔只加记录。包含本文件的 tip 上再跑一次同一命令的退出码写在 PR 描述。

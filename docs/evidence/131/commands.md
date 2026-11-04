# PR #131 命令

日期：2026-11-04。分支 `feature/check-docs-github-slug`。工作目录是仓库根。Node 放在 PATH 前面的是 `/home/ubuntu/.nvm/versions/node/v22.23.4/bin`。`node -v` 是 v22.23.4，`corepack pnpm --version` 是 10.34.9。基线 `origin/main` 是 `d2dfcb5229c08db567a32cb833bdde4c5f151d1e`。未改日志。没有改 `.github/workflows/**`。没有改依赖版本，没有改许可证白名单。

`test:core`：不适用（`package.json` 没有这个脚本）。没有执行。没有跑全量 `corepack pnpm test`。没有跑 worker pytest。

实现提交是 `cb5ddf3e39e9264f0dd34e4b289182d77881e42e`。下面的命令跑在该提交的内容上。本文件是随后的记录，不回改计划。

## 对照

GitHub contents HTML（`Accept: application/vnd.github.html`），抓取日期 2026-11-04：

- `docs/arch/09.md`：`id="user-content-9-ipc-协议renderer--main"`
- `docs/prd/01.md`：`id="user-content-1-一句话"`

同一套抓取里，`docs/arch/09-01.md`、`docs/arch/14-01.md`、`docs/prd/03-03.md` 的 id 分别是 `91-v2-桌面端-ui-新增-seam已采纳adr-0001wisdom-2026-11-04`、`141-发生了什么数据来自旧仓库只读审查见-v1-审查-3`、`33-设置模型能力的本地--api与面壁开放平台q9wisdom-2026-10-30-18371844`。`links.test.ts` 的期望值用这些字符串。

## 单测

```bash
corepack pnpm exec vitest run tools/check-docs/links.test.ts
```

退出码 0。1 个文件，10 passed，失败 0，跳过 0。Type Errors: no errors。Vitest 5.0.5，开始于 05:28:04（与 compare 测试同一轮），耗时见该轮合计 409ms。

```bash
corepack pnpm exec vitest run tools/compare-spec-bytes/compare.test.ts
```

退出码 0。1 个文件，13 passed，失败 0，跳过 0。Type Errors: no errors。同一轮 Vitest，开始于 05:28:04。

修之前在 `d2dfcb5` 上 `node tools/check-docs/check.mjs` 是 `links: 0`、`anchors: 5`、`status: 9`、`verbatim: 0`、`findings: 14`。实现之后：

```bash
node tools/check-docs/check.mjs
```

退出码 0。

```text
check-docs: report-only
links: 0
anchors: 0
status: 9
verbatim: 0
findings: 9
```

## 浅克隆

```bash
git clone --depth=1 --single-branch --branch feature/check-docs-github-slug file:///agent/repos/open-immerse-v2 /tmp/oi-shallow-file
```

`git rev-parse --is-shallow-repository` 是 `true`。克隆里没有 `refs/remotes/origin/main`。把 `origin` 指到 `https://github.com/wisdom-km/open-immerse-v2.git` 之后：

```bash
corepack pnpm exec vitest run tools/compare-spec-bytes/compare.test.ts -t "keeps root heading slugs identical to origin/main"
```

退出码 0。1 passed，12 skipped，失败 0。随后 `refs/remotes/origin/main` 是 `d2dfcb5229c08db567a32cb833bdde4c5f151d1e`，仓库仍是 shallow。

不加 `file://` 的本地克隆会忽略 `--depth`（Git 的警告）。那次克隆同样没有 `origin/main`，同一条测试也是退出码 0，但不算 `--depth=1`。

## 门禁

跑 check 之前执行了 `corepack pnpm install --frozen-lockfile`，退出码 0，lockfile 没有改动。它补上了 `@oi/feature-jobs` 到 `@oi/contracts` 的 workspace 链接。记录的检查是这次安装之后、在仓库根跑的。更早有一次从 `/tmp/oi-shallow-file` 启动的 `pnpm check`，eslint 扫到了那个目录，不作为本次结果。

在 `cb5ddf3e39e9264f0dd34e4b289182d77881e42e` 上跑。当时还没有本文件。

```bash
GATE_BASE=origin/main corepack pnpm run check
```

退出码 0。`check:format` 打印 `All matched files use Prettier code style!`。eslint 与两次 tsc 无输出、退出码 0。`check-file-size: 208 source files within hard limits`。dependency-cruiser：`no dependency violations found (104 modules, 186 dependencies cruised)`。`check-core-tests: core tests stay on the node project`。npm / pip / 模型许可证通过。`check-one-slice: 0 feature slice(s)`。`check-commits` 通过。`check-hotspots` 通过。`check-pr-size: 209 non-generated lines`。codegen 0 个 generator，随后的 `git diff --exit-code` 通过。日志在 `/opt/cursor/artifacts/check-cb5ddf3.log`。

本文件会让非生成行数高于 209，仍低于 600。规格变更记录：不加行。这次不改 PRD、ARCHITECTURE、RULES、DESIGN。

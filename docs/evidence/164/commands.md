# PR #164 命令

日期：2026-11-05（Asia/Shanghai）。分支 `cursor/docs-drift-daycheck-28-4675`。工作目录是仓库根。对照的代码是 `origin/main` `523c18d41a6035b2154a86206b021a4492a5436c`。

Node 放在 PATH 前面的是 `/home/ubuntu/.nvm/versions/node/v22.23.4/bin`。`node -v` 是 v22.23.4。

`test:core`：不适用（`package.json` 没有这个脚本）。没有执行。pytest、e2e、全量 `pnpm test` 没有执行。未改日志。没有改 `.github/workflows/**`、`apps/`、`packages/`、`workers/`、`DESIGN.md`、`docs/design-principles.md`、`docs/design/**`、`.cursor/environment.json`、`.cursor/install.sh`。

下面四条先跑在 `1a02eff59242c4662d5d5810722e15d98ccb497c`（还没有本文件，changelog 里 PR 列还是「本 PR」）。本文件和 changelog 的 #164 链接写上之后再跑一次 compare-spec-bytes、check-docs、check-commits、check-pr-size，输出相同。

## compare-spec-bytes

```bash
node tools/compare-spec-bytes/compare.mjs
```

退出码 0。

```text
compare-spec-bytes: PRD.md 36 parts match f8d5d01dc8af81b73689c7229c983192551fa6fe (194695 bytes)
compare-spec-bytes: ARCHITECTURE.md 66 parts match f8d5d01dc8af81b73689c7229c983192551fa6fe (364474 bytes)
compare-spec-bytes: RULES.md span matches f8d5d01dc8af81b73689c7229c983192551fa6fe (2795 bytes)
compare-spec-bytes: 68 path prefixes
```

不改基线 `f8d5d01`，不改 `compare.mjs`。manifest 加了 9 条唯一替换。

## check-docs

```bash
node tools/check-docs/check.mjs
```

退出码 0。

```text
check-docs: strict
links: 0
anchors: 0
status: 0
verbatim: 0
tree: 0
findings: 0
```

## Vitest

```bash
corepack pnpm exec vitest run tools/compare-spec-bytes/compare.test.ts tools/check-docs
```

退出码 0。6 个文件，40 条通过，类型错误 0。只在 `1a02eff` 上跑了这一次。本文件不改这些测试所覆盖的规格字节。

## 提交信息与 PR 体量

`GATE_BASE=origin/main`。

```bash
node tools/check-commits/check.mjs --base origin/main
node tools/check-pr-size/check.mjs --base origin/main
```

退出码都是 0。`check-commits: subjects match Conventional Commits`。`1a02eff` 上 `check-pr-size: 88 non-generated lines`。加上本文件和 changelog 的一行替换之后，行数会略增，仍低于 600，不需要 `G12:`。

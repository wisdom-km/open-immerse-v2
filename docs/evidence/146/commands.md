# 命令

日期：2026-11-04。分支 `feature/ci-docs-required-28`。下面四条跑在 `f667f6b9198e3257f18d1d2576ccae9d2a5edac4`。工作目录是仓库根。Node 是 `.nvmrc` 的 22.23.4。本文件只补日志，不改检查器。

## check-docs

```
node tools/check-docs/check.mjs
```

退出码 0。

```
check-docs: report-only
links: 0
anchors: 0
status: 0
verbatim: 0
tree: 3
findings: 3
tree-path-missing	docs/arch/03.md	fixtures/providers/
tree-path-missing	docs/arch/03.md	fixtures/parsing-rules/
tree-path-missing	docs/arch/03.md	fixtures/corpus/
```

临时目录（未提交）里放一个链到不存在文件的 `docs/note.md`，再 `node tools/check-docs/check.mjs --root <临时目录>`。退出码 0。输出含 `missing-file	docs/note.md	no-such-file.md` 与 `findings: 1`。发现数大于 0 仍不失败，因为目录树这 3 条还在，交接要求先停下。

## compare-spec-bytes

```
node tools/compare-spec-bytes/compare.mjs
```

退出码 0。PRD 36 段、ARCHITECTURE 66 段、RULES 一段，对得上 `f8d5d01dc8af81b73689c7229c983192551fa6fe`。

## eslint

```
corepack pnpm exec eslint --max-warnings 0 tools/check-docs/*.mjs tools/check-docs/*.test.ts
```

退出码 0。

## vitest

```
corepack pnpm exec vitest run tools/check-docs/
```

退出码 0。5 个文件，25 个测试通过，类型错误 0。Vitest 5.0.5。

没有跑 e2e，没有跑全量 `pnpm test` 或 `pnpm check`。

## 2026-11-04 17:28 之后

下面几条跑在 `979bb8d7db19482115d2a919e67cd2608b1551b3`。三个目录没有创建。

### check-docs

```
node tools/check-docs/check.mjs
```

退出码 0。

```
check-docs: strict
links: 0
anchors: 0
status: 0
verbatim: 0
tree: 0
findings: 0
```

临时目录（未提交）里放 `docs/note.md`，链到不存在的 `no-such.md`，再 `node tools/check-docs/check.mjs --root <临时目录>`。退出码 1。输出含 `missing-file	docs/note.md	no-such.md` 与 `findings: 1`，首行 `check-docs: strict`。同一目录加 `--report-only` 时退出码 0，首行 `check-docs: report-only`。

### compare-spec-bytes

```
node tools/compare-spec-bytes/compare.mjs
```

退出码 0。PRD 36 段、ARCHITECTURE 66 段、RULES 一段，对得上 `f8d5d01dc8af81b73689c7229c983192551fa6fe`。

### eslint、prettier、vitest

```
corepack pnpm exec eslint --max-warnings 0 tools/check-docs/*.mjs tools/check-docs/*.test.ts
corepack pnpm exec prettier --check tools/check-docs/check.mjs tools/check-docs/report.mjs tools/check-docs/*.test.ts
corepack pnpm exec vitest run tools/check-docs/
```

退出码都是 0。Vitest 5 个文件，26 个测试通过。

没有跑 e2e，没有跑全量 `pnpm test` 或 `pnpm check`。

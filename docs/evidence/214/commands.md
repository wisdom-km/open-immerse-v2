# PR #214 文档门禁

Node v22.23.4。工作目录是仓库根。起点是 `main` `4a2d967ae771ace73c4ddc112b6eb91a8fe7681f`。规格改动在 `0e0f660b08d2672f4418cc527e765cb2676e785e`。下面四条在写入本文件之后、提交本文件之前又跑了一遍，工作树含本文件和 changelog 里的 PR 链接。全套 `pnpm run check` 与 `pnpm test` 交给 CI（RULES §4，每个 tip 一次）。没有改产品代码、contracts、CI。没有 Ready、合入或发版。

## node tools/check-docs/check.mjs

退出码 0。findings 0。

```
check-docs: strict
links: 0
anchors: 0
status: 0
verbatim: 0
tree: 0
findings: 0
```

## node tools/compare-spec-bytes/compare.mjs

退出码 0。

```
compare-spec-bytes: PRD.md 36 parts match f8d5d01dc8af81b73689c7229c983192551fa6fe (196494 bytes)
compare-spec-bytes: ARCHITECTURE.md 66 parts match f8d5d01dc8af81b73689c7229c983192551fa6fe (374161 bytes)
compare-spec-bytes: RULES.md span matches f8d5d01dc8af81b73689c7229c983192551fa6fe (2795 bytes)
compare-spec-bytes: 68 path prefixes
```

## git diff --check

退出码 0。

## corepack pnpm exec vitest run tools/compare-spec-bytes/compare.test.ts tools/check-docs

退出码 0。6 个文件、40 个测试。第一次跑在 `0e0f660` 的干净树上。写入本文件后又跑了一遍。

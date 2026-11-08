# 契约与门禁

校验对象是契约提交 `b60cd8da57561f4eb4f076e54f4e9bbb44af9c1f`。Node v22.23.4。pnpm 10.34.9。`GATE_BASE=origin/main`。没有手动触发 CI，没有为洗绿重跑。

## corepack pnpm run check

退出码 0。其中 `check-pr-size: 560 non-generated lines`。codegen 之后 `git diff --exit-code` 通过。`check-one-slice: 0 feature slice(s)`。

## corepack pnpm test

Vitest 153 个文件，647 通过，3 跳过，类型错误 0。退出码 0。

具名 G9 `allows a synthetic key that uses the oitest_ prefix (G9)` 在这次全量里执行，日志有 `g9-phase case=allow-oitest phase=binary`，并随套件通过。这只证明本 tip 的这次运行，不是根因修复。

## node tools/compare-spec-bytes/compare.mjs

compare-spec-bytes: PRD.md 36 parts match f8d5d01dc8af81b73689c7229c983192551fa6fe (195650 bytes)
compare-spec-bytes: ARCHITECTURE.md 66 parts match f8d5d01dc8af81b73689c7229c983192551fa6fe (370225 bytes)
compare-spec-bytes: RULES.md span matches f8d5d01dc8af81b73689c7229c983192551fa6fe (2795 bytes)
compare-spec-bytes: 68 path prefixes

退出码: 0

## node tools/check-docs/check.mjs

check-docs: strict
links: 0
anchors: 0
status: 0
verbatim: 0
tree: 0
findings: 0

退出码: 0

## git diff --check

退出码: 0

## 补上 #180 链接之后

`docs/spec-changelog.md` 把「本 PR」改成 #180。规格句子没有再改。compare、check-docs、`git diff --check` 再跑一次，退出码都是 0。没有重跑 `pnpm test` 或 `pnpm run check`。

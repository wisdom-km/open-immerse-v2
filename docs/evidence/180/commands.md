# 契约与门禁

校验对象是契约提交 `b60cd8da57561f4eb4f076e54f4e9bbb44af9c1f`。Node v22.23.4。pnpm 10.34.9。`GATE_BASE=origin/main`。没有手动触发 CI，没有为洗绿重跑。

## corepack pnpm run check

退出码 0。其中 `check-pr-size: 560 non-generated lines`。codegen 之后 `git diff --exit-code` 通过。`check-one-slice: 0 feature slice(s)`。

## corepack pnpm test

Vitest 153 个文件，647 通过，3 跳过，类型错误 0。退出码 0。

本地日志只有 `g9-phase case=allow-oitest phase=binary`。`GITLEAKS_BIN` 未设置且不是 CI 时，三条 detect 在进入 gitleaks 之前 skip。因此上面这 3 个跳过不是具名 G9 的执行。b538e09 的 CI node job（run 42503894788）才实际跑了具名 G9 并通过。那次通过不是根因修复。

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

## 2026-11-09 01:56 修正，代码提交 19e7c1a

校验对象是 `19e7c1a72cb4f732da510fdea9dc47f0744fb40e`。Node v22.23.4。`GATE_BASE=origin/main`。本机没有 Electron 二进制。没有把 `/tmp` 探针当成 Electron 实跑。没有重跑 b538e09 的 Windows 失败。

### corepack pnpm run check

退出码 0。`check-pr-size: 630 non-generated lines`。提交说明里有 `G12:`。codegen 之后 `git diff --exit-code` 通过。`check-one-slice: 0 feature slice(s)`。`check-hotspots` 通过。

### corepack pnpm test

Vitest 154 个文件，648 通过，3 跳过，类型错误 0。退出码 0。3 个跳过仍是 `GITLEAKS_BIN` 未设置时的 detect：`rejects a committed access key that lacks the oitest_ prefix (G9)`、`allows a synthetic key that uses the oitest_ prefix (G9)`、`rejects the same suffix when the prefix is nottest_ (G9)`。日志只有 `phase=binary`。这不是具名 G9 通过。

### 启动边界

`apps/desktop/test/ipc-production-assembly.test.ts` 含在上面的全量里。它用生产命令表的四个 key 调用真实 `registerIpcRouter` 和真实 `ipcRegistry`。`parsing.getParseCapabilities` 不在生成的 preload、`oi-api.d.ts` 或 registry 里。

### 本机未跑

Electron e2e 与 Windows 真机未在本机跑。具名 G9 的 detect 留待本 tip 的 CI node job。旧失败保留：run 42503894788，head b538e09，Windows Playwright 27 次 `firstWindow` 超时。

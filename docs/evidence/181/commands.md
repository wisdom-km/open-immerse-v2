# 契约与门禁

校验对象是契约提交 `a5573841f0eec3dfb963a575ac5f53dbeb027058`。Node v22.23.4。pnpm 10.34.9。`GATE_BASE=origin/main`。没有手动触发 CI，没有为洗绿重跑。本机没有 Electron 二进制。

## corepack pnpm run check

退出码 0。`check-pr-size: 638 non-generated lines`。提交说明里有 `G12:`。codegen 之后 `git diff --exit-code` 通过，preload、`oi-api.d.ts` 与 registry 无 diff。`check-one-slice: 0 feature slice(s)`。`check-hotspots` 通过。

## corepack pnpm test

Vitest 159 个文件，667 通过，3 跳过，类型错误 0。退出码 0。

3 个跳过是 `GITLEAKS_BIN` 未设置时的 detect：`rejects a committed access key that lacks the oitest_ prefix (G9)`、`allows a synthetic key that uses the oitest_ prefix (G9)`、`rejects the same suffix when the prefix is nottest_ (G9)`。日志只有 `phase=binary`。这不是具名 G9 通过。

## node tools/compare-spec-bytes/compare.mjs

compare-spec-bytes: PRD.md 36 parts match f8d5d01dc8af81b73689c7229c983192551fa6fe (195946 bytes)
compare-spec-bytes: ARCHITECTURE.md 66 parts match f8d5d01dc8af81b73689c7229c983192551fa6fe (371510 bytes)
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

## 公开面

`apps/desktop/test/reading-command-surface.test.ts` 含在上面的全量里。四条通道名不在生成的 preload、`oi-api.d.ts` 或 registry 里。生产装配测试仍用文献库命令表的四个 key 调用真实 `registerIpcRouter` 和真实 `ipcRegistry`。本记录没有改那个测试。

## 本机未跑

Electron e2e 与 Windows 真机未在本机跑。具名 G9 的 detect 留待本 tip 的 CI node job。AC-11、3A、PRC-01–26 与 8 GB Windows 录屏截图未验收。

## 补上 #181 链接之后

`docs/spec-changelog.md` 把「本 PR」改成 #181，并记下本文件。规格句子没有再改。compare、check-docs、`git diff --check` 再跑一次，退出码都是 0。没有重跑 `pnpm test` 或 `pnpm run check`。上面的 638 行是契约提交上的计数，不含本文件。

## F-08 修正

公开面回归改为断言 `ipcRegistry` 的通道值、`createOi` 返回对象的键，以及 `Window["oi"]` 与 `createOi` 返回类型的键。不读取 `src/` 文本。四条阅读命令和三条解析契约都不在这些公开面上。`ipc-production-assembly.test.ts` 没有改。`parse-capability-surface.test.ts` 没有改，它仍是 #180 留下的读文本测试。

本段没有重跑 `pnpm test` 或 `pnpm run check`。上面的 667 通过和 3 个 detect 跳过仍是 `a557384` 的记录，这 3 个跳过仍不是具名 G9 通过。

- `eslint` `apps/desktop/test/reading-command-surface.test.ts`：退出码 0。
- `vitest run` 该文件、`oi-keys.test.ts`、`ipc-production-assembly.test.ts`：3 个文件，4 通过，退出码 0。这不是全量。
- `corepack pnpm run typecheck`：退出码 0。`tsconfig.ui.json` 包含该测试，所以 `Window["oi"]` 与 preload 返回类型的断言进入编译。
- `corepack pnpm run codegen` 之后，三份生成文件 `git diff --exit-code`：退出码 0。

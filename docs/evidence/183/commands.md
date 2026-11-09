# 页码 command

校验对象是实现提交 `a8c0c7262bb80eca97fb17d67fe40d44e25f7270`（tree `1cb5a98ed5c549abb9d17a09eb7d6a08f57931e1`）。Node v22.23.4。pnpm 10.34.9。`GATE_BASE=origin/main`（`7d4b19e0a1064065de4be03adaf63f49cc27cace`）。没有手动触发 CI，没有为洗绿重跑。本机 `GITLEAKS_BIN` 未设置，也没有 gitleaks 可执行文件。`apps/desktop/node_modules/electron/dist` 不存在，没有 Electron 二进制。

计划与台账 PASS 先于这个实现提交：2026-11-09 10:50 Asia/Shanghai，[issue #174 评论 6731055619](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6731055619)。两条绑定条件都遵守：规格正文不改；请求门与已合入描述符的 `Value.Check` 对照。

## corepack pnpm run check

退出码 0。`check-pr-size: 1043 non-generated lines`。实现提交说明里有 `G12:`。`check-one-slice: 1 feature slice(s)`。`check-hotspots` 通过。`check-file-size: 415 source files within hard limits`。codegen 之后 `git diff --exit-code` 通过。

## corepack pnpm test

Vitest 165 个文件，698 通过，3 跳过，类型错误 0。退出码 0。

3 个跳过是 `GITLEAKS_BIN` 未设置时的 detect：`rejects a committed access key that lacks the oitest_ prefix (G9)`、`allows a synthetic key that uses the oitest_ prefix (G9)`、`rejects the same suffix when the prefix is nottest_ (G9)`。日志只有 `phase=binary`。这不是具名 G9 通过。

## node tools/compare-spec-bytes/compare.mjs

compare-spec-bytes: PRD.md 36 parts match f8d5d01dc8af81b73689c7229c983192551fa6fe (196083 bytes)
compare-spec-bytes: ARCHITECTURE.md 66 parts match f8d5d01dc8af81b73689c7229c983192551fa6fe (372071 bytes)
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

## 验收

| 项 | 证据 |
| --- | --- |
| 请求不合法不调用用例 | `get-progress-page-command.test.ts` 与 `set-progress-page-command.test.ts` 的描述符对照。`Value.Check` 为 false 时调用次数为 0，结果是 `invalid_payload` |
| `null` 与安全整数成功 | 读替身：页为 `null` 与 `Number.MAX_SAFE_INTEGER`，generation 等于请求。SQLite 读回写入前的 `null` |
| 超界读 | 真实 `createGetProgressPage` 加 `seedLibrary`。页是 `Number.MAX_SAFE_INTEGER + 1`。结果是 `invalid_payload`，`JSON.stringify` 不含该页。不断言 SQLite 超界读 |
| `not_found` / `rejected` | 注入用例。前者只有 `code` 与 `retryable`。后者只有 `code`、`retryable`、请求的 `id` 与 `generation` |
| `openedAt` | 真实 `createSetProgressPage`、真实 SQLite、`findById`。`openedAt` 仍是写入前的值，`progressPage` 是写入的 4 |
| generation 只回显 | 写替身返回页 9，请求页是 4、generation 是 5。成功体是页 9 与 generation 5。用例入参没有 generation |
| 公开面 | `apps/desktop/test/reading-command-surface.test.ts` 未改，含在上面的 698 里。两条通道不在 registry 与 `createOi` |
| 热点 | `composition-root.ts` 与 `slots.ts` 相对 `7d4b19e` 的 diff 都是 0 行 |

请求门不新增依赖。测试用 `createRequire` 装载 `@oi/contracts` 已有的 `@sinclair/typebox` 0.34.52，对导出的 `getProgressPage.request` 与 `setProgressPage.request` 调用 `Value.Check`。对照过 0、`Number.MAX_SAFE_INTEGER`、`Number.MAX_SAFE_INTEGER + 1`、小数、负数、`null`（读的 generation、写的 progressPage 与 generation）、缺字段、多余字段、非法 id。描述符实际行为也锁了三件：自有键数量与 schema 键数量相同时 `Value.Check` 短路、符号键被忽略、不可枚举的多余自有键被拒绝。这些对照没有未验项。

`Number.MAX_SAFE_INTEGER + 1` 与 `+ 2` 在本机都是 `9007199254740992`。

## 本机未跑

Electron e2e 未跑：没有 Electron 二进制。Box 未跑：两条命令不进 registry、preload 或生产 `wireIpc`，不单建 Box。Windows 真机未跑。AC-11、3A、PRC-01–26、UIX-57 与 8 GB 录屏仍未验收。SQLite 把超界整数读成 number 还是 bigint 未核实。具名 G9 的 detect 留待本 tip 的 CI node job。

## 规格

「规格后续更新」未执行。10:50 绑定条件写明 10:38 批准不含必要规格更新。上面的 compare-spec-bytes 与 check-docs 退出码都是 0，没有因文档门禁停下。

## 补上证据链接之后

本文件和执行计划的实际列、自检项在 `a8c0c72` 之后补上。规格句子没有改。补上这些文件之后再跑 `check-docs`、`compare-spec-bytes` 与 `git diff --check`，退出码都是 0。没有重跑 `pnpm test` 或 `pnpm run check`。上面的 1043 行和 698 通过是 `a8c0c72` 的记录，不含本文件。

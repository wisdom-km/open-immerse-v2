# 代际表与 bind / revoke

校验对象是实现提交 `9f9eabe2c797ec796f9c5ace546930ecd3017588`（tree `664d54d0f2a16615fbc02cb5acbcfbfb20263902`）。Node v22.23.4。pnpm 10.34.9。`GATE_BASE=origin/main`（`8c7c18e8ebea1b92f00a8f07f330ef8534ae603f`）。没有手动触发 CI，没有为洗绿重跑。本机 `GITLEAKS_BIN` 未设置，也没有 gitleaks 可执行文件。`apps/desktop/node_modules/electron/dist` 不存在，没有 Electron 二进制。

计划与台账 PASS 先于这个实现提交：2026-11-09 12:12 Asia/Shanghai，[PR #184 评论 6732021577](https://github.com/wisdom-km/open-immerse-v2/pull/184#issuecomment-6732021577)。

## corepack pnpm run check

退出码 0。`check-pr-size: 1282 non-generated lines`。实现提交说明里有 `G12:`。`check-one-slice: 1 feature slice(s)`。`check-hotspots` 通过。`check-file-size: 422 source files within hard limits`。codegen 之后 `git diff --exit-code` 通过。dependency-cruiser：327 modules，920 dependencies，no violations。

## corepack pnpm test

Vitest 169 个文件，715 通过，3 跳过，类型错误 0。退出码 0。

3 个跳过是 `GITLEAKS_BIN` 未设置时的 detect：`rejects a committed access key that lacks the oitest_ prefix (G9)`、`allows a synthetic key that uses the oitest_ prefix (G9)`、`rejects the same suffix when the prefix is nottest_ (G9)`。日志只有 `phase=binary`。这不是具名 G9 通过。

## node tools/compare-spec-bytes/compare.mjs

compare-spec-bytes: PRD.md 36 parts match f8d5d01dc8af81b73689c7229c983192551fa6fe (196226 bytes)
compare-spec-bytes: ARCHITECTURE.md 66 parts match f8d5d01dc8af81b73689c7229c983192551fa6fe (372390 bytes)
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
| 请求不合法不调用用例、不写表 | bind、revoke、get、set 的描述符对照。`Value.Check` 为 false 时调用次数为 0，结果是 `invalid_payload`。读和写另有「不查表」的用例 |
| 旧代际不调用用例 | 真实表先 bind 两次。旧 generation 的 get、set、revoke 都是 `rejected`，get 与 set 的调用次数为 0 |
| 当前代际的 `null` 与安全整数 | 读替身在代际匹配时成功，generation 等于请求。写替身返回页 9，请求页是 4、generation 是 5 |
| 超界读 | 真实 `createGetProgressPage` 加 `seedLibrary`。页是 `Number.MAX_SAFE_INTEGER + 1`。结果是 `invalid_payload`，`JSON.stringify` 不含该页。不断言 SQLite 超界读 |
| `not_found` / `rejected` | 当前代际下注入用例。前者只有 `code` 与 `retryable`。后者只有 `code`、`retryable`、请求的 `id` 与 `generation` |
| 上界 | `createReadingGenerationTable(id)` 把该 id 放在 `Number.MAX_SAFE_INTEGER`。bind 只带 id。旧代际还在。另一个 id 的成功 assetId 是 `"2"` |
| assetId | 空表第一次成功是 `"1"`，匹配 `^[0-9]+$` 与 `^[^/\\]+$`，不等于文献 id。bind 响应不含页，也不含 `/library-source` |
| 空表与不写库 | 第二个工厂实例匹配不到第一张表的代际。真实 SQLite 的 `findById` 在 bind 与 revoke 前后 `openedAt` 与 `progressPage` 不变 |
| 公开面 | `apps/desktop/test/reading-command-surface.test.ts` 未改，含在上面的 715 里。四条通道不在 registry 与 `createOi` |
| 热点与装配 | `composition-root.ts`、`slots.ts`、`library-wiring.ts`、`library-main.ts` 相对 `origin/main` 的 `git diff --numstat` 没有输出 |

`atCeiling` 不是入库，也不是生产 `startLibrary` 的参数。零参数调用仍是空表。

## 本机未跑

Electron e2e 未跑：没有 Electron 二进制。Box 未跑：四条命令不进 registry、preload 或生产 `wireIpc`，不单建 Box。Windows 真机未跑。AC-11、3A、PRC-01–26、UIX-57 与 8 GB 录屏仍未验收。SQLite 把超界整数读成 number 还是 bigint 未核实。真的杀掉 OS 进程再拉起未做，空表用第二个工厂实例证明。具名 G9 的 detect 留待本 tip 的 CI node job。

## 规格

步骤 4 按原句更新了 `docs/arch/02-05.md`、`docs/arch/09-01.md`、`docs/prd/08.md`。三处都写明 `expose` 仍为 false、生产 IPC 仍未开通。不写成重开或 `expose=true` 已验收。changelog 加一行。manifest 加四条唯一替换。不改基线 `f8d5d01`，不改 `compare.mjs`。上面的 compare-spec-bytes 与 check-docs 退出码都是 0。

## 补上证据链接之后

本文件和执行计划的实际列、自检项在 `9f9eabe` 之后补上。没有重跑 `pnpm test` 或 `pnpm run check`。上面的 1282 行和 715 通过是 `9f9eabe` 的记录，不含本文件。

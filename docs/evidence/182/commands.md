# 页码 core

校验对象是实现提交 `87d2324f521e575397862d1c895efe98ba6d09a8`。Node v22.23.4。pnpm 10.34.9。`GATE_BASE=origin/main`。没有手动触发 CI，没有为洗绿重跑。本机没有 Electron 二进制，也没有 `GITLEAKS_BIN`。

计划 PASS 先于这个实现提交：2026-11-09 03:47 Asia/Shanghai，[issue #174 评论 6726246791](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6726246791)。登记提交是 `05aeebe7f472cd880fcb37f234e806764fb9cdef`，当时还没有用例文件。

## corepack pnpm run check

退出码 0。`check-pr-size: 631 non-generated lines`。提交说明里有 `G12:`。codegen 之后 `git diff --exit-code` 通过。`check-one-slice: 1 feature slice(s)`。`check-hotspots` 通过。

同一工作区在补上 `G12:` 之前，`edb81144385ccee38a3cbba8b3ba676f84f3c25f` 的 `pnpm run check` 退出码 1，停在 pr-size。那次没有跑完 codegen。补上理由后的完整一次是上面的退出码 0。没有第三次。

## corepack pnpm test

Vitest 162 个文件，683 通过，3 跳过，类型错误 0。退出码 0。

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

## 本机未跑

Electron e2e、Box 和 Windows 真机未在本机跑。没有新增 Box 检出。具名 G9 的 detect 留待本 tip 的 CI node job。AC-11、3A、PRC-01–26、UIX-57 与 8 GB Windows 录屏截图未验收。

## 补上证据链接之后

本文件和执行计划的实际列在 `87d2324` 之后补上。规格句子没有再改。`check-docs`、`compare-spec-bytes` 和 `git diff --check` 再跑一次，退出码都是 0。没有重跑 `pnpm test` 或 `pnpm run check`。上面的 631 行和 683 通过是 `87d2324` 的记录，不含本文件。

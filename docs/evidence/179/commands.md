# 窄校验

校验对象是规格提交 `97c2224efd239cd4b3defcf599d19dbab24981a3`。本文件只记录文档一致性命令。没有跑产品全量，没有重跑 `255f0a317240975bdc34226ea40bf2421e5ece30`，没有手动触发 CI。

## node tools/compare-spec-bytes/compare.mjs

第一次在 ARCHITECTURE 字节 33006 失败：页级进度段落后少一个空行。补上后重跑。

compare-spec-bytes: PRD.md 36 parts match f8d5d01dc8af81b73689c7229c983192551fa6fe (195441 bytes)
compare-spec-bytes: ARCHITECTURE.md 66 parts match f8d5d01dc8af81b73689c7229c983192551fa6fe (369102 bytes)
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

## 补上 #179 链接之后再跑一次

`docs/spec-changelog.md` 把「本 PR」改成 #179 的链接，并写上本证据文件。规格句子没有再改。

compare-spec-bytes: PRD.md 36 parts match f8d5d01dc8af81b73689c7229c983192551fa6fe (195441 bytes)
compare-spec-bytes: ARCHITECTURE.md 66 parts match f8d5d01dc8af81b73689c7229c983192551fa6fe (369102 bytes)
compare-spec-bytes: RULES.md span matches f8d5d01dc8af81b73689c7229c983192551fa6fe (2795 bytes)
compare-spec-bytes: 68 path prefixes

退出码: 0

check-docs: strict
links: 0
anchors: 0
status: 0
verbatim: 0
tree: 0
findings: 0

退出码: 0

## 叙述校正之后再跑一次

只改了 §9 第三类的限定语、manifest 里同一处唯一替换、approvals 的 22:56 分类与计数、以及规格变更记录里对应的一句。没有重跑产品全量，没有重跑 `255f0a317240975bdc34226ea40bf2421e5ece30`，没有手动触发 CI。

compare-spec-bytes: PRD.md 36 parts match f8d5d01dc8af81b73689c7229c983192551fa6fe (195441 bytes)
compare-spec-bytes: ARCHITECTURE.md 66 parts match f8d5d01dc8af81b73689c7229c983192551fa6fe (369230 bytes)
compare-spec-bytes: RULES.md span matches f8d5d01dc8af81b73689c7229c983192551fa6fe (2795 bytes)
compare-spec-bytes: 68 path prefixes

退出码: 0

check-docs: strict
links: 0
anchors: 0
status: 0
verbatim: 0
tree: 0
findings: 0

退出码: 0

`git diff --check` 退出码: 0

approvals 表内 119 行：111 条批准、1 条反馈、4 条决定、3 条合入同步。

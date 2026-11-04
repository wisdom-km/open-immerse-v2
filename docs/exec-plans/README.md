# 执行计划

本目录放执行计划。超过 300 行，或跨模块，先复制 [TEMPLATE.md](TEMPLATE.md)，再写实现。门槛在 [RULES.md](../../RULES.md) §2（[2. 分支、提交与 PR](../../RULES.md#2-分支提交与-pr)），这里不另立标准。跨模块指改动落到多于一个切片，或同时落到 TS 与 worker（[ARCHITECTURE.md](../../ARCHITECTURE.md) §4.2）。

文件名是 `<分支名>.md`，与分支同名，放在本目录。不设 `active/` 与 `completed/`。已有计划留在原地。

计划必须自包含。接手的人只读这一份文件就能继续，不依赖聊天记录。引用规格时写节号，并链接到那一节。

决策记录（Decision Log）只记会影响后续的决定。Wisdom 的决定写原话，并链到 [docs/approvals.md](../approvals.md) 里对应的行。Forge 的排序标「Forge 排序，非业主决定」。

计划里引用的 Wisdom 批准，必须在 [docs/approvals.md](../approvals.md) 有对应的行。没有记在那里的，不算已批准。

Cloud 交接附上该计划文件的路径。

小任务不用本目录。在 PR 描述写三行现状理解（RULES §2）。

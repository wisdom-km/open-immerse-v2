# 参与开发

规格仍是唯一真相源。开工前按 [AGENTS.md](AGENTS.md) 的顺序读 [PRD.md](PRD.md)、[ARCHITECTURE.md](ARCHITECTURE.md)、[RULES.md](RULES.md)。本文不另写产品规则。

## 分支与提交

- 分支：`feature/<简短描述>`、`fix/<简短描述>`、`chore/<简短描述>`。小写、连字符。
- 提交信息用 Conventional Commits，描述可以用中文。
- 一个 PR 只动一个切片。契约改动单独成 PR，先合入。

## Pull Request

- 先开 Draft。自检完成后再转为 Ready。
- 描述使用仓库里的 PR 模板（对应 RULES §2 的五项和 §8.4 交接说明）。
- 任务类型为「UI 改动」时，不修改 core 目录（RULES N-16、N-21）。
- 不自行合入，除非维护者明确要求。已推送的共享分支不 force push。

## 不要做的事

禁止事项的完整列表在 RULES §6。特别是：不把密钥写进仓库，不引入 GPL / AGPL（含 PyMuPDF），不改 `DESIGN.md` 正文，不扩大到 PRD §3.2 以外的能力，不在 M1 门禁落地前新建业务切片目录。

三种版本号见 README「三种版本号」。已有决定的索引在 [docs/adr/README.md](docs/adr/README.md)。事故复盘用 [docs/incidents/TEMPLATE.md](docs/incidents/TEMPLATE.md)。

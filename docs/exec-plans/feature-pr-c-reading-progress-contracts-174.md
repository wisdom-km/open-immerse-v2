# 执行计划

本文件只记录已经批准的第二份契约。实现依据是修订方案 §8，以及 Wisdom 2026-11-09 02:37 的编码批准，见 [docs/approvals.md](../approvals.md) 该行。§8 的技术审查 PASS 只覆盖那份设计原文，不覆盖本文件之后才出现的提交。02:37 原话要求范围内连续修错、测试、审查，所以第一笔提交之后没有再停下来等一轮计划审查。

## 现状理解

- 现在已有的行为：文献库四条命令已暴露。`progress_page` 在库里，不在 `LibraryEntry`。`openDocument` 与 `setZoom` 的 `expose` 为 false。生产命令表只有那四条文献库命令。
- 相关的节：[docs/arch/02-05.md](../arch/02-05.md) 页码段，[docs/arch/09.md](../arch/09.md) 生命周期，[docs/arch/09-01.md](../arch/09-01.md) 页码句。
- 还没做的部分：四条契约的形状。不实现代际表、handler、存储、协议或 UI。

## 计划 / 实际

| 步骤 | 计划 | 实际 | 证据 |
| --- | --- | --- | --- |
| 1 | 规格只写四条内部契约的方向 | 随本 PR | `docs/evidence/181/commands.md` |
| 2 | 契约、错误码、测试、codegen | 随本 PR | 同上 |
| 3 | 公开面回归不读 `src/` 文本。断言 registry 通道、`createOi` 的键，以及 `Window["oi"]` 与 preload 返回类型的键 | F-08 修正 | `docs/evidence/181/commands.md` |

## 决策记录（Decision Log）

| 决定 | 理由 | 日期（Asia/Shanghai） | 谁定的 |
| --- | --- | --- | --- |
| 批准第二份阅读登记与页码契约编码。四条 `expose` 为 false。bind 拒绝只回显 id。其余拒绝回显请求的 id 与 generation。generation 与非空页码限安全正整数。写页不接受 null，读页允许 null。不含 storage、密钥、handler、core、协议、UI、getZoom，不改 `openDocument` / `setZoom`。只开 Draft | 原话见 approvals 该行 | 2026-11-09 02:37 | Wisdom |
| 公开面回归改断言导出与类型。不读生成源码。不改 `parse-capability-surface.test.ts` | RULES 禁止测试读取源码文本做断言。该文件是 #180 已合入的同类写法，本修正不扩成全仓整改 | 2026-11-09 | 本 PR 的修错 |

## 证据链接

- `docs/evidence/181/`：命令记录。Draft PR #181。

## 自检

- [x] 影响 arch / prd 吗？影响就在同一个 PR 里更新。

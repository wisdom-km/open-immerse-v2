# 0005 G9 合成前缀夹具暂不隔离

状态：采纳。日期：2026-11-08（Asia/Shanghai）。决定人：Wisdom。

本页只登记一条有界例外。不改 [RULES.md](../../RULES.md) §4 的通用不稳定测试规则，不改 PRD、ARCHITECTURE、DESIGN 正文，也不改测试、门禁或 CI。批准原文在 [approvals.md](../approvals.md) 2026-11-08 19:09 那一行。来源：[Issue #174 评论 6720737180](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6720737180)。

## 背景

`d6e711d5de31426880f1f94ee747552ad1be4ac6` 的唯一全量 `pnpm test` 是 632 通过 / 1 失败 / 0 跳过，退出码 1。失败用例是 `allows a synthetic key that uses the oitest_ prefix (G9)`。Vitest 报 `Test timed out in 5000ms`，该用例记 14085ms，没有断言差值。同一次全量里，同文件其余 8 条合计 875ms。

同一提交上只重跑这一条：1 通过，整轮 688ms。`main` `208056585d0891ad7ab2c1309527074b34a1c0a1` 与该 tip 各跑一次这一条，分别 749ms、752ms，都通过。`tools/check-secrets/leak.test.ts` 在这两个 ref 上的 blob 都是 `c7910558c1bd9a53ece43b6dafa51569bf1580ea`。根因未知。这几次通过不把 632/1/0 改写成稳定或已修复。

`ef5d14b6aacafb9414a75aa9878b790adf73f690` 只加了分步计时，没有改扫描、断言或 5000ms。它的 CI [run 42473475343](https://github.com/wisdom-km/open-immerse-v2/actions/runs/42473475343) attempt 1 六个 job 都成功。`node` 是 150 个文件，633 通过 / 0 失败 / 0 跳过。`desktop-e2e-windows` 是 64 个单测通过、27 个 Electron 通过。这是计时加入之后的一次正常路径，不代替 `d6e711d` 的失败记录，也不代替 PR-C 的真机。

RULES §4 写明：同一份代码上连续两次结果不同，即开 issue、标 `quarantine` 移出门禁，并写修复所有者；不得删测试或放宽断言。N-08 禁止绕过门禁，除非有用户批准的 ADR。本页就是这一条用例的那个 ADR。

## 选项

1. 现在就按 §4 把这一条移出门禁。
2. 放宽 5000ms、删掉这一条，或靠重跑把 632/1/0 写成通过。
3. 保留这一条在门禁里，暂不隔离，直到 PR-C 合入前再复核。

## 决定

取第 3 条。只覆盖这一个用例名：`allows a synthetic key that uses the oitest_ prefix (G9)`。

- 全部测试和门禁保留。G9 的真实仓库扫描、三条 detect、默认 5000ms、退出码与 remediation 断言、并发、CI 必需检查都不改。
- 不把其他不稳定用例算进这条例外。
- 不新开 issue。跟踪仍用 #174。Forge 跟进，Anvil 验证。
- 有效到 PR-C 合入之前。届时要明确复核：修好、改成已批准的等价隔离，或重新批准。不自动续期。
- 这一条再次失败就暂停放行。保留原来的失败和复验记录，不以重跑洗绿。
- 本决定不是修复，不是稳定结论，也不是 Ready、合入或发版批准。

`ef5d14b` 的计时有一个已定、不阻塞的低风险点：`flush` 时 `stderr` 同步写失败会盖住原来的异常，也可能再写一次。`finally` 里的 `rmSync` 抛错同样会盖住断言错误。两处都没有改。它们不是这次超时的根因。

## 后果

- 门禁仍跑这一条。通过不证明根因已找到。
- §4 对其余用例仍然有效。要给别的用例同样的暂缓，需要另一次批准。
- PR-C 合入前没有新的批准或等价方案时，本页到期，不自行延长。

## 状态

采纳。被取代时改本页状态并指向新页，不在正文里追加「后来改为」。

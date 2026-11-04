# 执行计划

修 [Issue #128](https://github.com/wisdom-km/open-immerse-v2/issues/128)。基线是 `origin/main` 的 `dd0630bd19f5aa1e26c068ab846e72f309edb7b2`（#125）。路径按分支名 `feature/fix-compare-spec-baseline`。第一笔提交只有本文件。

本任务不跨切片，也不改 worker。预计改动远小于 300 行。交接仍要求第一笔只放这份计划，然后在同一条 Draft PR 里修。不等另一次 Forge 审查才写实现：Issue #128 已记下 Wisdom 2026-11-04 12:33 的「批准开修」。PR 保持 Draft，不离开 Draft，不合入，不 force push（N-01、N-03）。不改 `.github/`（N-02）。

`docs/approvals.md` 不在这条 `main` 上（它在未合入的 #127）。本计划不链过去，也不改 #127 的文件。批准原文在 Issue #128。

## 现状理解

- 已有行为：`tools/compare-spec-bytes/compare.mjs` 的 `--base` 默认是 `origin/main`。它用 `git show <base>:<file>` 读拆分前的 `PRD.md`、`ARCHITECTURE.md`，并用 `manifest.json` 里的 span 起止从 `<base>:RULES.md` 切出 changelog 那一段。span 起点对不上时，`sliceOnce` 抛出 `span start missing`。`compare.test.ts` 第 35 行的 `git show origin/main:` 只在标题 slug 那条测试的脚本里，不在两条失败的测试里。那两条直接跑 `compare.mjs`，不传 `--base`。
- 相关的节：Issue #128；#125（Fixes #27）把规格按章节拆开，默认基线因此从「拆分前的 main」变成「拆分后的 main」。RULES §2、§4、§6（N-02、N-06、N-08）、§9。ARCHITECTURE §6（一个文件一件事，源文件硬上限 600 行，函数 80 行）。不改规格正文。
- 还没做的部分：把字节对比基线钉在拆分前的固定 commit，浅克隆缺这个对象时由测试自己 `git fetch`。标题 slug 测试继续对 `origin/main`。

## 不改的文件

不改 `.github/workflows/**`，不改 RULES，不删测试。不碰 #126、#127 的路径，包括 `docs/exec-plans/README.md`、`docs/exec-plans/TEMPLATE.md`、`docs/approvals.md`、`RULES.md`、`AGENTS.md`、`docs/spec-changelog.md`、`packages/features/jobs/**`、`tools/check-deps/real-tree*`、`tools/check-file-size/allowlist.json`。

不改 `DESIGN.md`、`docs/design-principles.md`、`docs/design/**`（N-10）。不改 `.cursor/environment.json`、`.cursor/install.sh`（N-11）。不改 `package.json`、`pnpm-lock.yaml`。

实现提交只改 `tools/compare-spec-bytes/**`。证据只加 `docs/evidence/<PR号>/commands.md`。本文件在第一笔之后不再改；「实际」列不回填，结果写在证据里。

## 来源核对

本环境没有 `/workspace/oi-qa/v2-pr127-6b4da53/ANVIL.md`，也没有 `/workspace/oi-v2/pr127-review/REVIEW.md`。下面用仓库和 GitHub 上对得上的记录核对交接里的四行。

| 来源 | 核对结果 |
| --- | --- |
| Issue #128 正文 | 对得上。现象是 `main@dd0630b` 起两条测试失败。范围是只改 `tools/compare-spec-bytes/**`，基线用 `be998cc` 或等价的拆分前固定 commit，不改 CI、不改规则、不删其余测试。批准记录是 2026-11-04 12:33（UTC+8），Wisdom 原话「批准开修」，来源写的是 Forge 私聊。 |
| ANVIL.md 第二节第 35 行 | 文件不在本机。当前 `compare.test.ts` 第 35 行确是 `git show origin/main:`，但它在 slug 脚本里。CI run `41772630781`（#127 的 `6b4da53`，与路径里的 sha 相同）里，`keeps root heading slugs identical to origin/main` 是通过的。失败的是另外两条，退出码 1。在 `dd0630b` 上直接跑 `node tools/compare-spec-bytes/compare.mjs`，stderr 是 `compare-spec-bytes: span start missing`，退出码 1。所以第 35 行不是抛错的那一行；抛错的是默认 `--base origin/main` 之后的 span 切片。 |
| REVIEW.md 的 CI 节 | 文件不在本机。同一条 CI：`matches origin/main when the chapter files are joined` 与 `writes the same prefix manifest that evidence keeps` 失败；13 条里 2 失败。断言只打印了 `status: 1`，stderr 被 vitest 省略。工具自己的 stderr 是 `span start missing`。 |
| PR #125 / #27 | #125 合入 `dd0630bd`，Fixes #27，引入 `tools/compare-spec-bytes/`。`dd0630bd` 的父提交是 `f8d5d01dc8af81b73689c7229c983192551fa6fe`（#124），不是 `be998cc`。`be998cc250e95a3f54c802cab5ea7900ea6aee69` 是 `f8d5d01` 的父提交（#122）。`git diff be998cc f8d5d01 -- PRD.md ARCHITECTURE.md RULES.md` 为空。两条 `--base` 都退出码 0，stdout 除 commit 外相同：PRD 36 段 194695 字节，ARCHITECTURE 66 段 360198 字节，RULES span 2795 字节，68 条路径前缀。两份 `--rewrites` 都与 `docs/evidence/125/link-rewrites.txt` 一致。 |

## 基线选哪一笔

选 `f8d5d01dc8af81b73689c7229c983192551fa6fe`。

它是被拆开的那一棵树（#125 的父提交）。`be998cc` 今天对这三份规格字节相同，所以也能让对比通过，但它不是 #125 的父提交。Issue 写的「`be998cc`（#125 的拆分前父提交）」把父提交认早了一笔。Issue 同时允许「等价的拆分前固定 commit」，`f8d5d01` 就是这一笔。

注释里同时写明两笔：常量是 `f8d5d01`；`be998cc` 是它的父提交，三份规格字节相同，Issue #128 在那一笔记过 13/13。不把 `be998cc` 写成 #125 的父提交。

不改第 35 行。slug 测试比的是根索引和当前 `origin/main` 的标题。拆分前的全文标题和索引不一样，把那一行改成旧 commit 会让现在通过的测试失败。

## 实现

常量放在 `compare.mjs`，导出，作为 `--base` 的默认值。`compare.d.mts` 补上这个导出的类型。两条会启动 `compare.mjs` 的测试在启动前调用 `ensureSplitBaseline`：`git cat-file -e <sha>^{commit}` 已有则返回；没有则 `git fetch --depth=1 origin <sha>`。失败时抛出的句子只含 sha，不附 git 的 stderr（远端 URL 可能带令牌，N-05）。不改 `.github/`。当前 `node` job 的 checkout 已是 `fetch-depth: 0`，这条 fetch 是浅克隆的备用。

`match origin/main` 的断言改成 `match` 加这枚 sha。测试名字不改。其余 11 条不改断言。

`compare.mjs` 现在 547 行，硬上限 600。只加常量、注释和默认值，不把 fetch 写进这个文件。

## 计划 / 实际

计划列在开工前填。实际列不回填本文件，写在 `docs/evidence/<PR号>/commands.md`。

| 步骤 | 计划 | 实际 | 证据 |
| --- | --- | --- | --- |
| 1 | 只提交本文件 |  | 本文件 |
| 2 | `compare.mjs` 默认基线改为 `f8d5d01`；测试在缺对象时 fetch；断言跟着改 |  | `docs/evidence/<PR号>/commands.md` |
| 3 | `vitest run tools/compare-spec-bytes/compare.test.ts`，然后一次 `GATE_BASE=origin/main corepack pnpm run check` |  | 同上 |

不跑全量 `pnpm test`。`test:core` 不适用（`package.json` 没有这个脚本）。不跑 worker pytest。

## 决策记录（Decision Log）

| 决定 | 理由 | 日期（Asia/Shanghai） | 谁定的 |
| --- | --- | --- | --- |
| 开一条并行分支，只修 compare-spec-bytes 的测试基线，不碰 CI | Issue #128 记录 Wisdom 原话「批准开修」。范围写明不改 CI 配置 | 2026-11-04 12:33 | Wisdom |
| 字节对比基线钉 `f8d5d01`，不钉 `be998cc`，也不再默认 `origin/main` | `f8d5d01` 是 `dd0630b` 的父提交。`be998cc` 是再上一笔，三份规格字节相同，两条 `--base` 都退出码 0。钉被拆开的那一笔，注释里说明 `be998cc` 的来历 | 2026-11-04 | 本计划（核实 Issue #128 与 git；不是另一次业主决定） |
| 不改 `compare.test.ts` 第 35 行的 `origin/main` | 那一行服务 slug 测试，CI 上已经通过。失败栈在 `compare.mjs` 的默认 `--base` | 2026-11-04 | 本计划 |
| 缺 commit 时在测试里 `git fetch`，不改 `.github/` | 交接要求浅克隆也能取到该 sha，且不改 CI。`node` job 现为 `fetch-depth: 0`，fetch 只在对象缺失时跑 | 2026-11-04 | 交接；与 Wisdom「不碰 CI」一致 |
| 第一笔之后同一 PR 里写实现，不等另一次审查 | 交接写明计划提交之后就修，并开 Draft。批准已经在 Issue #128 | 2026-11-04 | 交接（Wisdom 已批准开修） |

## 证据链接

- `docs/evidence/<PR号>/commands.md`：实现提交之后写入。PR 号以开出的 Draft 为准。

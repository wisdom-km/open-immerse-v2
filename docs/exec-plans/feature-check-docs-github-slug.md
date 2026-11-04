# 执行计划

收 [Issue #130](https://github.com/wisdom-km/open-immerse-v2/issues/130)。基线是 `origin/main` 的 `d2dfcb5229c08db567a32cb833bdde4c5f151d1e`。路径按分支名 `feature/check-docs-github-slug`。第一笔提交只有本文件。

本任务不跨切片，也不改 worker。预计改动远小于 300 行。[docs/exec-plans/README.md](README.md) 写小任务不用本目录。交接仍要求第一笔只放这份计划，然后在同一条 Draft PR 里修。不等另一次 Forge 审查才写实现：Issue #130 正文已经记下 Wisdom 2026-11-04 13:16 的原话。PR 保持 Draft，不离开 Draft，不合入，不 force push（N-01、N-03）。不改 `.github/`（N-02）。

## 现状理解

- 已有行为：`tools/check-docs/slug.mjs` 的 `slugify` 用模块常量 `punct` 删掉一份 ASCII 与中文标点，再把连续空白收成一个 `-`。`headingSlugs` 对同名标题从第二个起加 `-1`、`-2`。在 `d2dfcb5` 上 `node tools/check-docs/check.mjs` 打印 `links: 0`、`anchors: 5`、`status: 9`、`verbatim: 0`、`findings: 14`。这 5 条缺锚点就是 `tools/compare-spec-bytes/compare.test.ts` 里 `githubIds` 的那 5 个目标。链接文字已经写成 GitHub 的 id，检查器自己的 slug 对不上。
- 相关的节：Issue #130；Issue #28（check-docs 先报告，转必需由 Wisdom 以后在 GitHub 设置里做）；PR #125 引入这 5 个例外；PR #129 只给字节对比加了 `ensureSplitBaseline`，根标题 slug 测试仍是 `git show origin/main:`（`compare.test.ts` 第 61 行）。旧规则写在 [feature-m1-check-docs.md](feature-m1-check-docs.md)「链接与锚点」。RULES §2、§4、§6（N-02、N-05、N-06、N-08）、§9。ARCHITECTURE §6（一个文件一件事；`.mjs` 不进 `check-file-size` 的源文件口径，函数仍按 80 行）。不改规格正文。
- 还没做的部分：把 `slugify` 改成交接写的 GitHub 规则并删掉 `punct`；`links.test.ts` 补 ↔、【】、§、相邻空格、中文标题；删掉 `githubIds`，断言 `anchors 0`；根标题测试在没有 `refs/remotes/origin/main` 时先按交接的 refspec 浅拉取。

## 不改的文件

不改 `.github/workflows/**`，不改 RULES，不改分支保护，不删测试。不改 `package.json`、`pnpm-lock.yaml`（不引入 `github-slugger` 包）。不改 `docs/approvals.md`：13:16 那句不在该文件里，补行不在本次允许的路径中。不改 `docs/spec-changelog.md`（不改规格正文）。

不改 `DESIGN.md`、`docs/design-principles.md`、`docs/design/**`（N-10）。不改 `.cursor/environment.json`、`.cursor/install.sh`（N-11）。

实现只改 `tools/check-docs/slug.mjs`、`tools/check-docs/links.test.ts`、`tools/compare-spec-bytes/compare.test.ts`。可选在 `docs/exec-plans/feature-m1-check-docs.md` 的旧 slug 段落后补一句，指向本文件，不改写那一节的基线数字。证据只加 `docs/evidence/<PR号>/commands.md`。本文件在第一笔之后不再改；「实际」列不回填，结果写在证据里。

## 来源核对

| 来源 | 核对结果 |
| --- | --- |
| Issue #130 正文 | 对得上。A 是 `slugify` 改为交接写的顺序与字符类，删 `punct`，重复标题的 `-1`/`-2` 保持。B 是根标题测试在缺 `origin/main` 时先 `git fetch --depth=1 origin main:refs/remotes/origin/main`。批准记录在正文，不在评论：`gh api repos/wisdom-km/open-immerse-v2/issues/130/comments` 的长度是 0。时间 2026-11-04 13:16（UTC+8），Wisdom 原话「你就按照顺序先开吧，然后能并行的就并行开。」范围写明按 Forge 13:14 的遗留项顺序开，第一项是锚点规则；B 与 A 改同一文件，合成一个分支。 |
| Issue #28 | 对得上。标题与正文要求 check-docs 初期只报告不阻断，约两周后再由 Wisdom 把检查改成必需。本 PR 不改 CI，不改分支保护，不把 `findings` 非 0 变成退出码 1。 |
| PR #125 / `compare.test.ts` 的 `githubIds` | 对得上。当前集合就是这 5 条：`docs/arch/09.md`、`docs/arch/09-01.md`、`docs/arch/14-01.md`、`docs/prd/03-03.md`、`docs/prd/03-06.md`，锚点字符串与 `check.mjs` 现在报的 5 条 `missing-anchor` 相同。GitHub contents HTML（`Accept: application/vnd.github.html`）里对应的 `user-content-` id 与这 5 个锚点一致，见下面「对照」。 |
| PR #129 正文与 `ensureSplitBaseline` | 对得上。#129 把字节对比的默认基线钉在 `f8d5d01`，`ensureSplitBaseline` 只在两条会启动 `compare.mjs` 的测试里调用。PR 正文写明 `compare.test.ts` 里的 `git show origin/main:` 仍只服务标题 slug 测试，留作后续。该函数在第 41 行，slug 脚本的 `git show` 在第 61 行，`keeps root heading slugs identical to origin/main` 在第 203 行，没有调用 fetch。 |
| `docs/exec-plans/feature-m1-check-docs.md` | 对得上。「链接与锚点」仍写：删固定标点表，连续空白收成一个 `-`，同名标题从第二个起加 `-1`、`-2`。那是当时的规则。本 PR 不改写那一段的数字；实现时在段落后补一句，指向本文件。 |

`docs/approvals.md` 截至 `d2dfcb5` 没有 13:16 这一行。最近一行是 2026-11-04 11:41。按 [README.md](README.md)，没记在 `docs/approvals.md` 的不算已批准；交接同时写明批准可以记在 `docs/approvals.md` 或 #130 评论。两处都没有这条原话，记录在 Issue #130 正文。本计划照正文引用，不把正文说成评论，也不在本 PR 补 `docs/approvals.md`。

## 对照

下面两个 id 是仓库里已经渲染的页面，不是夹具推出来的。抓取日期 2026-11-04。

- `docs/arch/09.md`：`id="user-content-9-ipc-协议renderer--main"`。标题含 `↔`，符号去掉后两侧空格各变成一个 `-`，所以出现 `--`。
- `docs/prd/01.md`：`id="user-content-1-一句话"`。中文保留。

同一套抓取里，另外三页的 id 是 `91-v2-桌面端-ui-新增-seam已采纳adr-0001wisdom-2026-11-04`（【】去掉）、`141-发生了什么数据来自旧仓库只读审查见-v1-审查-3`（`§` 去掉）、`33-设置模型能力的本地--api与面壁开放平台q9wisdom-2026-10-30-18371844`（`/` 去掉后留下 `--`）。`links.test.ts` 的期望值用这些字符串。

在 `d2dfcb5` 上用交接的顺序对这 6 个标题试算，输出与上面的 id 一致。`github-slugger@2.0.0` 的发布包用生成的码点表，且 `slug()` 不 trim。本 PR 不装这个包，按交接写 Unicode 属性类，并在 `plainHeading` 之后 trim。ATX 标题在 `headingText` 里已经 trim，五个已渲染 id 不受这个差别影响。

## 实现

`slugify`：`plainHeading` → `trim` → `toLowerCase` → 删除 `/[^\p{L}\p{M}\p{N}\p{Pc} -]/gu` → 每个 U+0020 单独换成 `-`，不合并。删除 `punct`。`headingSlugs` 的 `-1`/`-2` 计数不改。

`links.test.ts` 直接断言 `slugify` / `headingSlugs` 的返回值。用例仍用英文的「结果 when 条件」，与该文件现有 4 条一致。覆盖 ↔、【】、§、相邻空格得到 `--`、中文标题，以及重复标题仍是无后缀然后 `-1`。

`compare.test.ts` 删掉 `githubIds` 与「只允许这 5 条」的过滤。缺文件、缺锚点、`docs/prd/` 缺状态行都要求为 0。stdout 仍打印 `anchors ` 加条数，断言改为 `anchors 0`。其余测试不删、不改断言。

根标题测试在启动 `slugScript` 之前调用新的 `ensureOriginMain`：`git rev-parse --verify --quiet refs/remotes/origin/main` 已有则返回；没有则 `git fetch --depth=1 origin main:refs/remotes/origin/main`。`stdio` 设为 `ignore`。失败时抛出的句子只写 `origin/main`，不附 git 的 stderr（远端 URL 可能带令牌，N-05）。`slugScript` 里的 `git show origin/main:` 保持不变。不改 `.github/`。

## 计划 / 实际

计划列在开工前填。实际列不回填本文件，写在 `docs/evidence/<PR号>/commands.md`。

| 步骤 | 计划 | 实际 | 证据 |
| --- | --- | --- | --- |
| 1 | 只提交本文件 |  | 本文件 |
| 2 | 改 `slug.mjs`、`links.test.ts`、`compare.test.ts`；旧计划补一句 |  | `docs/evidence/<PR号>/commands.md` |
| 3 | `vitest run tools/check-docs/links.test.ts`；`vitest run tools/compare-spec-bytes/compare.test.ts`；`node tools/check-docs/check.mjs`；浅克隆缺 `origin/main` 时再跑根标题那一条；然后一次 `GATE_BASE=origin/main corepack pnpm run check` |  | 同上 |

不跑全量 `pnpm test`。`test:core` 不适用（`package.json` 没有这个脚本）。不跑 worker pytest。

## 决策记录（Decision Log）

| 决定 | 理由 | 日期（Asia/Shanghai） | 谁定的 |
| --- | --- | --- | --- |
| 先开 check-docs 锚点规则；浅克隆兜底与它合在同一分支 | Issue #130 正文记录 Wisdom 原话「你就按照顺序先开吧，然后能并行的就并行开。」第一项是锚点规则。B 与 A 都要改 `compare.test.ts`，合成一个分支。该原话不在 `docs/approvals.md`，#130 评论数为 0 | 2026-11-04 13:16 | Wisdom（记录在 Issue #130 正文，不是 `docs/approvals.md` 的一行） |
| 本 PR 不把 check-docs 改成必需检查，不改 `.github/` | Issue #28 写明先报告，转必需由 Wisdom 在 GitHub 设置里做。Issue #130 范围同样写了不改 CI、不改分支保护 | 2026-11-04 | Issue #28 与 #130 的范围；不是本计划新做的业主决定 |
| `slugify` 用交接的 Unicode 字符类和 trim，不添加 `github-slugger` 依赖；`-1`/`-2` 保持 `headingSlugs` 现有计数 | 交接 A。五个已渲染 id 与这套规则一致。`github-slugger@2.0.0` 的码点表与「不 trim」不照搬 | 2026-11-04 | 交接（实现选择，不是另一次业主决定） |
| 缺 `refs/remotes/origin/main` 时按交接的 refspec fetch，失败句不附 stderr | 交接 B，仿 #129 的 `ensureSplitBaseline`。N-05 | 2026-11-04 | 交接 |
| 第一笔之后同一 PR 里写实现，不等另一次审查 | 交接写明计划提交之后就修，并开 Draft。模板里「审查通过之前不写实现」与这次交接冲突，以交接为准 | 2026-11-04 | 交接 |

## 证据链接

- `docs/evidence/<PR号>/commands.md`：实现提交之后写入。PR 号以开出的 Draft 为准。上面两个 `user-content-` id 也写进该文件。

# 执行计划

收 [Issue #28](https://github.com/wisdom-km/open-immerse-v2/issues/28)。基线 `origin/main@25762f11142b4f1eef9cf7f6ef08ad178679894c`。路径按 [TEMPLATE.md](TEMPLATE.md) 用分支名 `feature/m1-check-docs`。第一笔提交只有本文件。Forge 审查通过之前不写实现。PR 保持 Draft，正文用 `Refs #28`。不离开 Draft，不合入，不 force push（N-01、N-03）。不改分支保护（N-02）。

Wisdom 2026-11-04 03:08 原文：「嗯，这个我批准了。」批准的是给 #28 加一条只报告、不阻断的 CI 检查。转成必需检查仍由 Wisdom 以后在 GitHub 设置里做，不在本 PR。

## 现状理解

- 已有行为：`.github/workflows/ci.yml` 有 `node`、`python-worker`、`worker-health`（Windows / macOS）、`desktop-e2e-windows`。`pnpm check` 不查文档链接。仓库里没有 `tools/check-docs`。`docs/README.md` 只有三行，指向 `architecture-redesign.md`，没有 Issue #25 要的「路径 / 状态 / 维护人」表。Issue #26、#27 的逐字搬运还没有落地，没有可对拍的拆分文件。
- 相关的节：Issue #28（链接/锚点、docs 状态行与索引、拆分后的逐字一致；先 report-only）。Issue #25（索引与状态行，M2，验收写明纳入 check-docs）。Issue #26、#27（逐字搬运，本 PR 不拆规格）。RULES §2、§4、§6 N-02、§7、§9。ARCHITECTURE §6（文件只做一件事、函数 80 行）、§13（G1–G18 是会失败的门禁；本检查不进这张表）。`docs/ci-and-environment.md`「门禁」「GitHub Actions」。DESIGN 与 `docs/design-principles.md` 只作阅读，不改（N-10）。
- 还没做的部分：检查器、夹具测试、CI 里的 report-only 步骤。下面这套规则在基线上的第一次统计已经做完，实现还没有写。

## 不改的文件

并行的文档 PR（`feature/docs-m1-followups-2`）在改 `docs/spec-changelog.md`、`docs/backlog.md`、`docs/ci-and-environment.md`、`ARCHITECTURE.md`。那支合入之前，本分支不碰这四个文件。合入之后用 merge 同步 `main`，不 force push。#35 那支在改 `tools/check-secrets/leak.test.ts`，本 PR 不碰。

不改 `DESIGN.md`、`docs/design-principles.md`、`docs/design/**`（N-10）。不改 `.cursor/environment.json`、`.cursor/install.sh`（N-11）。不改 `package.json`、`pnpm-lock.yaml`（热点；检查器只用 Node 内置模块，CI 直接 `node tools/check-docs/check.mjs`）。不把本检查写进 `pnpm check` 或 `tools/gate-remediation/catalog.json`。不新增 G 编号。

`docs/ci-and-environment.md` 要补的一句（`docs-report` 只报告、不是必需检查）等文档 PR 合入、本分支 merge `main` 之后再写。规格正文这次不改的话，`docs/spec-changelog.md` 不加行。

## 检查什么

三条都只读仓库。发现写到 stdout。进程退出码是 0。不访问网络。

### 链接与锚点

范围：`git ls-files -- '*.md'` 的 76 个文件。先去掉围栏代码块和行内代码，再取 `](…)` 里的目标（含图片）。

- `http:`、`https:`、`mailto:` 跳过，不算发现。基线上跳过 168 个。
- `#锚点` 对当前文件的标题。相对路径从该文件所在目录解析，必须是文件。目标以 `.md` 结尾又带 `#` 时，锚点对目标文件的标题。
- 标题只认围栏外的 ATX（`#` 到 `######`）。先把链接收成链接文字、去掉强调标记和行内代码，再转小写，删掉 ASCII 标点 `` !"#$%&'()*+,./:;<=>?@[\]^`{|}~ `` 以及 `。，「」『』（）：、；？！·…—–‐‑‒―〜～･`，连续空白收成一个 `-`。同名标题从第二个起加 `-1`、`-2`。这套规则对得上基线上现有的 14 个带锚点链接，包括 `ARCHITECTURE.md` 的 `#70-…`、`#74-…`、`#712-…`、`#713-…`、`#76-…`、`#14-…`。2026-11-04 起 `slugify` 改为 GitHub 规则（trim、转小写、删除字母/标记/数字/连接符/空格/连字符以外的字符、每个空格单独变成 `-`），见 [feature-check-docs-github-slug.md](feature-check-docs-github-slug.md)。上面这一段的基线数字不改写。

基线上：仓库内链接 272 个都对得上，缺文件 0，缺锚点 0。

### 状态行与索引

范围：`docs/**/*.md`，去掉 `docs/evidence/**`（那是 PR 命令记录，不是 #25 的目录）。基线上 31 个文件。Forge 审查之后，实现再去掉 `docs/exec-plans/**`。下面的 18 与合计 19 是审查前在 `25762f1` 上的统计，不改写。

文件自己的状态行：前 40 行里，第一行符合 `^(?:>\s*)?状态：` 或 `^日期：.+。状态：`。

索引：`docs/README.md` 里要有一张表，表头同时含 `路径` 和 `状态`。现在这份 README 没有这张表。

- 表不在：一条 `index-table-missing`（`docs/README.md`）。不要再给每个文件发 `not-in-index`，否则同一件事计 31 次。
- 范围内没有自己的状态行：每条 `status-line-missing`。基线上 18 个，列在下面。
- 表出现之后（本基线还没有，用夹具测）：除 README 以外每个范围内文件要有一行；`状态` 格只能是 `现行`、`报告`、`历史草案`、`生成` 之一，并且这个词要出现在该文件自己的状态行里。缺行、词不对、状态行里没有这个词，各算一条。本基线上这条分支的发现数是 0。

不把「状态行必须已经写成那四个词」加到没有索引行的文件上。`docs/backlog.md` 的 `状态：v0.6` 现在不是发现。

18 个没有状态行的文件：

1. `docs/README.md`
2. `docs/WORKFLOW.md`
3. `docs/architecture/inputs/pdf_translation_architecture.md`
4. `docs/ci-and-environment.md`
5. `docs/design/md-reader.md`
6. `docs/exec-plans/TEMPLATE.md`
7. `docs/exec-plans/feature-m1-contracts-codegen-p2.md`
8. `docs/exec-plans/feature-m1-e2e-split-protocol-inline.md`
9. `docs/exec-plans/feature-m1-electron-shell.md`
10. `docs/exec-plans/feature-m1-jev-client.md`
11. `docs/exec-plans/feature-m1-log-guard-fixes.md`
12. `docs/exec-plans/feature-m1-logging-contract.md`
13. `docs/exec-plans/feature-m1-logging-impl.md`
14. `docs/exec-plans/feature-m1-worker-server.md`
15. `docs/gate-remediation.md`
16. `docs/incidents/TEMPLATE.md`
17. `docs/reviews/2026-10-30-architecture-review.md`
18. `docs/spec-changelog.md`

### 逐字一致

只对 `tools/check-docs/verbatim.json` 里写明的成对路径做 UTF-8 字节比较。文件形状是 `{ "pairs": [] }`。一条可以是两个整文件，或用起止标记行收成一段。标记对不上也算一条发现。

本基线 `pairs` 为空。发现数 0。#26、#27 还没把正文搬出去，本 PR 不制造对拍，也不改 PRD / ARCHITECTURE / RULES。

## 第一次报告的发现数

在 `25762f11142b4f1eef9cf7f6ef08ad178679894c` 上按上面的规则统计，还没有把检查器提交进仓库：

| 类 | 数 |
| --- | --- |
| 缺文件 | 0 |
| 缺锚点 | 0 |
| `index-table-missing` | 1 |
| `status-line-missing` | 18 |
| 逐字不一致 | 0 |
| 合计 | **19** |

stdout 摘要固定成这几行，顺序不变，方便以后对：

```text
check-docs: report-only
links: 0
anchors: 0
status: 19
verbatim: 0
findings: 19
```

实现落地后再对当时的 `HEAD` 跑一次。基线若已前移，计划表的「实际」列改记新的数，不改这一节的 19。

## CI

不改现有 job 的名字、`on` 和 `concurrency`。不把步骤塞进 `node`：`CI / node` 是建议中的必需检查，步骤藏进去以后没法单独在设置里开关。新 job 的检查名是 `CI / docs-report`。本 PR 不把它加进分支保护。脚本自己退出 0；job 再加 `continue-on-error: true`，脚本崩溃也不让工作流失败。

对 `.github/workflows/ci.yml` 只在文件末尾追加：

```diff
--- a/.github/workflows/ci.yml
+++ b/.github/workflows/ci.yml
@@ -267,3 +267,19 @@
           name: desktop-e2e-windows-screenshots
           path: apps/desktop/test-results/**/*.png
           if-no-files-found: error
+
+  docs-report:
+    name: docs-report
+    runs-on: ubuntu-latest
+    continue-on-error: true
+    steps:
+      - name: Checkout
+        uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
+
+      - name: Setup Node
+        uses: actions/setup-node@949feb2413d6458794dcd2491c4babbbce0c15c1 # v7.1.0
+        with:
+          node-version-file: .nvmrc
+
+      - name: Docs report
+        run: node tools/check-docs/check.mjs
```

`checkout` 与 `setup-node` 的 SHA 与现有 job 相同。不安装依赖，不跑 `pnpm check`，不跑测试。

合入 `origin/main` 之后，`ci.yml` 末尾在第 281 行。实现按当时的末尾追加，job 正文与上面相同。实际 hunk 是 `@@ -279,3 +279,19 @@ jobs:`。上面那份 diff 的行号是审查前的，不改写。

大约两周无误报之后，另开 PR 再让脚本在 `findings` 非 0 时退出 1，并去掉 `continue-on-error`。那时才由 Wisdom 把 `CI / docs-report` 设为必需。那一笔不在本计划里做。

## 文件

每个文件一件事。函数不超过 80 行，圈复杂度不超过 15。不加依赖。

| 文件 | 做什么 |
| --- | --- |
| `tools/check-docs/check.mjs` | 读三条结果，打摘要，退出 0 |
| `tools/check-docs/slug.mjs` | 标题到锚点 |
| `tools/check-docs/links.mjs` | 链接与锚点 |
| `tools/check-docs/status.mjs` | 状态行与索引表 |
| `tools/check-docs/verbatim.mjs` | 读 `verbatim.json` 并比较字节 |
| `tools/check-docs/verbatim.json` | `{ "pairs": [] }` |
| `tools/check-docs/links.test.ts` | 夹具：缺文件、缺锚点、外链跳过、锚点对得上 |
| `tools/check-docs/status.test.ts` | 夹具：缺表、缺状态行、状态词对不上、对得上 |
| `tools/check-docs/verbatim.test.ts` | 夹具：字节相同、字节不同、标记缺失 |
| `tools/check-docs/cli.test.ts` | 夹具树有发现时进程仍退出 0，摘要含 `findings:` |
| `tools/check-docs/fixtures/**` | 上面这些测试用的小 Markdown 树 |
| `.github/workflows/ci.yml` | 只加上面的 job |

测试只用夹具，不断言当前仓库的 19。不然文档再改一处，`pnpm test` 就会红，report-only 就被测试变成阻断。用例名用「结果 when 条件」。

热点文件：无。不改 `package.json`。

## 实现时要跑的命令

工作目录是仓库根。Node 用 `.nvmrc` 的 22.23.4。

| 命令 | 期望 |
| --- | --- |
| `corepack pnpm exec vitest run tools/check-docs` | 退出码 0 |
| `node tools/check-docs/check.mjs` | 退出码 0，打印 `findings:` |
| `corepack pnpm run check` | 退出码 0。`GATE_BASE` 用 `origin/main` |

`pnpm test` 全量不在本计划里跑第二次。`test:core` 不适用（`package.json` 没有这个脚本）。不改日志。

## 计划 / 实际

计划列在开工前填。实际列在 Forge 通过并实现之后填。

| 步骤 | 计划 | 实际 | 证据 |
| --- | --- | --- | --- |
| 1 | 只提交本文件，开 Draft，把计划发到 PR 评论，停下等 Forge | 计划提交 `e3f6412`。Draft PR #114。评论在该 PR 上。这一笔还不写实现 | `docs/evidence/114/commands.md` |
| 2 | 按「文件」一节实现。CI 用上面的 diff。不碰「不改的文件」 | 检查器在 `tools/check-docs/`。`ci.yml` 只在末尾加 `docs-report`（`@@ -279,3 +279,19 @@ jobs:`）。状态行范围去掉 `docs/exec-plans/**`。未改 #113 的文件 | `docs/evidence/114/commands.md` |
| 3 | 跑「实现时要跑的命令」。摘要里的 `findings` 记进实际列 | `findings: 10`（links 0，anchors 0，status 10，verbatim 0）。定向测试 15 条通过。`pnpm check` 的退出码写在证据里 | 同上 |

## 证据链接

- `docs/evidence/114/commands.md`：审查前的基线发现数 19，以及实现后的实测发现数。

## 给 Forge 的提问

没有需要停下来等决定的规格冲突。有两处希望审查时看一眼，不通过也可以按本文做：

1. 状态行范围去掉了 `docs/evidence/**`。18 条里有 9 个是 `docs/exec-plans/`。若执行计划也不算 #25 的目录，实现时从范围里拿掉，发现数会少于 19。
2. 新 job 叫 `docs-report`，检查名 `CI / docs-report`。没有塞进 `node`。

## Forge 审查

通过，可以开始实现。

1. `docs/exec-plans/**` 不进状态行检查。它是工作草稿，不属于 Issue #25 的目录。
2. job 名 `docs-report`，`continue-on-error: true`，只在文件末尾追加。不进分支保护，不进 `pnpm check`。
3. 单元测试用夹具覆盖缺文件、缺锚点、缺状态行。外链不访问。
4. 不改 #113 的 `ARCHITECTURE.md`、`docs/backlog.md`、`docs/ci-and-environment.md`、`docs/spec-changelog.md`、`docs/evidence/105`。

实测发现数是 10。上面「第一次报告的发现数」仍是审查前的基线，不改成 10。

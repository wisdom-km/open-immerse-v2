# PR #125 命令

日期：2026-11-04（Asia/Shanghai）。分支 `feature/m1-split-prd-arch`。工作目录是仓库根。测量基线 `origin/main` `be998cc250e95a3f54c802cab5ea7900ea6aee69`。未改日志。没有改 `.github/workflows/*`、`tools/codegen`、`tools/check-*`、license 工具、`.gitattributes`、`package.json`、lockfile。没有改 DESIGN.md、`docs/design-principles.md`、`docs/design/**`。

Node 放在 PATH 前面的是 `/home/ubuntu/.nvm/versions/node/v22.23.4/bin`，再用 `corepack pnpm`。`node -v` 是 v22.23.4，`corepack pnpm --version` 是 10.34.9。

`test:core`：不适用（`package.json` 没有这个脚本）。没有执行。

## 逐字节比对

在 `032ab1db4520c375fb5ea4f619cd28eae877b76c` 上跑。

```bash
node tools/compare-spec-bytes/compare.mjs
```

退出码 0。

```text
compare-spec-bytes: PRD.md 36 parts match origin/main (194695 bytes)
compare-spec-bytes: ARCHITECTURE.md 66 parts match origin/main (360198 bytes)
```

比对基线是 `git show origin/main:PRD.md` 与 `git show origin/main:ARCHITECTURE.md`。章节文件头从 `<!-- oi-split-header -->` 剥到 `<!-- /oi-split-header -->` 及其后的一个换行。

## 测试

同一提交：

```bash
corepack pnpm exec vitest run tools/compare-spec-bytes/compare.test.ts
```

退出码 0。8 passed。覆盖剥头、拼接、差一个字节、与 `origin/main` 逐字节相同、根索引标题 slug 与原文相同、链接与锚点。

## check-docs

同一提交：

```bash
node tools/check-docs/check.mjs
```

退出码 0。`links: 0`，`anchors: 0`，`status: 10`，`verbatim: 0`，`findings: 10`。十条与基线相同：`index-table-missing` 1 条（`docs/README.md`）和 `status-line-missing` 9 条（`docs/README.md`、`docs/WORKFLOW.md`、`docs/architecture/inputs/pdf_translation_architecture.md`、`docs/ci-and-environment.md`、`docs/design/md-reader.md`、`docs/gate-remediation.md`、`docs/incidents/TEMPLATE.md`、`docs/reviews/2026-10-30-architecture-review.md`、`docs/spec-changelog.md`）。本分支没有多出发现。`docs/evidence/**` 不在状态行范围内。

## 门禁

在 `032ab1db4520c375fb5ea4f619cd28eae877b76c` 上跑。当时还没有本文件。

```bash
GATE_BASE=origin/main corepack pnpm run check
```

退出码 0。`check:format` 打印 `All matched files use Prettier code style!`。`check-file-size: 198 source files within hard limits`。dependency-cruiser：`no dependency violations found (105 modules, 183 dependencies cruised)`。`check-commits` 通过。`check-pr-size: 7110 non-generated lines`（提交说明里有 `G12:`）。codegen 1 个 generator，随后的 `git diff --exit-code` 通过。日志在 `/opt/cursor/artifacts/pnpm-check-125.log`。

写入本文件的提交补上本路径，并改执行计划的实际列。该提交 `4d0ef08bb0b9aa5b4df00f9657564c6fbbcf2e71` 上再跑 `GATE_BASE=origin/main corepack pnpm run check`，退出码 0，`check-pr-size: 7166 non-generated lines`。

## RULES 文首

审查报告第二轮 N7。在 `a82d3a0` 上跑。

```bash
node tools/compare-spec-bytes/compare.mjs
```

退出码 0。除上面两份全文外，还有：

```text
compare-spec-bytes: RULES.md span matches origin/main (2795 bytes)
```

这一段是 `origin/main:RULES.md` 里从「Q1–Q12 已由 Wisdom 于 2026-10-30 全部决定；」到「日期：2026-11-03（Asia/Shanghai）。」。`docs/spec-changelog.md` 在文件头结束标记之后、`<!-- /oi-split-body -->` 之前的字节与它相同。

```bash
corepack pnpm exec vitest run tools/compare-spec-bytes/compare.test.ts
```

退出码 0。11 passed。

```bash
node tools/check-docs/check.mjs
```

退出码 0。`links: 0`，`anchors: 0`，`status: 9`，`verbatim: 0`，`findings: 9`。比上一节少一条：`docs/spec-changelog.md` 前 40 行现在有搬运文件头里的状态行，不再是 `status-line-missing`。其余八条 `status-line-missing` 与一条 `index-table-missing` 还在。没有新的断链。

```bash
GATE_BASE=origin/main corepack pnpm run check
```

在 `a82d3a0` 上退出码 0。`check-pr-size: 7324 non-generated lines`。日志在 `/opt/cursor/artifacts/pnpm-check-125-n7.log`。补记本段的提交 `9c826ee` 上再跑同一门禁，退出码 0，`check-pr-size: 7358 non-generated lines`。

## Forge F1–F3、F5、F8

Wisdom 2026-11-04 11:05 批准。章节正文在 `docs/arch/`。占位页已删。相对链接只改路径前缀。

```bash
node tools/compare-spec-bytes/compare.mjs --rewrites docs/evidence/125/link-rewrites.txt
```

退出码 0。PRD 36 段、194695 字节；ARCHITECTURE 66 段、360198 字节；RULES 文首 2795 字节。`68 path prefixes`。`docs/evidence/125/link-rewrites.txt` 是这次写出的 68 行，每行是 `文件:行 旧路径 → 新路径`。

```bash
node tools/check-docs/check.mjs
```

退出码 0。`links: 0`，`anchors: 0`，`status: 9`，`verbatim: 0`，`findings: 9`。`links: 0` 就是 0 个 `missing-file`。九条仍是原来的索引表和状态行，没有占位页。

```bash
corepack pnpm test
```

退出码 0。86 个文件，229 passed，3 skipped。日志在 `/opt/cursor/artifacts/pnpm-test-125-forge.log`。

```bash
GATE_BASE=origin/main corepack pnpm run check
```

在 `b10c47f` 上退出码 0。`check-pr-size: 7592 non-generated lines`。日志在 `/opt/cursor/artifacts/pnpm-check-125-forge.log`。证据提交 `3c2f159` 上再跑同一门禁，退出码 0，仍是 7592。

## GitHub 标题 id

Wisdom 2026-11-04 11:40：先修锚点再合。只改根索引 `PRD.md`、`ARCHITECTURE.md` 里的链接片段。章节正文和 `link-rewrites.txt` 的 68 行没有改。

按 GitHub 的规则（转小写；只留字母、数字、中文、空格、连字符、下划线；空格变连字符）核对了本 PR 新增或改过的链接。对不上的只有这 5 处：

- `ARCHITECTURE.md:125` `9-ipc-协议renderer-↔-main` → `9-ipc-协议renderer--main`
- `ARCHITECTURE.md:127` `91-v2-桌面端-ui-新增-seam【已采纳adr-0001wisdom-2026-11-04】` → `91-v2-桌面端-ui-新增-seam已采纳adr-0001wisdom-2026-11-04`
- `ARCHITECTURE.md:153` `141-发生了什么数据来自旧仓库只读审查见-v1-审查-§3` → `141-发生了什么数据来自旧仓库只读审查见-v1-审查-3`
- `PRD.md:15` `33-设置模型能力的本地-api与面壁开放平台q9wisdom-2026-10-30-18371844` → `33-设置模型能力的本地--api与面壁开放平台q9wisdom-2026-10-30-18371844`
- `PRD.md:21` `36-v2-桌面端-ui-带来的范围补充【已采纳adr-0001wisdom-2026-11-04】` → `36-v2-桌面端-ui-带来的范围补充已采纳adr-0001wisdom-2026-11-04`

```bash
node tools/compare-spec-bytes/compare.mjs
node tools/check-docs/check.mjs
```

比对退出码 0，三组字节与上面相同，68 处路径前缀不变。`check-docs` 退出码 0。`links: 0`。`anchors: 5`，就是上面这 5 个：check-docs 自己的 slug 规则没改，所以它仍按旧片段报 missing-anchor。其余发现仍是 9 条状态行和索引表。在 `1d6c4e0` 上 `GATE_BASE=origin/main corepack pnpm run check` 退出码 0。`check-pr-size: 7619 non-generated lines`。日志在 `/opt/cursor/artifacts/pnpm-check-125-anchors.log`。

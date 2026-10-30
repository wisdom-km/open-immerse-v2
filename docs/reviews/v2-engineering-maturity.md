# open-immerse v2 工程成熟度（2026-10-30）

状态：审查报告。只记录差距与改法，不修改规格、配置或代码。
审查人：按 Wisdom 2026-10-30 23:57 的范围执行。
基线：分支 `feature/v2-full-review`，含 `main` `0febb03` 与本分支上的 `docs/reviews/v2-full-review.md`。
对照：Draft PR #10（`feature/v2-jev-toggle`）只作规格阅读，不改该分支。产品规格内部的写偏见 [v2-full-review.md](./v2-full-review.md)，本文不重复开单。

本文对照的是公开的通行实践，不是 OpenAI 或 SpaceXAI 的内部流程。这两家的内部工作流没有公开资料，凡是由此出发的猜测都标「未核实」，本文不把猜测写成差距。通行实践的出处写在第 3 节。

## 1. 评分尺

每个维度 0 到 3，评的是**今天仓库里能执行、能追溯的产物**，不是规格写得多完整。

| 分 | 含义 |
| --- | --- |
| 0 | 规格和仓库都没有这一环 |
| 1 | 规则或规格里写了，仓库里没有可执行产物，或只有空目录 / 空跑成功的检查 |
| 2 | 有可运行的检查或模板，缺机器强制或然缺一环 |
| 3 | 产物可追溯，合入路径上有必需检查，退回会被挡住 |

规格把某一环排进 M1 / M8，不把它算成已经落地。排期本身是 1 分档的证据。

## 2. 总评

九个维度都是 **1 / 3**。整体 **1 / 3**。

需求、架构、测试策略、密钥与许可证、日志与诊断包、数据迁移，在 `PRD.md`、`ARCHITECTURE.md`、`RULES.md` 里已经写成可以交给实现的句子。仓库今天能跑的只有一条窄的工具链 CI。`pnpm run typecheck` 在没有 `.ts` 文件时成功退出，pytest 在没有测试时把退出码 5 当成通过。绿色不代表 `ARCHITECTURE.md` §13 的 G1–G18。

这是规格仓库的正常阶段，不是推倒重来的理由。最小工作流是：现在补上人和 agent 的入口、任务模板、ADR 索引和「绿不等于门禁」这一句；门禁脚本、评测记录、签名公证按已有里程碑做。不要为了分数去加自动发版、崩溃上报或通用功能开关平台。这三件分别与 `PRD.md` §3.2、`ARCHITECTURE.md` §11、现有设置项冲突。

## 3. 通行实践（公开来源）

下列只用于定义「3 分长什么样」。不声称本仓库必须在 M1 之前全部达到 3 分。

| 实践 | 公开来源 |
| --- | --- |
| 架构决策记录：背景、选项、决定、后果、状态 | Michael Nygard，*Documenting Architecture Decisions*（2011） |
| 提交说明类型 | [Conventional Commits](https://www.conventionalcommits.org/) |
| 版本号 | [Semantic Versioning](https://semver.org/) |
| 变更记录 | [Keep a Changelog](https://keepachangelog.com/) |
| 路径归属与必需检查 | GitHub 文档中的 CODEOWNERS、分支保护、必需状态检查 |
| 测试分层 | 测试金字塔（单元、契约、端到端分开，端到端保持少） |
| 同一提交不靠反复全量碰运气；不稳定测试移出门禁 | 本仓库 `RULES.md` §4 已采纳；业界常见写法是隔离（quarantine），而不是删断言 |
| 模型卡 | Mitchell 等，*Model Cards for Model Reporting*（FAT* 2019） |
| 数据集说明 | Gebru 等，*Datasheets for Datasets*（2018）。本仓库的语料清单 + sha256 是同一方向的缩小版 |
| 第三方 Action 钉死到提交 | [SLSA](https://slsa.dev/) 与 GitHub 对 Action 版本钉扎的公开建议 |
| 依赖清单 | SPDX、CycloneDX；美国 NTIA《SBOM 最小要素》（公开文件） |
| 桌面加固与公证 | Electron 安全清单、Apple 公证文档、Windows 代码签名文档。规格已引用 Electron 清单 |
| 事故复盘 | Google《Site Reliability Engineering》中的无指责复盘（公开书） |

OpenAI、SpaceXAI 内部是否使用上表，**未核实**。

## 4. 审过的文件

`git ls-files` 在本分支上的全部跟踪文件如下。没有未跟踪的业务源码。`workers/parser/.venv/` 是本地安装，不在版本库里。

| 路径 | 与成熟度的关系 |
| --- | --- |
| `PRD.md` | 需求、验收、里程碑、范围外（含自动发版） |
| `ARCHITECTURE.md` | 模块边界、门禁 G1–G18、测试策略、日志、迁移、决策表 §16 |
| `RULES.md` | 分支与 PR、测试纪律、评审清单、Agent 禁止事项 |
| `DESIGN.md`、`docs/design-principles.md`、`docs/design/md-reader.md`、`docs/design/wireframe-vault.svg` | 设计规格；无独立 RFC 模板 |
| `docs/v2-gap-and-changes.md`、`docs/v1-review.md`、`docs/backlog.md` | 核实记录、v1 事故、未做事项 |
| `docs/architecture/**` | 历史草案，不是当前执行授权 |
| `docs/reviews/2026-10-30-architecture-review.md`、`docs/reviews/v2-full-review.md` | 已有审查 |
| `docs/ci-and-environment.md` | 从零跑起工具链的步骤 |
| `README.md` | 仓库入口；产品第一句与 PRD 不符 |
| `LICENSE` | Apache-2.0 |
| `package.json`、`pnpm-lock.yaml`、`eslint.config.js`、`tsconfig.json`、`tools/typecheck.mjs`、`.nvmrc` | Node 工具链。无 Prettier、无 Vitest、无 commitlint |
| `.github/workflows/ci.yml` | 唯一工作流 |
| `.gitignore` | 忽略 `.env`，但放行 `.env.example` |
| `.cursor/environment.json`、`.cursor/install.sh` | 云端 Agent 安装 |
| `workers/parser/pyproject.toml`、`uv.lock`、`.python-version`、`.uv-version`、`tests/.gitkeep` | worker 依赖基线与空测试目录 |

仓库中不存在：`AGENTS.md`、`CONTRIBUTING.md`、`CODEOWNERS`、`SECURITY.md`、`CHANGELOG.md`、`docs/adr/`、`docs/acceptance/`、`.github/ISSUE_TEMPLATE/`、`.github/PULL_REQUEST_TEMPLATE.md`、`.github/dependabot.yml`、Prettier 配置、业务切片目录、`fixtures/`。

GitHub 仓库元数据（2026-10-30 用只读 API 读取）：公开仓库，`has_issues` 与 `has_projects` 均为开，`delete_branch_on_merge` 为关。看板上有没有卡片，**未核实**（没有枚举 Project）。`main` 的分支保护接口返回 403，保护规则与必需检查 **未核实**。`docs/ci-and-environment.md` 第 55 行只「建议」管理员把 `CI / node` 与 `CI / python-worker` 设为必需，并写明 Agent 不改分支保护（与 `RULES.md` N-02 一致）。

PR #10 增加了 `AC-85`–`AC-94` 与 `N-20`，没有新增 CI、ADR 文件或 Issue 模板。它提高了规格里的可测试性，不提高今天仓库的分数。

## 5. 分维度

### 5.1 需求到交付 — 1 / 3

现状：

- 需求在 `PRD.md`（用户故事、`AC-*`、里程碑 M0–M8）。设计在 `DESIGN.md` 与 `docs/design/`。架构决定的摘要在 `ARCHITECTURE.md` §16 与 `docs/v2-gap-and-changes.md` §6。
- 分支与 PR 的写法在 `RULES.md` §2：`feature/`、`fix/`、`chore/`，Conventional Commits，PR 先 Draft，描述要有改动原因、切片、测试证据、风险、UI–core 交接。合入由人决定（N-03）。发版由人执行（N-04，`PRD.md` 第 60 行把自动发版列在范围外）。
- 已经合入的规格 PR（#5–#9）和本审查 PR 表明「规格 → PR」这条链路在用。PR 标题能对上 AC 编号。

差距：

- 没有 Issue 模板，也没有仓库内的任务拆分格式。`AC-*` 到 Issue 的对应关系不是必填字段。
- GitHub Projects 已开启，仓库里没有列、状态或「一个 AC 一张卡」的约定。看板是否在用，**未核实**。
- 没有 RFC 目录。重大决定写进 PRD §9 与 ARCH §16，和规格正文缠在一起，状态（提议 / 采纳 / 被取代）不单独成页。见 5.2。
- 发版没有产物：无标签规则、无 changelog、无发布工作流。M8 只要求「构建产物可安装；签名公证由人执行」（`PRD.md` 里程碑表）。

改法：

- **P0（E-P0-1）** 先改入口，否则任务会从错误的产品句拆出去。见 5.9。
- **P1（E-P1-2）** 现在加 Issue 模板与 PR 模板，字段只复述 `RULES.md` §2 与 §8.4：关联 US/AC、切片、任务类型、测试 SHA、未验证项。不新发明一套流程。
- **P1（E-P1-12）** 在 M8 之前写清三种版本号各管什么：规格文档版本、应用 semver、worker 包版本（今天 `workers/parser/pyproject.toml` 是 `0.0.0`，规格头是 v0.6）。changelog 从第一次给人安装的构建开始记，不回溯每一份规格 PR。
- **P2** 看板怎么列，等 Issue 模板用起来再定。不要在报告里假定已经有一张板。

### 5.2 设计评审与 ADR — 1 / 3

现状：

- `RULES.md` 第 152 行：结构性变更要配 ADR。`ARCHITECTURE.md` 第 1937 行：ADR 放在 `docs/adr/`，第一批在 M1 建立目录时登记。`docs/backlog.md` 第 67 行把这件事留在 M1。
- `docs/adr/` 不存在。
- 已拍板的内容在 `ARCHITECTURE.md` §16 的表里，背景和取舍大量在 `docs/v2-gap-and-changes.md`。这是决策日志，不是一份份带状态的 ADR。被取代的句子按 backlog 的写法要求删掉，而不是在 ADR 里标 `superseded`。两套习惯还没有一个目录把它们接上。

差距：Nygard 格式里的「状态、考虑过的选项、后果」没有固定位置。后来的 agent 要在 1900 行架构文里找「为什么不选另一条」。PR #10 的路线决定也是直接改规格，没有单独的 ADR 页。这在规格阶段说得通，M1 一旦写代码，继续只改长文会让「当前有效决定」无法点名。

改法：

- **P1（E-P1-1）** 现在可以加 `docs/adr/README.md`：模板（背景、选项、决定、后果、状态）加上一张索引，每行指向现有 Q 编号和 §16，不重写决定，不改规格正文。
- **P1** M1 再把 backlog 点名的第一批（G18、`ui-events-declared`、`supervisor-state`、`oi-rules/1`）写成独立文件，并让「新增依赖边」的 PR 必须改其中一份。在脚本落地前，这是评审清单项，不是 CI。
- 不把全部历史决定一次性拆成几十份 ADR。那会制造第二份规格。

### 5.3 代码质量门禁 — 1 / 3

现状（可执行的部分）：

- `.github/workflows/ci.yml`：`permissions: contents: read`；Action 钉在提交 SHA 上（checkout、setup-node、cache、setup-uv）。这是供应链上已经做到的一点。
- Node：`corepack pnpm install --frozen-lockfile`、ESLint（`eslint.config.js` 使用 `recommended`，`--max-warnings 0`）、`pnpm run typecheck`、`pnpm test`（`node --test`）。
- `tools/typecheck.mjs` 第 27–29 行：仓库里没有 `.ts` / `.tsx` 时打印一句并成功退出。今天的类型检查是空跑。
- Python：ruff check 与 format check、pytest。工作流第 85–88 行把 pytest 退出码 5（没有收集到测试）当成通过。测试目录只有 `workers/parser/tests/.gitkeep`。
- 锁文件字符串：必须有 `pypdfium2`，拒绝包名 `pymupdf` / `fitz`（工作流第 91–97 行）。
- `tsconfig.json` 的 strict 开关与 `RULES.md` §1.1 一致，但当前没有源文件可编。
- 规格中的门禁是另一套：`ARCHITECTURE.md` §13 要求 Prettier、`strict-type-checked`、`max-lines`、dependency-cruiser（界面到 seam 到 core）、import-linter、gitleaks、license-checker、Vitest、热点与 PR 体量、G13–G16。这些脚本和配置文件都不在仓库里。`package.json` 没有对应 script。`pnpm check` 写在 `ARCHITECTURE.md` §15.3，标的是「M1 落地后」。

差距：

- 依赖方向（UI → seam → core）只写在规格和 `RULES.md` §5 第 11 条，机器不查。
- 没有 CODEOWNERS。评审清单是人读的。
- Conventional Commits 没有工具检查。
- 分支保护是否把现有两个 job 设为必需，**未核实**（API 403）。文档用的词是「建议」。
- 空跑成功会让「CI 绿了」被当成质量结论。

改法：

- **P0（E-P0-2）** 现在就在 `docs/ci-and-environment.md` 与未来的 `AGENTS.md` 写明：当前绿色只说明工具链能安装；`typecheck` 在无源文件时跳过；pytest 退出码 5 被放行；G1–G18 尚未执行。M1 合入门禁之前不新建 `packages/features/**`。这一句不代替 M1 的脚本。
- **P1（E-P1-3）** 请仓库管理员把 `CI / node`、`CI / python-worker` 设为 `main` 的必需检查。Agent 按 N-02 不能自己改。设置之后在 `docs/ci-and-environment.md` 把「建议」改成「已启用」，并写上核实日期。
- **P1（E-P1-4）** CODEOWNERS 要等 Wisdom 指定路径归属再提交。本报告不填人名。
- **P1（E-P1-5）** 提交类型检查可以放在 M1 的 `pnpm check` 里，用 Conventional Commits 的公开规范即可，不必另写一套中文类型。
- **P1（E-P1-6）** dependency-cruiser 与 `tsconfig.core.json` 按 §13 在 M1 做。现在不要用放宽 ESLint 的方式「先让业务代码过」。
- **P2（E-P2-9）** Prettier 配置属于 G1，随 M1，不单独立项。

### 5.4 测试金字塔 — 1 / 3

现状：

- 分层写在 `ARCHITECTURE.md` §12：core（Vitest，Node，经 seam）、属性测试、端口契约、TS/Python 协议夹具、解析规则对拍、服务商共享套件、UI 组件、少量 Playwright 冒烟、基准脚本不进 PR 门禁。
- 纪律写在 `RULES.md` §4：同一 tip 全量只跑一次；失败只重跑失败项；flaky 开 issue 并加 `quarantine`，不得删测试；`@model` / `@device` / `@paid` / `@live` 不进 PR 门禁；门禁里的 `skip` 视为失败，除非 PR 写明原因。
- 可执行产物：`workers/parser/tests/.gitkeep`。没有 `*.test.ts`，没有 `fixtures/`，没有 `docs/acceptance/`。

差距：金字塔的每一层都还是意图。PR #10 的 `AC-85`–`AC-94` 把路线行为写成了可以做契约测试的句子，测试文件仍然为零。

「QA 每个提交只跑一次完整测试」：`RULES.md` 第 89 行已经是这个纪律，管的是人不要对同一 tip 反复全量。CI 同时监听 `push` 和 `pull_request`（`ci.yml` 第 3 行；`docs/ci-and-environment.md` 第 57 行说明同一推送会跑两组）。今天套件是空的，两组都便宜。等 e2e 和契约测试变重，同一次推送会把完整套件跑两遍，和这条纪律的意图相反。

改法：

- **P1（E-P1-7）** 测试框架按 M1 引入。第一批只做：一个会失败的 core 样例（证明 Vitest 真的在跑），以及 pytest 在「零个测试文件」时失败、在「有意留空的目录」时才允许退出码 5。不要在 M1 之前用空跑维持绿色。
- **P2（E-P2-1）** M1 起用工作流并发组按 SHA 取消重复运行，或在已有 PR 时跳过 `push` 上的重活。保留 PR 上的那一组给分支保护用。
- **P2（E-P2-2）** `quarantine` 目录或标记等第一个不稳定测试出现再加。规则已经够用，现在建空目录没有行为可测。

### 5.5 AI 专项 — 1 / 3

现状：

- 基准与指标在 `PRD.md` §6.2（QM-01–QM-17）和 M0，状态是待执行。`ARCHITECTURE.md` §12 写明基准不作为 PR 门禁，结果写入 `docs/acceptance/`。该目录不存在。
- 模型版本：差异清单写锁定 MiniCPM-OCR 提交 `1269e4f`，并要求登记权重 sha256。sha256 未写入，因为未核实。这是对的，不要补一个编出来的哈希。
- 提示词：缓存键含「提示词模板版本」（`ARCHITECTURE.md` §8.1.1）。没有模板正文的目录，也没有「改提示词必须升版本」的检查。
- 离线评测：规格选择「不挡 PR、夜间或手动、`@model` 不进门禁」。这和「完整评测不要绑在每个文档 PR 上」的通行做法一致。缺的是记录位置和定时任务，不是缺一条把 M0 变成 PR 红灯的规则。
- 成本：`BudgetGate` 先预留，写在 §7.8，没有实现。单价未核实的科目用次数上限，数字要等批准（N-14）。
- 隐私：按服务商外发同意、不上传原 PDF、日志不记正文和密钥。这是数据治理里已经写清的部分。
- 第三方条款：arXiv API ToS 有引用（`ARCHITECTURE.md` §7.6）。模型输出能否再分发，第一轮审查记为缺口，此处不扩大成新的产品条款。
- 没有模型卡、没有红队用例、没有线上质量监测。产品是桌面应用，没有「线上」服务可监测。桌面侧对应物是本机诊断与用量账本（§11、§7.8），尚未实现。

差距：评测平台、提示词评审、红队都还没开始。规格把离线评测放在 PR 之外，这个决定保留。

改法：

- **P1（E-P1-8）** M0 开工时建立 `docs/acceptance/` 的结果格式：文献 id、PDF sha256、路线 id、各来源请求数、显示决定计数、失败原因。用合成夹具演示格式；真实 PDF 不入库（N-12）。在此之前不要把评测设为 PR 必需检查。
- **P1（E-P1-9）** 第一份翻译提示词落地时（M4）同时加模板目录和版本。模型卡在 M6a 换成真实 Jev 时写，内容只含锁定提交、许可证、未核实项，不写未测的精度。
- **P2（E-P2-5）** 红队放到 M4 之后，范围限于本应用已经要防的事：PDF 与模型输出里的 HTML、提示注入进译文、密钥进日志。不单开一个与产品无关的通用红队项目。
- 权重 sha256 在官方文件核实之前保持空白。

### 5.6 发版工程 — 1 / 3

现状：

- 人发版：`RULES.md` N-04；`PRD.md` 第 60 行范围外含「自动发版、自动签名公证（由人执行）」；M8 是安装包流水线，签名公证仍由人做；`ARCHITECTURE.md` §13 写 macOS 公证留到 M8。
- 数据：`ARCHITECTURE.md` §8.4 有 `app_schema`、迁移前复制到 `staging/`、失败则原文件不动、只留最近一份备份、数据比应用新时只读。验收是 AC-66。ADR 要求在 M2 建第一张业务表之前合入。
- 功能行为开关已经是产品设置，不是另一个平台：外发前询问、评分开关、处理路线、预算模式（后两项在 PR #10）。规格没有通用的远程配置开关。
- 没有 changelog，没有应用 semver，没有发布工作流，没有自动更新通道。

差距：灰度发布、自动更新如果做成产品能力，就和「自动发版不在 v2」冲突。成熟做法在这里是一份人执行的清单，不是再引入更新器。

改法：

- **P1（E-P1-12）** 见 5.1。现在只写版本号各自的含义，避免把规格 v0.6 当成安装包版本。
- **P2（E-P2-3）** M8 前增加一页人执行的发版清单：构建号、changelog 条目、迁移备份是否演练、Windows 签名与 macOS 公证由谁点、回滚时安装上一构建且新库只读。不写自动上传、不写分批推送。若以后要灰度，那是新的产品决定。
- **P2（E-P2-8）** 不要建通用功能开关服务。继续用设置项和路线配置。

### 5.7 可观测性与事故流程 — 1 / 3

现状：

- `ARCHITECTURE.md` §11：JSON 行日志，字段有 `ts`、`level`、`event`、`feature`、`requestId`、`jobId`、`errorCode`；不记正文、译文、提示词、密钥。诊断包导出前走脱敏，内容是计数、哈希、耗时、错误码、设置摘要。用量进预算账本。
- 崩溃：「只写本机；不自动上传。」
- 诊断包在迁移失败时允许导出（§8.4），且不含正文与密钥。
- `diagnostics` 切片有 `redaction-rules.ts` 与 `export-bundle.ts` 的职责行，没有代码。
- v1 的公式译文陈旧有复盘记录（`docs/v1-review.md` §4.18），v2 用缓存键挡住同类问题。仓库没有给 v2 事故用的空白模板。

差距：结构化日志和诊断包是规格，不是程序。崩溃上报没有「用户同意后上传」的路径。规格的决定是不自动上传。为了凑观测性加上报，会扩大产品范围，也和隐私句子冲突。团队缺的是内部复盘模板，不是用户遥测。

改法：

- **P1（E-P1-11）** 现在加一份短的事故复盘模板：时间线、影响面（哪类文献、哪条路线）、检测方式、数据是否离开本机、修复、验证。无指责。不要求接入外部事故系统。
- **P2（E-P2-4）** 保持崩溃只写本机。若将来要经用户同意上报，单独由 Wisdom 决定，并走现有外发同意，不在本报告里设计上报协议。
- 诊断页与保留天数按现有排期在 M2，默认数字等实测（N-14）。

### 5.8 安全与供应链 — 1 / 3

现状：

- 许可证 Apache-2.0（`LICENSE`）。禁止 GPL/AGPL，含 PyMuPDF 与 MiniCPM `pdf` extra（`RULES.md` §1.5、N-13）。
- 密钥：N-05；只经环境变量；不读 `.env`；用户密钥进 `safeStorage`，明文只在 main 内存；远程 worker 不收桌面 Key。CI 不调用付费 API。
- `.gitignore` 忽略 `.env` 与 `.env.*`，但第 7 行用 `!.env.example` 把示例文件放回来。仓库里目前没有 `.env.example`。
- CI 已做：锁文件冻结、Action SHA 钉扎、`contents: read`、PyMuPDF 包名拒绝、pypdfium2 必须出现。
- 规格中的 G9 gitleaks、G10 license-checker 与 pip-licenses 未出现在工作流里。
- 没有 `dependabot.yml`，没有本仓库的 SBOM 生成步骤，没有 `SECURITY.md`。依赖漏洞告警是否在 GitHub 界面打开，**未核实**。

差距：包名 grep 挡不住换名的 AGPL 传递依赖。密钥扫描在有人把 Key 写进文档或夹具时还不会失败。公开仓库没有安全联系方式。

改法：

- **P1（E-P1-10）** 现在可以加 Dependabot（只开版本更新 PR，不自动合入）和 gitleaks。SBOM 生成与 G10 放在 M1，和 license-checker 一起，避免两套许可证结论。SBOM 格式用 SPDX 或 CycloneDX 之一即可。
- **P2（E-P2-6）** 删掉 `.gitignore` 里对 `.env.example` 的放行，或在 `AGENTS.md` 写明示例文件也不得出现看起来像密钥的字符串。与 N-05 对齐。
- **P2（E-P2-7）** 公开仓库加 `SECURITY.md`，只写联系方式和「不要在 Issue 里贴 Key」。不写悬赏，不扩大安全范围。

### 5.9 文档与上手 — 1 / 3

现状：

- 工具链步骤是真的：`docs/ci-and-environment.md` 从 `nvm use` 到 `pnpm` 与 `uv run pytest`，并解释 pytest 退出码 5。`.cursor/install.sh` 按同一顺序给云端 Agent 安装，不装 Paddle、Torch 和权重。
- `README.md` 第 2 行是 `Open Immerse v2 - PDF formula extraction and vector redraw project`。`PRD.md` 的产品是英文学术 PDF 的中文对照阅读。`docs/v1-review.md` 第 541 行写明矢量重绘 v2 不立项。
- 没有 `AGENTS.md`、没有贡献指南、没有 `.cursor/rules`。`RULES.md` 第 4 行写适用对象包含 AI Agent，但入口不指向它。
- `README.md` 第 16–22 行把 `docs/architecture/` 说成仍须按方案验收的完整方案。该目录文首已声明是历史输入。

差距：一个没有上下文的人可以按 CI 文档把工具链跑绿，然后按 README 第一句去做另一个产品。应用本身还不能启动（没有 Electron 工程），文档没有把「跑绿」和「应用能打开」分开。

改法：

- **P0（E-P0-1）** 与第一轮 P0-5、P1-11 是同一件事，这里从上手链路再记一笔。改 README 第一句为 PRD 的产品句；增加短的 `AGENTS.md`，只做指针：五步阅读顺序、N-01–N-20 的位置、当前 CI 不等于 G1–G18、M1 前不建业务切片、冲突时以 RULES、ARCHITECTURE、PRD、草案这个顺序。不要把规格复制进第二份长文。
- 贡献指南可以就是 `AGENTS.md` 加 `RULES.md` §2 的链接。不必再写第三份流程。

## 6. 计数

| 严重度 | 条数 | 编号 |
| --- | --- | --- |
| P0 | 2 | E-P0-1、E-P0-2 |
| P1 | 12 | E-P1-1 至 E-P1-12 |
| P2 | 10 | E-P2-1 至 E-P2-10 |

E-P2-10：`delete_branch_on_merge` 为关（API 已核实）。合入后分支会留下。是否打开由管理员定，Agent 不改仓库设置（N-02）。这不是产品缺陷。

## 7. 最小可行的成熟工作流

「现在」指业务切片开工之前，只加流程文件或一句说明，不扩大产品范围，不把 M1 的门禁脚本提前塞进仓库。实现仍走单独 PR。

| 项 | 何时 | 做什么 | 不做什么 |
| --- | --- | --- | --- |
| 入口 | 现在 | README 产品句 + `AGENTS.md` 指针（E-P0-1） | 不复制 PRD |
| 绿的含义 | 现在 | CI 文档写明空跑与 G1–G18 未生效（E-P0-2） | 不假装门禁已开 |
| 任务 | 现在 | Issue 模板、PR 模板，字段来自 RULES §2 / §8.4（E-P1-2） | 不新造状态机 |
| 决定 | 现在 | `docs/adr/README.md` 模板 + 指向 Q1–Q12 的索引（E-P1-1） | 不重写 §16 |
| 事故 | 现在 | 一页复盘模板（E-P1-11） | 不接外部事故平台 |
| 版本号 | 现在 | 用十行说明规格版本、应用版本、worker 版本各是什么（E-P1-12） | 不从历史规格 PR 补 changelog |
| 必需检查 | 现在，由人 | 管理员打开分支保护（E-P1-3） | Agent 不改保护规则 |
| 密钥与依赖 PR | 现在或 M1 第一周 | gitleaks、Dependabot（E-P1-10 的前半） | 不自动合入依赖 PR |
| 门禁脚本 | M1（已排期） | G1–G18、Prettier、依赖方向、许可证扫描、Vitest 真跑、第一批 ADR 正文 | 不在业务 PR 里顺手放宽 |
| 评测记录 | M0 | `docs/acceptance/` 的结果格式（E-P1-8） | 不把基准设为每个 PR 的红灯 |
| 提示词与模型卡 | M4 / M6a | 模板版本目录；Jev 模型卡只写已核实字段（E-P1-9） | 不编 sha256 和精度 |
| 诊断包与迁移 ADR | M2 建表前 | 按 §8.4、§11 实现；ADR 先于第一张业务表 | 不填未实测的保留天数 |
| 发版清单 | M8 前 | 人执行的签名、公证、备份演练、只读回滚（E-P2-3） | 不做自动发版、不做灰度通道 |
| 红队样本 | M4 之后 | 只覆盖 HTML、提示注入、密钥进日志（E-P2-5） | 不单独立项通用红队 |
| CODEOWNERS | Wisdom 指定归属之后 | 按路径写所有人（E-P1-4） | 不在本报告里填人名 |

明确不做，避免用流程项目扩大范围：

- 自动发版、自动签名公证（`PRD.md` §3.2）。
- 崩溃自动上传，包括「先做着、默认关闭」的上报 SDK（`ARCHITECTURE.md` §11）。
- 通用远程功能开关。评分、路线、外发询问、预算继续用设置。
- 订阅、账号、官方云（已在范围外）。

## 8. 和第一轮审查的分工

[v2-full-review.md](./v2-full-review.md) 处理规格是否自相矛盾、PR #10 是否漏写已定产品决定。本文只处理工程链路有没有可追溯、可执行的产物。两份报告都认为：M1 之前不要按绿色 CI 去写业务切片；README 不能继续把产品说成矢量重绘。本文不把那些产品级 P0 再编号一次。

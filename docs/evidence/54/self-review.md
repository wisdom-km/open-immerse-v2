# PR #54 自审

日期：2026-11-02。纯文档。UI–core 交接说明：不适用。

表对应本文件所在提交相对 `origin/main` 的改动句（含 `commands.md`；不含本文件）。规格正文停在 `37d946e80eac03ebf52762a5aabb44576337772e`，其后只加证据。规则行的结论只写「遵守」或「违反」。S 行是改过的句子，结论是该句开头，全文在对应行。

| ID | 结论 | 文件:行 |
| --- | --- | --- |
| N-02 | 遵守 | README.md:30；docs/ci-and-environment.md:15 |
| N-10 | 遵守 | 未改 DESIGN.md、docs/design-principles.md、docs/design/** |
| N-11 | 遵守 | 未改 .cursor/environment.json、.cursor/install.sh |
| N-14 | 遵守 | PRD.md:558；docs/v2-gap-and-changes.md:594 |
| N-15 | 遵守 | PRD.md:560；docs/v2-gap-and-changes.md:612 |
| N-22 | 遵守 | RULES.md:160 |
| §7 | 遵守 | docs/spec-changelog.md:11 |
| §9 | 遵守 | docs/evidence/54/commands.md |
| S01 | 状态：v0.6，规格基线（唯一真相源之一）。当前版本仍是 v0.6，本文件不升这个号。变更指针：[docs/spec-changelog.md] | ARCHITECTURE.md:3 |
| S02 |   W1["Python worker（本机）<br/>预处理 / 引擎 A / 引擎 B / Jev<br/>默认转发托管 API；选「本地」 | ARCHITECTURE.md:29 |
| S03 | - **API 优先**（Wisdom 2026-10-30 18:44，§7.0；2026-11-02 本地改为第二路线）：每个由模型提供的能 | ARCHITECTURE.md:66 |
| S04 |    └─ codegen/                        # 契约 → JSON Schema → Python 模型（M1  | ARCHITECTURE.md:294 |
| S05 | ／ `settings` ／ 非密钥设置、provider 配置、密钥引用绑定（预算上限的规则与存储在 `budget`，设置页只经 `wind | ARCHITECTURE.md:396 |
| S06 | 决定：开发与最终用户一视同仁，凡是由模型提供的能力（Jev 评分、引擎 B / MiniCPM-OCR、版面、多模态、OCR、翻译，以及同样依赖 | ARCHITECTURE.md:743 |
| S07 | 1. **默认 API。** 每个模型能力在设置里有一个「本地 / API」选择（`settings/domain/backend-choice | ARCHITECTURE.md:747 |
| S08 | 2. **本地是第二路线。** 两种来源仍是同一个端口或同一种 worker 作业。本地实现在 M0/M1 只留 stub，不写 `docs/d | ARCHITECTURE.md:748 |
| S09 |    - **按服务商问一次，不是每一次请求都问。** 某个服务商第一次要收到数据前，弹一个对话框，列出当前选定把数据发给它的**全部**能力， | ARCHITECTURE.md:753 |
| S10 | ／ 版面（`layout` 作业；与下一行是两个设置，D-D，Wisdom 2026-10-31） ／ 没有已核实的托管版面 API。百度 AI | ARCHITECTURE.md:768 |
| S11 | - **引擎 A 的版面档位（Q10）**：标准档 = PP-DocLayoutV3，M3 起步即用；基准集另跑 PP-DocLayout_pl | ARCHITECTURE.md:935 |
| S12 | 决定（Q9，Wisdom 2026-10-30）：设置主选项是「本地 / API」，默认「API」，Jev 的 API 服务商是面壁开放平台（模 | ARCHITECTURE.md:1061 |
| S13 |  | ARCHITECTURE.md:1062 |
| S14 | **`jev.route`（Wisdom 2026-11-02 17:03）。** 键在 `settings/domain/backend-ch | ARCHITECTURE.md:1063 |
| S15 | ／ 本地 ／ 本机 worker（`127.0.0.1`） ／ `local_engine`：现在是 stub，不调用面壁 API；以后换成 l | ARCHITECTURE.md:1069 |
| S16 | 主选项「API」是 `jev.route='api'`，只走面壁托管 HTTP。主选项「本地」、高级自建远程 worker、高级自建 Jev D | ARCHITECTURE.md:1074 |
| S17 |  | ARCHITECTURE.md:1075 |
| S18 | 5. 本机模式启用前必须通过官方启动自检与参考样例比对（上游说明：只有启动自检能确认后端可用；参考样例三项分数与参考值相差 0.02 以内为正常 | ARCHITECTURE.md:1086 |
| S19 | 4. **未设上限。** 受限预算模式下，单价未知、又没有为该科目设次数类上限时，`reserve` 返回 `budget_cap_unset` | ARCHITECTURE.md:1253 |
| S20 | ／ `multimodal-layout` ／ 多模态+版面 ／ PP-DocLayout，部署不默认本机（本机只留 stub；Wisdom 2 | ARCHITECTURE.md:1561 |
| S21 | ／ `ocr-layout` ／ OCR+版面 ／ PP-DocLayout，部署不默认本机（本机只留 stub） ／ 引擎 A 的识别阶段；引 | ARCHITECTURE.md:1563 |
| S22 | 云 OCR 不在任何一个预设里默认打开（它是额外的付费来源，用户配好后加入识别列表）。四个预设的识别列表不改：`multimodal-only` | ARCHITECTURE.md:1566 |
| S23 | **部署（D-D，Wisdom 2026-10-31）。** 版面的「本地 / API」和引擎 A 识别阶段的「本地 / API」是两个设置。版 | ARCHITECTURE.md:1601 |
| S24 | - 所有消息 schema 来自 `contracts`（TypeBox 定义 → JSON Schema → `datamodel-code- | ARCHITECTURE.md:1876 |
| S25 | **开发机上的本机 worker。** 开发机是 Windows + 32 GB 内存 + NVIDIA RTX 4070 12 GB（§7.0 | ARCHITECTURE.md:1911 |
| S26 | - 每个模型能力的「本地」与「API」两个来源跑同一份契约测试（假后端或去掉凭据与图片内容的录制样例）。M0/M1 里「本地」来源跑的是 stu | ARCHITECTURE.md:2001 |
| S27 | ／ 处理路线（2026-10-30 22:41、22:44、22:45；23:55 续定） ／ 四类积木加声明式组合，不写死 A/B/C。预设四 | ARCHITECTURE.md:2154 |
| S28 | ／ 版面本地实测（2026-10-31；测量要求由 2026-11-02 取代） ／ 当时写的是：依赖本地版面的生产说法之前，M0 必须在 8  | ARCHITECTURE.md:2155 |
| S29 | ／ Q9 ／ 设置主选项「本地 / API」，默认「API」，Jev 的 API 服务商是面壁开放平台；「本地」与 API 走同一个 `eval | ARCHITECTURE.md:2167 |
| S30 | ／ API 优先（2026-10-30 18:44） ／ 每个模型能力有托管 API 时默认 API，本地留在设置「本地 / API」里、与 A | ARCHITECTURE.md:2168 |
| S31 | ／ M0 费用与 M3 真值表（Wisdom 2026-10-31 13:14） ／ M0 增加单篇费用与单篇耗时：同一批论文、四个预设，给占位 | ARCHITECTURE.md:2181 |
| S32 | ／ 面壁 API 为主路线（Wisdom 2026-11-02 16:38 UTC+8） ／ 原文见 PRD §9 与差异清单 §6.15。面壁 | ARCHITECTURE.md:2182 |
| S33 | ／ Jev 两条路线（Wisdom 2026-11-02 17:03 UTC+8） ／ 原文见 PRD §9 与差异清单 §6.15。只收窄同日 | ARCHITECTURE.md:2183 |
| S34 | 状态：v0.6，规格基线（唯一真相源之一）。当前版本仍是 v0.6，本文件不升这个号。变更指针：[docs/spec-changelog.md] | PRD.md:3 |
| S35 | **API 优先**（Wisdom 2026-10-30 18:44，[ARCHITECTURE §7.0](./ARCHITECTURE.md | PRD.md:25 |
| S36 | 质量评估模型 Jev 的「API」由面壁开放平台托管（模型 `MiniCPM-OCR-Jev`，需要用户自己的面壁 API Key，价格**未核 | PRD.md:27 |
| S37 | 每个模型能力一个「本地 / API」选择（API 优先；「本地」是第二路线，M0/M1 只留同一接口上的 stub，§9，2026-11-02） | PRD.md:66 |
| S38 | ／ 质量评估（Jev） ／ 面壁开放平台 `MiniCPM-OCR-Jev` ／ worker 内 llama.cpp CUDA 构建首选，Ol | PRD.md:70 |
| S39 | - **版面。** PP-DocLayout 先切出正文、行内公式、行间公式、图、表并排好阅读顺序，每个区块带坐标，再裁成小图交给识别和翻译。版 | PRD.md:130 |
| S40 | - **预设**（Wisdom 2026-10-31，W-4）：正式全局默认等 M0 在同一批论文上对比四个预设的质量、面壁 API 单篇耗时、 | PRD.md:134 |
| S41 | ／ AC-20 ／ Jev 部署推荐（Q9，API 优先）：对硬件画像夹具，推荐结果 100% 符合 ARCHITECTURE §7.4 的规则 | PRD.md:223 |
| S42 | #### 6.1.15 Jev 的两条路线（AC-103） | PRD.md:406 |
| S43 |  | PRD.md:407 |
| S44 | 来自 Wisdom 2026-11-02 17:03。只约束面壁 Jev。PP-DocLayout 与其余非 Jev 的本机推理仍是第二路线（§ | PRD.md:408 |
| S45 |  | PRD.md:409 |
| S46 | ／ 编号 ／ 标准 ／ 对应 ／ | PRD.md:410 |
| S47 | ／ AC-103 ／ Jev 两条路线同一契约（①–④ 为 core 测试。最小托管 API 客户端在 M1，M6a 接入完整流程，§8）：①  | PRD.md:412 |
| S48 |  | PRD.md:413 |
| S49 | ／ M0 规格基线 ／ 本 PR：PRD / ARCHITECTURE / RULES、v1 审查、差异清单、Loom 的 Markdown 阅 | PRD.md:490 |
| S50 | ／ M1 工程骨架与门禁 ／ monorepo、契约包（含 `latex-policy`、`budget` 的 `BudgetGate`、译文的 | PRD.md:491 |
| S51 | ／ M3 引擎 A 与 worker 协议 ／ 开工前核实百度 AI Studio PaddleOCR 托管 API 能否作为引擎 A 模型阶段 | PRD.md:493 |
| S52 | ／ M6a 质量评分与预算 ／ 开工前复核 Jev 锁定版本（Q1）与面壁 Jev 的接口文档、国内站 API 地址与价格（差异清单 §7）；把 | PRD.md:496 |
| S53 | - Q9 已决定（Wisdom 2026-10-30）：设置主选项是「本地 / API」，默认「API」；Jev 的 API 服务商是面壁开放平 | PRD.md:531 |
| S54 | - API 优先已决定（Wisdom 2026-10-30 18:44）：开发与最终用户一视同仁，每个由模型提供的能力（Jev、引擎 B / M | PRD.md:532 |
| S55 | - 处理路线（Wisdom 2026-10-30 22:41、22:44、22:45，后一条为准；23:55 续定）：不把 A / B / C  | PRD.md:546 |
| S56 | - 版面的两个开关、关掉版面时的引擎 A / 引擎 B / 云 OCR，以及过渡默认（Wisdom 2026-10-31）：① D-D：版面「本 | PRD.md:554 |
| S57 | - 2026-10-31 13:14（M0 费用、M3 真值表、显示链确认）：① M0 的单篇费用保留，用来给占位预算上限定标（N-14）。机器 | PRD.md:558 |
| S58 |  | PRD.md:559 |
| S59 | - 面壁 API 为主路线、本地部署为第二路线（Wisdom 2026-11-02 16:38 UTC+8）原文：「面壁 API 是主路线对，然 | PRD.md:560 |
| S60 |  | PRD.md:561 |
| S61 | - 面壁 Jev 的两条路线在契约里都是一等（Wisdom 2026-11-02 17:03 UTC+8）原文：「就是这个JEV的模型啊，我考虑 | PRD.md:562 |
| S62 |  | PRD.md:563 |
| S63 | - Jev API 客户端的里程碑（Wisdom 2026-11-02 17:21 UTC+8）原文：「Jev API 客户端提前到 M1，M6 | PRD.md:564 |
| S64 | CI 跑已经接上的 ARCHITECTURE §13 门禁。哪些门禁在跑、哪些还没接、为什么不接，见 [docs/ci-and-environm | README.md:30 |
| S65 | 状态：v0.6，规格基线（唯一真相源之一）。Q1–Q12 已由 Wisdom 于 2026-10-30 全部决定；v0.2 加入许可证政策（Q6 | RULES.md:3 |
| S66 | - **两种来源同一套契约测试。** 有「本地 / API」两种来源的模型能力，两个来源跑同一份契约测试（假后端或去掉凭据与图片内容的录制样例） | RULES.md:101 |
| S67 | 14. 模型能力 API 优先（ARCHITECTURE §7.0）：新增或修改由模型提供的能力时，有托管 API 就默认 API。「本地」保留 | RULES.md:124 |
| S68 | ／ N-22 ／ 把 G1–G18 全部脚本落地当作新建 `packages/features/**` 业务切片的前提。业务切片的 M1 门禁前 | RULES.md:160 |
| S69 | 状态：索引。日期：2026-11-02（Asia/Shanghai）。 | docs/adr/README.md:3 |
| S70 | ／ Q9 ／ Jev 部署在本地还是 API ／ 差异清单 §6 的 Q9 行；ARCHITECTURE §16 的 Q9 行。2026-11- | docs/adr/README.md:31 |
| S71 | Q1–Q12 之后的决定（处理路线、API 优先、外发同意、Markdown、架构评审修复、PR C，2026-10-31 的 D-D、D-E、 | docs/adr/README.md:36 |
| S72 | 状态：v0.6。当前版本仍是 v0.6，本文件不升这个号。变更指针：[spec-changelog.md](./spec-changelog.m | docs/backlog.md:3 |
| S73 | ／ 阅读顺序实测：AI Studio 托管 API 是否带阅读顺序。PP-DocLayoutV2、V3 开源本机推理推迟，M0/M1 不下载、不 | docs/backlog.md:60 |
| S74 | ／ 本机 PP-DocLayout（含 8 GB CPU 上的冷启动、单页耗时、峰值内存、是否 OOM） ／ 推迟，不是 M0/M1 门禁（Wi | docs/backlog.md:78 |
| S75 | ／ 协议代码生成与其后的 worker 切片 ／ M1 前提。Forge 排序（2026-11-02，不是业主决定）：契约（#55）→ 代码生成 | docs/backlog.md:82 |
| S76 | R-A 已由 Wisdom 于 2026-10-31 01:14 改标签解决。D-D、D-E 于同日决定。W-4 的过渡默认预设于同日定为 `m | docs/backlog.md:168 |
| S77 | ／ W-4 ／ 默认预设与识别源优先级 ／ 正式默认预设：① 继续不指定正式 id，等 M0。② 写成四个预设 id 中的一个（具体哪一个等这批 | docs/backlog.md:188 |
| S78 |  | docs/backlog.md:223 |
| S79 | ## 11. 2026-11-02 面壁 API 为主路线 | docs/backlog.md:224 |
| S80 |  | docs/backlog.md:225 |
| S81 | Wisdom 2026-11-02 16:38 UTC+8。原文与决定正文在 PRD §9 和差异清单 §6.15。这里只记状态，不另写一套规则 | docs/backlog.md:226 |
| S82 |  | docs/backlog.md:227 |
| S83 | - 面壁 API 是已经写成面壁的能力的主路线。本地部署是第二路线：M0/M1 只留接口和 stub，不下载模型，不设本地推理门禁。标为推迟，不 | docs/backlog.md:228 |
| S84 | - M0 不再测本机模型。要测的是面壁 API 单篇耗时、单篇费用、失败率与重试，以及客户端内存（不含本地模型）。Key 不在时标「未核实」。 | docs/backlog.md:229 |
| S85 | - N-22：业务切片的门禁前提由已经在 CI 的 G6、pyright、gitleaks 满足。G1、G3、G5 仍是 M1 交付（Issue | docs/backlog.md:230 |
| S86 | - 同日 17:03：面壁 Jev 的托管 API 与本地部署在契约里都是一等。本地预留：`jev.route` 选 `local` 时可以完全 | docs/backlog.md:231 |
| S87 | - 同日 17:21：原文「Jev API 客户端提前到 M1，M6a 接进完整流程」。最小托管 API 客户端是 M1 交付，M0 测量用它； | docs/backlog.md:232 |
| S88 | 业务切片的 M1 门禁前提（RULES N-22，Wisdom 2026-11-02）由已经在 CI 运行的 G6（import-linter） | docs/ci-and-environment.md:15 |
| S89 |  | docs/ci-and-environment.md:16 |
| S90 | # PR #54 文档检查 | docs/evidence/54/commands.md:1 |
| S91 |  | docs/evidence/54/commands.md:2 |
| S92 | 日期：2026-11-02。本 PR 只改文档。没有截图。大文件：无。未改日志。 | docs/evidence/54/commands.md:3 |
| S93 |  | docs/evidence/54/commands.md:4 |
| S94 | 规格提交 SHA：`28edb4316147e501aa16bb9b66265a0bc9df3736` | docs/evidence/54/commands.md:5 |
| S95 |  | docs/evidence/54/commands.md:6 |
| S96 | Node：`v20.19.2`（PATH 前置 `/home/ubuntu/.nvm/versions/node/v20.19.2/bin`）。 | docs/evidence/54/commands.md:7 |
| S97 |  | docs/evidence/54/commands.md:8 |
| S98 | ／ 命令 ／ 退出码 ／ 备注 ／ | docs/evidence/54/commands.md:9 |
| S99 | ／ `corepack pnpm run check`（`65bab90`） ／ 0 ／ `check-pr-size`：203 行非生成 di | docs/evidence/54/commands.md:11 |
| S100 | ／ `corepack pnpm run check`（`28edb43`） ／ 0 ／ 含 lint、typecheck、typecheck: | docs/evidence/54/commands.md:12 |
| S101 | ／ `git diff --check`（相对 `origin/main`） ／ 0 ／ 无空白错误 ／ | docs/evidence/54/commands.md:13 |
| S102 | ／ AC 编号（一次性 Python，不入库） ／ 0 ／ PRD 定义 AC-01–AC-103，共 103 条，无缺号。M6a 退出条件写了 | docs/evidence/54/commands.md:14 |
| S103 | ／ 相对链接（一次性 Python，不入库） ／ 0 ／ 唯一报出的示例是 PRD AC-38 里本来就有的相对链接，目标文件名 x.md。本  | docs/evidence/54/commands.md:15 |
| S104 |  | docs/evidence/54/commands.md:16 |
| S105 | `test:core`：不适用（脚本尚未提供）。没有执行。 | docs/evidence/54/commands.md:17 |
| S106 |  | docs/evidence/54/commands.md:18 |
| S107 | 对照 N-10 / N-11：diff 不含 `DESIGN.md`、`docs/design-principles.md`、`docs/des | docs/evidence/54/commands.md:19 |
| S108 |  | docs/evidence/54/commands.md:20 |
| S109 | 证据提交 `94bd642ced1c3804dcdc784ee8986ac411bf5e74` 上再跑 `corepack pnpm run c | docs/evidence/54/commands.md:21 |
| S110 |  | docs/evidence/54/commands.md:22 |
| S111 | 规格提交 `37d946e80eac03ebf52762a5aabb44576337772e` 上跑 `corepack pnpm run ch | docs/evidence/54/commands.md:23 |
| S112 | ／ 2026-11-02 ／ [#54](https://github.com/wisdom-km/open-immerse-v2/pull/5 | docs/spec-changelog.md:11 |
| S113 | 状态：v0.6。当前版本仍是 v0.6，本文件不升这个号。变更指针：[spec-changelog.md](./spec-changelog.m | docs/v2-gap-and-changes.md:3 |
| S114 | 4. **Jev 不适合在 8 GB 目标设备本机运行**：官方最低要求是 NVIDIA ≥ 8–12 GB 显存或 Apple M 系列 ≥  | docs/v2-gap-and-changes.md:14 |
| S115 | 16. **处理路线**（Wisdom 2026-10-30 22:41、22:44、22:45，以 22:45 为准；23:55 续定）：四类 | docs/v2-gap-and-changes.md:26 |
| S116 | - **阅读顺序的输出（2026-10-30 复查 PaddleOCR `main@dab3fe3`，只读文档，没有运行模型）**：同一文件第  | docs/v2-gap-and-changes.md:116 |
| S117 | ／ Q9 ／ Jev 部署在哪？ ／ 设置主选项「本地 / API」，默认「API」；两者走同一个 `evaluate` 作业接口。API 服务 | docs/v2-gap-and-changes.md:327 |
| S118 | 原话要点：开发与最终用户一视同仁，每个由模型提供的能力（Jev 评分、引擎 B / MiniCPM-OCR、版面、多模态、OCR、翻译）有托管  | docs/v2-gap-and-changes.md:417 |
| S119 | ／ 本地选项 ／ 同一端口或同一种 worker 作业；两个来源跑同一份契约测试（M0/M1 本地侧跑 stub，§6.15）；「本地」在设置主 | docs/v2-gap-and-changes.md:422 |
| S120 | ／ M0 退出条件 ／ API 路径：经 Cursor Secrets 注入 `MODELBEST_API_KEY` 后对面壁 Jev API  | docs/v2-gap-and-changes.md:427 |
| S121 | ／ 版面部署 ／ 本地与自建远程 worker，同一 HTTP + SSE。没有已确认的托管版面 API，不编造服务商。与引擎 A 识别的「本地 | docs/v2-gap-and-changes.md:540 |
| S122 | Wisdom 批准 Forge 的四条建议。Q10 不重开：标准档仍是 PP-DocLayoutV3。plus-L 仍按 QM-13，不在本机  | docs/v2-gap-and-changes.md:579 |
| S123 | ／ 8 GB CPU 实测 ／ 2026-10-31 写成 M0 必测。2026-11-02 取代：不再在 8 GB 无独显 CPU 上测 PP | docs/v2-gap-and-changes.md:583 |
| S124 | ／ W-4 ／ 拆成两截。过渡默认：新安装与恢复默认的预设 id 是 `multimodal-layout`，不是空，也不要求用户先选一条。正式 | docs/v2-gap-and-changes.md:586 |
| S125 | ／ M0 单篇费用与耗时 ／ 同一批论文上，四个预设各记面壁 API 的单篇耗时、单篇费用、失败率与重试，以及客户端内存（不含本地模型）。单篇费 | docs/v2-gap-and-changes.md:594 |
| S126 | ### 6.15 面壁 API 为主路线、本地部署为第二路线（Wisdom 2026-11-02 16:38 UTC+8） | docs/v2-gap-and-changes.md:598 |
| S127 |  | docs/v2-gap-and-changes.md:599 |
| S128 | 原文：「面壁 API 是主路线对，然后本地部署是第二路线吧，就可能说只留有接口啥的，因为我不考虑本地部署了，那个我电脑带不动。」 | docs/v2-gap-and-changes.md:600 |
| S129 |  | docs/v2-gap-and-changes.md:601 |
| S130 | 面壁开放平台 API 是模型推理的主路线。规格里已经写成面壁的能力（Jev 的 `MiniCPM-OCR-Jev`、引擎 B 的 MiniCPM | docs/v2-gap-and-changes.md:602 |
| S131 |  | docs/v2-gap-and-changes.md:603 |
| S132 | 同日 17:03 UTC+8，只收窄上面「任何本机推理」对 Jev 的说法。原文：「就是这个JEV的模型啊，我考虑本地部署或者是接入API，这个 | docs/v2-gap-and-changes.md:604 |
| S133 |  | docs/v2-gap-and-changes.md:605 |
| S134 | 面壁模型 `MiniCPM-OCR-Jev`：托管 API 与本地部署在契约里都是一等。最小托管 API 客户端在 M1（`jev.route` | docs/v2-gap-and-changes.md:606 |
| S135 |  | docs/v2-gap-and-changes.md:607 |
| S136 | 同日 17:21 UTC+8。原文：「Jev API 客户端提前到 M1，M6a 接进完整流程」。最小的面壁 Jev 托管 API 客户端走提供 | docs/v2-gap-and-changes.md:608 |
| S137 |  | docs/v2-gap-and-changes.md:609 |
| S138 | ／ 项 ／ 决定 ／ 落点 ／ | docs/v2-gap-and-changes.md:610 |
| S139 | ／ 主路线 ／ 已写成面壁的能力继续走面壁 API。不新造面壁版面接口 ／ PRD §2、§3.5、§9；ARCH §7.0、§7.4、§16  | docs/v2-gap-and-changes.md:612 |
| S140 | ／ 第二路线 ／ 本地部署只留接口、契约和 stub。M0/M1 不实现、不下载模型、不设本地推理门禁。推迟，不删除 ／ PRD §3.5、§8 | docs/v2-gap-and-changes.md:613 |
| S141 | ／ M0 测量 ／ 面壁 API 单篇耗时、单篇费用、失败率与重试，以及客户端内存（不含本地模型）。单篇费用保留。程序用 M1 的最小 Jev  | docs/v2-gap-and-changes.md:614 |
| S142 | ／ N-22 与 #34 ／ G6、pyright、gitleaks 已在 CI，满足业务切片的门禁前提。G1、G3、G5 仍是 M1 交付，不 | docs/v2-gap-and-changes.md:615 |
| S143 | ／ Jev 契约 ／ 托管 API 与本地部署都是一等。最小托管 API 客户端在 M1，M6a 接入完整流程。键 `jev.route`。选  | docs/v2-gap-and-changes.md:616 |
| S144 |  | docs/v2-gap-and-changes.md:617 |
| S145 | ／ PP-DocLayoutV3 在 8 GB 内存、无独显、只用 CPU 的机器上的冷启动时间、单页耗时、峰值内存、是否 OOM ／ Wisd | docs/v2-gap-and-changes.md:635 |
| S146 | ／ PP-DocLayoutV2 开源输出的 `boxes` 按阅读顺序排列 ／ `layout_analysis.en.md` 第 25、18 | docs/v2-gap-and-changes.md:637 |
| S147 | ／ PP-DocLayoutV3 开源输出带阅读顺序 ／ 模型卡；MiniCPM-OCR SDK 取它的顺序（§2.2）；开源模块文档没写 ／  | docs/v2-gap-and-changes.md:638 |
| S148 | ／ Jev 在 Windows 上本机运行（官方部署文档只覆盖 Linux + NVIDIA 与 macOS） ／ MiniCPM-OCR `1 | docs/v2-gap-and-changes.md:646 |
| S149 | ／ 开发机配置 ／ Wisdom 2026-10-30 17:56 告知：32 GB 内存 + NVIDIA RTX 4070 12 GB 独显 | docs/v2-gap-and-changes.md:648 |
| S150 | ／ RTX 4070 12 GB 满足 Jev 官方显存要求 ／ 官方下限按后端：llama.cpp / Ollama ≥ 8 GB，vLLM  | docs/v2-gap-and-changes.md:649 |
| S151 | ／ 开发机上本地跑通 Jev（启动自检 + 参考样例三项 ≤ 0.02） ／ 官方 CUDA 路线只在 Linux + NVIDIA 上写明；l | docs/v2-gap-and-changes.md:650 |
| S152 | ／ 开发机上 Jev 的峰值显存与单批（64 项）耗时 ／ — ／ **不是 M0 项**（2026-11-02）。不记本地峰值显存、冷启动或是 | docs/v2-gap-and-changes.md:651 |
| S153 | ／ M0 的面壁 Jev API 实测（参考样例单项与批量、三项分数与参考值的差值、耗时、`usage`、国内站 base URL） ／ ARC | docs/v2-gap-and-changes.md:652 |
| S154 | ／ 四个预设在同一批论文上的面壁 API 单篇耗时、单篇费用、失败率与重试，以及客户端内存（不含本地模型） ／ PRD §8 M0（2026-1 | docs/v2-gap-and-changes.md:682 |
| S155 | ／ 版面两个部署设置、关掉版面时引擎 A 的识别、引擎 B、云 OCR 请求都为 0、过渡默认 `multimodal-layout`。本机版面 | docs/v2-gap-and-changes.md:702 |
| S156 | ／ M0 单篇费用与耗时、M3 真值表、显示链确认不引入矢量重绘（Wisdom 2026-10-31 13:14；机器与本机模型指标由 §6.1 | docs/v2-gap-and-changes.md:704 |
| S157 | ／ 面壁 API 为主路线、本地部署为第二路线（Wisdom 2026-11-02 16:38 UTC+8） ／ 本文 §6.15；PRD §2 | docs/v2-gap-and-changes.md:705 |
| S158 | ／ API 优先：每个模型能力默认托管 API、本地留在「本地 / API」、硬件只标可行性、开发机 Windows 上不要求本地、开发密钥只以 | docs/v2-gap-and-changes.md:708 |

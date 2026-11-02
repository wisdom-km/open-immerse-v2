# PR #54 自审

日期：2026-11-02。纯文档。UI–core 交接说明：不适用。

表对应提交 `600d05f92ca8a5f860be9ee2aea2233b685883bb` 相对 `origin/main` 的改动句（其后只加了本文件）。规则行的结论只写「遵守」或「违反」。S 行是改过的句子，结论是该句开头，全文在对应行。

| ID | 结论 | 文件:行 |
| --- | --- | --- |
| N-02 | 遵守 | README.md:30；docs/ci-and-environment.md:15 |
| N-10 | 遵守 | 未改 DESIGN.md、docs/design-principles.md、docs/design/** |
| N-11 | 遵守 | 未改 .cursor/environment.json、.cursor/install.sh |
| N-14 | 遵守 | PRD.md:558；docs/v2-gap-and-changes.md:594 |
| N-15 | 遵守 | PRD.md:560；docs/v2-gap-and-changes.md:610 |
| N-22 | 遵守 | RULES.md:160 |
| §7 | 遵守 | docs/spec-changelog.md:11 |
| §9 | 遵守 | docs/evidence/54/commands.md |
| S01 | 状态：v0.6，规格基线（唯一真相源之一）。当前版本仍是 v0.6，本文件不升这个号。变更指针：[docs/spec-changelog.md] | ARCHITECTURE.md:3 |
| S02 | W1["Python worker（本机）<br/>预处理 / 引擎 A / 引擎 B / Jev<br/>默认转发托管 API；选「本地」时本 | ARCHITECTURE.md:29 |
| S03 | - **API 优先**（Wisdom 2026-10-30 18:44，§7.0；2026-11-02 本地改为第二路线）：每个由模型提供的能 | ARCHITECTURE.md:66 |
| S04 | ／ `settings` ／ 非密钥设置、provider 配置、密钥引用绑定（预算上限的规则与存储在 `budget`，设置页只经 `wind | ARCHITECTURE.md:396 |
| S05 | 决定：开发与最终用户一视同仁，凡是由模型提供的能力（Jev 评分、引擎 B / MiniCPM-OCR、版面、多模态、OCR、翻译，以及同样依赖 | ARCHITECTURE.md:743 |
| S06 | 1. **默认 API。** 每个模型能力在设置里有一个「本地 / API」选择（`settings/domain/backend-choice | ARCHITECTURE.md:747 |
| S07 | 2. **本地是第二路线。** 两种来源仍是同一个端口或同一种 worker 作业。本地实现在 M0/M1 只留 stub，不写 `docs/d | ARCHITECTURE.md:748 |
| S08 | - **按服务商问一次，不是每一次请求都问。** 某个服务商第一次要收到数据前，弹一个对话框，列出当前选定把数据发给它的**全部**能力，每项写 | ARCHITECTURE.md:753 |
| S09 | ／ 版面（`layout` 作业；与下一行是两个设置，D-D，Wisdom 2026-10-31） ／ 没有已核实的托管版面 API。百度 AI | ARCHITECTURE.md:768 |
| S10 | - **引擎 A 的版面档位（Q10）**：标准档 = PP-DocLayoutV3，M3 起步即用；基准集另跑 PP-DocLayout_pl | ARCHITECTURE.md:935 |
| S11 | 决定（Q9，Wisdom 2026-10-30）：设置主选项是「本地 / API」，默认「API」，Jev 的 API 服务商是面壁开放平台（模 | ARCHITECTURE.md:1061 |
| S12 | **`jev.route`（Wisdom 2026-11-02 17:03）。** 键在 `settings/domain/backend-ch | ARCHITECTURE.md:1063 |
| S13 | ／ 本地 ／ 本机 worker（`127.0.0.1`） ／ `local_engine`：现在是 stub，不调用面壁 API；以后换成 l | ARCHITECTURE.md:1069 |
| S14 | 4. **未设上限。** 受限预算模式下，单价未知、又没有为该科目设次数类上限时，`reserve` 返回 `budget_cap_unset` | ARCHITECTURE.md:1251 |
| S15 | ／ `multimodal-layout` ／ 多模态+版面 ／ PP-DocLayout，部署不默认本机（本机只留 stub；Wisdom 2 | ARCHITECTURE.md:1559 |
| S16 | ／ `ocr-layout` ／ OCR+版面 ／ PP-DocLayout，部署不默认本机（本机只留 stub） ／ 引擎 A 的识别阶段；引 | ARCHITECTURE.md:1561 |
| S17 | 云 OCR 不在任何一个预设里默认打开（它是额外的付费来源，用户配好后加入识别列表）。四个预设的识别列表不改：`multimodal-only` | ARCHITECTURE.md:1564 |
| S18 | **部署（D-D，Wisdom 2026-10-31）。** 版面的「本地 / API」和引擎 A 识别阶段的「本地 / API」是两个设置。版 | ARCHITECTURE.md:1599 |
| S19 | **开发机上的本机 worker。** 开发机是 Windows + 32 GB 内存 + NVIDIA RTX 4070 12 GB（§7.0 | ARCHITECTURE.md:1909 |
| S20 | - 每个模型能力的「本地」与「API」两个来源跑同一份契约测试（假后端或去掉凭据与图片内容的录制样例）。M0/M1 里「本地」来源跑的是 stu | ARCHITECTURE.md:1999 |
| S21 | ／ 处理路线（2026-10-30 22:41、22:44、22:45；23:55 续定） ／ 四类积木加声明式组合，不写死 A/B/C。预设四 | ARCHITECTURE.md:2152 |
| S22 | ／ 版面本地实测（2026-10-31；测量要求由 2026-11-02 取代） ／ 当时写的是：依赖本地版面的生产说法之前，M0 必须在 8  | ARCHITECTURE.md:2153 |
| S23 | ／ Q9 ／ 设置主选项「本地 / API」，默认「API」，Jev 的 API 服务商是面壁开放平台；「本地」与 API 走同一个 `eval | ARCHITECTURE.md:2165 |
| S24 | ／ API 优先（2026-10-30 18:44） ／ 每个模型能力有托管 API 时默认 API，本地留在设置「本地 / API」里、与 A | ARCHITECTURE.md:2166 |
| S25 | ／ M0 费用与 M3 真值表（Wisdom 2026-10-31 13:14） ／ M0 增加单篇费用与单篇耗时：同一批论文、四个预设，给占位 | ARCHITECTURE.md:2179 |
| S26 | ／ 面壁 API 为主路线（Wisdom 2026-11-02 16:38 UTC+8） ／ 原文见 PRD §9 与差异清单 §6.15。面壁 | ARCHITECTURE.md:2180 |
| S27 | ／ Jev 两条路线（Wisdom 2026-11-02 17:03 UTC+8） ／ 原文见 PRD §9 与差异清单 §6.15。只收窄同日 | ARCHITECTURE.md:2181 |
| S28 | 状态：v0.6，规格基线（唯一真相源之一）。当前版本仍是 v0.6，本文件不升这个号。变更指针：[docs/spec-changelog.md] | PRD.md:3 |
| S29 | **API 优先**（Wisdom 2026-10-30 18:44，[ARCHITECTURE §7.0](./ARCHITECTURE.md | PRD.md:25 |
| S30 | 质量评估模型 Jev 的「API」由面壁开放平台托管（模型 `MiniCPM-OCR-Jev`，需要用户自己的面壁 API Key，价格**未核 | PRD.md:27 |
| S31 | 每个模型能力一个「本地 / API」选择（API 优先；「本地」是第二路线，M0/M1 只留同一接口上的 stub，§9，2026-11-02） | PRD.md:66 |
| S32 | ／ 质量评估（Jev） ／ 面壁开放平台 `MiniCPM-OCR-Jev` ／ worker 内 llama.cpp CUDA 构建首选，Ol | PRD.md:70 |
| S33 | - **版面。** PP-DocLayout 先切出正文、行内公式、行间公式、图、表并排好阅读顺序，每个区块带坐标，再裁成小图交给识别和翻译。版 | PRD.md:130 |
| S34 | - **预设**（Wisdom 2026-10-31，W-4）：正式全局默认等 M0 在同一批论文上对比四个预设的质量、面壁 API 单篇耗时、 | PRD.md:134 |
| S35 | #### 6.1.15 Jev 的两条路线（AC-103） | PRD.md:406 |
| S36 | 来自 Wisdom 2026-11-02 17:03。只约束面壁 Jev。PP-DocLayout 与其余非 Jev 的本机推理仍是第二路线（§ | PRD.md:408 |
| S37 | ／ 编号 ／ 标准 ／ 对应 ／ | PRD.md:410 |
| S38 | ／ AC-103 ／ Jev 两条路线同一契约（core 测试，M6a）：① `settings/domain/backend-choice.t | PRD.md:412 |
| S39 | ／ M0 规格基线 ／ 本 PR：PRD / ARCHITECTURE / RULES、v1 审查、差异清单、Loom 的 Markdown 阅 | PRD.md:490 |
| S40 | ／ M1 工程骨架与门禁 ／ monorepo、契约包（含 `latex-policy`、`budget` 的 `BudgetGate`、译文的 | PRD.md:491 |
| S41 | ／ M3 引擎 A 与 worker 协议 ／ 开工前核实百度 AI Studio PaddleOCR 托管 API 能否作为引擎 A 模型阶段 | PRD.md:493 |
| S42 | ／ M6a 质量评分与预算 ／ 开工前复核 Jev 锁定版本（Q1）与面壁 Jev 的接口文档、国内站 API 地址与价格（差异清单 §7）；把 | PRD.md:496 |
| S43 | - Q9 已决定（Wisdom 2026-10-30）：设置主选项是「本地 / API」，默认「API」；Jev 的 API 服务商是面壁开放平 | PRD.md:531 |
| S44 | - API 优先已决定（Wisdom 2026-10-30 18:44）：开发与最终用户一视同仁，每个由模型提供的能力（Jev、引擎 B / M | PRD.md:532 |
| S45 | - 处理路线（Wisdom 2026-10-30 22:41、22:44、22:45，后一条为准；23:55 续定）：不把 A / B / C  | PRD.md:546 |
| S46 | - 版面的两个开关、关掉版面时的引擎 A / 引擎 B / 云 OCR，以及过渡默认（Wisdom 2026-10-31）：① D-D：版面「本 | PRD.md:554 |
| S47 | - 2026-10-31 13:14（M0 费用、M3 真值表、显示链确认）：① M0 的单篇费用保留，用来给占位预算上限定标（N-14）。机器 | PRD.md:558 |
| S48 | - 面壁 API 为主路线、本地部署为第二路线（Wisdom 2026-11-02 16:38 UTC+8）原文：「面壁 API 是主路线对，然 | PRD.md:560 |
| S49 | - 面壁 Jev 的两条路线在契约里都是一等（Wisdom 2026-11-02 17:03 UTC+8）原文：「就是这个JEV的模型啊，我考虑 | PRD.md:562 |
| S50 | CI 跑已经接上的 ARCHITECTURE §13 门禁。哪些门禁在跑、哪些还没接、为什么不接，见 [docs/ci-and-environm | README.md:30 |
| S51 | 状态：v0.6，规格基线（唯一真相源之一）。Q1–Q12 已由 Wisdom 于 2026-10-30 全部决定；v0.2 加入许可证政策（Q6 | RULES.md:3 |
| S52 | - **两种来源同一套契约测试。** 有「本地 / API」两种来源的模型能力，两个来源跑同一份契约测试（假后端或去掉凭据与图片内容的录制样例） | RULES.md:101 |
| S53 | 14. 模型能力 API 优先（ARCHITECTURE §7.0）：新增或修改由模型提供的能力时，有托管 API 就默认 API。「本地」保留 | RULES.md:124 |
| S54 | ／ N-22 ／ 把 G1–G18 全部脚本落地当作新建 `packages/features/**` 业务切片的前提。业务切片的 M1 门禁前 | RULES.md:160 |
| S55 | 状态：索引。日期：2026-11-02（Asia/Shanghai）。 | docs/adr/README.md:3 |
| S56 | ／ Q9 ／ Jev 部署在本地还是 API ／ 差异清单 §6 的 Q9 行；ARCHITECTURE §16 的 Q9 行。2026-11- | docs/adr/README.md:31 |
| S57 | Q1–Q12 之后的决定（处理路线、API 优先、外发同意、Markdown、架构评审修复、PR C，2026-10-31 的 D-D、D-E、 | docs/adr/README.md:36 |
| S58 | 状态：v0.6。当前版本仍是 v0.6，本文件不升这个号。变更指针：[spec-changelog.md](./spec-changelog.m | docs/backlog.md:3 |
| S59 | ／ 阅读顺序实测：AI Studio 托管 API 是否带阅读顺序。PP-DocLayoutV2、V3 开源本机推理推迟，M0/M1 不下载、不 | docs/backlog.md:60 |
| S60 | ／ 本机 PP-DocLayout（含 8 GB CPU 上的冷启动、单页耗时、峰值内存、是否 OOM） ／ 推迟，不是 M0/M1 门禁（Wi | docs/backlog.md:78 |
| S61 | R-A 已由 Wisdom 于 2026-10-31 01:14 改标签解决。D-D、D-E 于同日决定。W-4 的过渡默认预设于同日定为 `m | docs/backlog.md:167 |
| S62 | ／ W-4 ／ 默认预设与识别源优先级 ／ 正式默认预设：① 继续不指定正式 id，等 M0。② 写成四个预设 id 中的一个（具体哪一个等这批 | docs/backlog.md:187 |
| S63 | ## 11. 2026-11-02 面壁 API 为主路线 | docs/backlog.md:223 |
| S64 | Wisdom 2026-11-02 16:38 UTC+8。原文与决定正文在 PRD §9 和差异清单 §6.15。这里只记状态，不另写一套规则 | docs/backlog.md:225 |
| S65 | - 面壁 API 是已经写成面壁的能力的主路线。本地部署是第二路线：M0/M1 只留接口和 stub，不下载模型，不设本地推理门禁。标为推迟，不 | docs/backlog.md:227 |
| S66 | - M0 不再测本机模型。要测的是面壁 API 单篇耗时、单篇费用、失败率与重试，以及客户端内存（不含本地模型）。Key 不在时标「未核实」。 | docs/backlog.md:228 |
| S67 | - N-22：业务切片的门禁前提由已经在 CI 的 G6、pyright、gitleaks 满足。G1、G3、G5 仍是 M1 交付（Issue | docs/backlog.md:229 |
| S68 | - 同日 17:03：面壁 Jev 的托管 API 与本地部署在契约里都是一等。先做 API。本地预留：`jev.route` 选 `local | docs/backlog.md:230 |
| S69 | 业务切片的 M1 门禁前提（RULES N-22，Wisdom 2026-11-02）由已经在 CI 运行的 G6（import-linter） | docs/ci-and-environment.md:15 |
| S70 | ／ 2026-11-02 ／ [#54](https://github.com/wisdom-km/open-immerse-v2/pull/5 | docs/spec-changelog.md:11 |
| S71 | 状态：v0.6。当前版本仍是 v0.6，本文件不升这个号。变更指针：[spec-changelog.md](./spec-changelog.m | docs/v2-gap-and-changes.md:3 |
| S72 | 4. **Jev 不适合在 8 GB 目标设备本机运行**：官方最低要求是 NVIDIA ≥ 8–12 GB 显存或 Apple M 系列 ≥  | docs/v2-gap-and-changes.md:14 |
| S73 | 16. **处理路线**（Wisdom 2026-10-30 22:41、22:44、22:45，以 22:45 为准；23:55 续定）：四类 | docs/v2-gap-and-changes.md:26 |
| S74 | - **阅读顺序的输出（2026-10-30 复查 PaddleOCR `main@dab3fe3`，只读文档，没有运行模型）**：同一文件第  | docs/v2-gap-and-changes.md:116 |
| S75 | ／ Q9 ／ Jev 部署在哪？ ／ 设置主选项「本地 / API」，默认「API」；两者走同一个 `evaluate` 作业接口。API 服务 | docs/v2-gap-and-changes.md:327 |
| S76 | 原话要点：开发与最终用户一视同仁，每个由模型提供的能力（Jev 评分、引擎 B / MiniCPM-OCR、版面、多模态、OCR、翻译）有托管  | docs/v2-gap-and-changes.md:417 |
| S77 | ／ 本地选项 ／ 同一端口或同一种 worker 作业；两个来源跑同一份契约测试（M0/M1 本地侧跑 stub，§6.15）；「本地」在设置主 | docs/v2-gap-and-changes.md:422 |
| S78 | ／ M0 退出条件 ／ API 路径：经 Cursor Secrets 注入 `MODELBEST_API_KEY` 后对面壁 Jev API  | docs/v2-gap-and-changes.md:427 |
| S79 | ／ 版面部署 ／ 本地与自建远程 worker，同一 HTTP + SSE。没有已确认的托管版面 API，不编造服务商。与引擎 A 识别的「本地 | docs/v2-gap-and-changes.md:540 |
| S80 | Wisdom 批准 Forge 的四条建议。Q10 不重开：标准档仍是 PP-DocLayoutV3。plus-L 仍按 QM-13，不在本机  | docs/v2-gap-and-changes.md:579 |
| S81 | ／ 8 GB CPU 实测 ／ 2026-10-31 写成 M0 必测。2026-11-02 取代：不再在 8 GB 无独显 CPU 上测 PP | docs/v2-gap-and-changes.md:583 |
| S82 | ／ W-4 ／ 拆成两截。过渡默认：新安装与恢复默认的预设 id 是 `multimodal-layout`，不是空，也不要求用户先选一条。正式 | docs/v2-gap-and-changes.md:586 |
| S83 | ／ M0 单篇费用与耗时 ／ 同一批论文上，四个预设各记面壁 API 的单篇耗时、单篇费用、失败率与重试，以及客户端内存（不含本地模型）。单篇费 | docs/v2-gap-and-changes.md:594 |
| S84 | ### 6.15 面壁 API 为主路线、本地部署为第二路线（Wisdom 2026-11-02 16:38 UTC+8） | docs/v2-gap-and-changes.md:598 |
| S85 | 原文：「面壁 API 是主路线对，然后本地部署是第二路线吧，就可能说只留有接口啥的，因为我不考虑本地部署了，那个我电脑带不动。」 | docs/v2-gap-and-changes.md:600 |
| S86 | 面壁开放平台 API 是模型推理的主路线。规格里已经写成面壁的能力（Jev 的 `MiniCPM-OCR-Jev`、引擎 B 的 MiniCPM | docs/v2-gap-and-changes.md:602 |
| S87 | 同日 17:03 UTC+8，只收窄上面「任何本机推理」对 Jev 的说法。原文：「就是这个JEV的模型啊，我考虑本地部署或者是接入API，这个 | docs/v2-gap-and-changes.md:604 |
| S88 | 面壁模型 `MiniCPM-OCR-Jev`：托管 API 与本地部署在契约里都是一等。先实现的是托管 API（M0/M1）；本地部署预留，现在 | docs/v2-gap-and-changes.md:606 |
| S89 | ／ 项 ／ 决定 ／ 落点 ／ | docs/v2-gap-and-changes.md:608 |
| S90 | ／ 主路线 ／ 已写成面壁的能力继续走面壁 API。不新造面壁版面接口 ／ PRD §2、§3.5、§9；ARCH §7.0、§7.4、§16  | docs/v2-gap-and-changes.md:610 |
| S91 | ／ 第二路线 ／ 本地部署只留接口、契约和 stub。M0/M1 不实现、不下载模型、不设本地推理门禁。推迟，不删除 ／ PRD §3.5、§8 | docs/v2-gap-and-changes.md:611 |
| S92 | ／ M0 测量 ／ 面壁 API 单篇耗时、单篇费用、失败率与重试，以及客户端内存（不含本地模型）。单篇费用保留。Cloud Agent 加 ` | docs/v2-gap-and-changes.md:612 |
| S93 | ／ N-22 与 #34 ／ G6、pyright、gitleaks 已在 CI，满足业务切片的门禁前提。G1、G3、G5 仍是 M1 交付，不 | docs/v2-gap-and-changes.md:613 |
| S94 | ／ Jev 契约 ／ 托管 API 与本地部署都是一等。先实现 API（M0/M1）。键 `jev.route`。选 `local` 时面壁 J | docs/v2-gap-and-changes.md:614 |
| S95 | ／ PP-DocLayoutV3 在 8 GB 内存、无独显、只用 CPU 的机器上的冷启动时间、单页耗时、峰值内存、是否 OOM ／ Wisd | docs/v2-gap-and-changes.md:633 |
| S96 | ／ PP-DocLayoutV2 开源输出的 `boxes` 按阅读顺序排列 ／ `layout_analysis.en.md` 第 25、18 | docs/v2-gap-and-changes.md:635 |
| S97 | ／ PP-DocLayoutV3 开源输出带阅读顺序 ／ 模型卡；MiniCPM-OCR SDK 取它的顺序（§2.2）；开源模块文档没写 ／  | docs/v2-gap-and-changes.md:636 |
| S98 | ／ Jev 在 Windows 上本机运行（官方部署文档只覆盖 Linux + NVIDIA 与 macOS） ／ MiniCPM-OCR `1 | docs/v2-gap-and-changes.md:644 |
| S99 | ／ 开发机配置 ／ Wisdom 2026-10-30 17:56 告知：32 GB 内存 + NVIDIA RTX 4070 12 GB 独显 | docs/v2-gap-and-changes.md:646 |
| S100 | ／ RTX 4070 12 GB 满足 Jev 官方显存要求 ／ 官方下限按后端：llama.cpp / Ollama ≥ 8 GB，vLLM  | docs/v2-gap-and-changes.md:647 |
| S101 | ／ 开发机上本地跑通 Jev（启动自检 + 参考样例三项 ≤ 0.02） ／ 官方 CUDA 路线只在 Linux + NVIDIA 上写明；l | docs/v2-gap-and-changes.md:648 |
| S102 | ／ 开发机上 Jev 的峰值显存与单批（64 项）耗时 ／ — ／ **不是 M0 项**（2026-11-02）。不记本地峰值显存、冷启动或是 | docs/v2-gap-and-changes.md:649 |
| S103 | ／ 四个预设在同一批论文上的面壁 API 单篇耗时、单篇费用、失败率与重试，以及客户端内存（不含本地模型） ／ PRD §8 M0（2026-1 | docs/v2-gap-and-changes.md:680 |
| S104 | ／ 版面两个部署设置、关掉版面时引擎 A 的识别、引擎 B、云 OCR 请求都为 0、过渡默认 `multimodal-layout`。本机版面 | docs/v2-gap-and-changes.md:700 |
| S105 | ／ M0 单篇费用与耗时、M3 真值表、显示链确认不引入矢量重绘（Wisdom 2026-10-31 13:14；机器与本机模型指标由 §6.1 | docs/v2-gap-and-changes.md:702 |
| S106 | ／ 面壁 API 为主路线、本地部署为第二路线（Wisdom 2026-11-02 16:38 UTC+8） ／ 本文 §6.15；PRD §2 | docs/v2-gap-and-changes.md:703 |
| S107 | ／ API 优先：每个模型能力默认托管 API、本地留在「本地 / API」、硬件只标可行性、开发机 Windows 上不要求本地、开发密钥只以 | docs/v2-gap-and-changes.md:706 |

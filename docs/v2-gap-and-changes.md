# v2 差异与修改清单

状态：v0.5。日期：2026-10-30（Asia/Shanghai）；上游查询时间 2026-10-29（UTC），Q3 / Q4 / Q9 相关补充查询与各服务商 API 格式查询 2026-10-30（§2.10）。Q1–Q12 已由 Wisdom 于 2026-10-30 全部决定（§6）；Markdown 阅读方案于 2026-10-30 17:32 批准（§6.1）；Loom 同日对译文区块四项风险给出结论（§6.2）；Wisdom 同日 18:37 决定 Jev 远程默认用面壁开放平台托管 API（§2.3.1），18:44 定下「API 优先」原则（§0 第 4 条、§2.4.1、§6.3），19:11 对四项风险作出决定（§6.4），19:30 把数据外发同意改为按服务商询问并加入「外发前询问」开关（§6.5），19:57 批准按[架构评审](./reviews/2026-10-30-architecture-review.md)修复：v0.4 修复 4 个 P0 并删除 G17（§6.6）；v0.5 修复 P1 项，并按 Wisdom 19:45、19:46 的要求新增服务商适配层（§0 第 13 条、§2.10、§6.7）。
用途：把三类输入——用户提供的双引擎方案（[附件原文](./architecture/inputs/pdf_translation_architecture.md)）、`docs/architecture/` 下的 01 / 02 / 03 草案、v1 实际实现（见 [v1 审查](./v1-review.md)）——与上游模型的官方资料逐条对照，列出**需要改的地方、冲突点、未核实的说法**，并给出统一编号的决策问题（Q1–Q12，现已全部决定）。
结论已写入根目录规格：[PRD.md](../PRD.md)、[ARCHITECTURE.md](../ARCHITECTURE.md)、[RULES.md](../RULES.md)。三份规格与本文冲突时以规格为准；本文记录「为什么这样改」。视觉与交互规格 [DESIGN.md](../DESIGN.md)、[docs/design-principles.md](./design-principles.md) 已于 2026-10-30 入库（v0.6）。下文仍写「待 Loom 产出」的表格行是当时的记录，不改写。

---

## 0. 结论先行

1. **五个模型名都真实存在**，没有编造的名称；但多数是近期发布，成熟度风险高：MiniCPM-OCR 仓库 2026-10-27 才创建（查询时公开约 2 天），Unlimited-OCR v2 同日发布，PP-DocLayoutV3 发布于 2026-01-20。实施时必须锁定提交与权重摘要。
2. **引擎 B 不是「一个模型端到端」**：MiniCPM-OCR 1.0 官方 SDK 是「PP-DocLayoutV3 版面 → 裁剪 → MiniCPM-OCR 1.0 识别 → 按序组装」的流水线；阅读顺序来自 PP-DocLayoutV3，不来自 OCR 模型。A 若也用 PP-DocLayoutV3，**A/B 的版面判断不独立**。Q10 已决定：A 以 V3 起步，plus-L 对照，明显更好时作为「高质量档」。
3. **Jev 的 0~1 分不是全部**：只有 `verdict = scored` 才是有效分；`precheck_reject`、`render_error`、`missing_original_image` 返回占位 0.0，`encode_error`、`forward_error` 返回 -1.0，都必须当作「错误」而不是「低分」，否则会误触发付费补救。默认阈值 0.5 只影响统计，不改原始分。
4. **Jev 不适合在 8 GB 目标设备本机运行**：官方最低要求是 NVIDIA ≥ 8–12 GB 显存或 Apple M 系列 ≥ 16 GB 统一内存；且只有 Docker 镜像（Linux + NVIDIA）的渲染环境与云 API 一致、分数可直接比较。Q9 已决定：设置主选项「本地 / API」，默认「API」，Jev 的 API 服务商是面壁开放平台；「本地」与 API 走同一个 worker 接口，本地首选 llama.cpp CUDA 构建；自建远程 worker 与 Jev Docker 在「高级」（§2.3.1）。「API 优先」原则（18:44）把它推广到所有模型能力：有托管 API 时默认 API，本地是同一接口后的一等选项（设置「本地 / API」），硬件只给「本地」标可行性（ARCH §7.0）。开发机是 Windows + 32 GB 内存 + RTX 4070 12 GB（Wisdom 2026-10-30 17:56 告知配置，18:44 告知系统）：开发走 API 路径；M0 的 API 路径实测于 19:11 决定延后，记「待执行」，不阻塞规格文档（§6.4）；Jev 与 MiniCPM-OCR 的官方部署文档都没有覆盖 Windows，开发机上的本地 Jev 与本地引擎 B 标「不要求 / 未核实」，本地实测可选。Q1 已决定：所有识别路径（含云 OCR、arXiv 对齐、多模态补救）都经 Jev 评分。
5. **PyMuPDF 是 AGPL-3.0 / 商业双许可**，附件和草案 03 把它定为统一预处理库；MiniCPM SDK 的 PDF 输入与 Unlimited-OCR 示例也依赖它。Q6 已决定：worker 预处理用 pypdfium2（BSD-3-Clause / Apache-2.0），由我们渲染页面图再以图片交给 MiniCPM SDK；项目许可证定为 Apache-2.0，禁止 GPL / AGPL 依赖。
6. **MinerU 许可证已不是 AGPL**，而是自定义的 MinerU Open Source License（Apache-2.0 加附加条款）；且 MinerU 3.0 起阅读顺序改由 PP-DocLayoutV2 给出，不再是「纯几何规则」。附件「借鉴 MinerU 几何规则」只能借思路，不能引入代码或依赖（RULES §1.5）。
7. **Unlimited-OCR 存在（MIT），但未见 bbox 输出**，是面向多页长文档的端到端模型，无法满足「点击段落跳回原文」的定位要求。Q12 已决定：不接入，上游支持坐标输出后再评估。
8. 草案 01 的多端 / 云 / 写作目录与里程碑、按层组织的目录、400 行「软门槛」与用户的新要求冲突，已在 ARCHITECTURE 中改为功能切片 + 硬上限，并把手机、同步移出 v2（Q3）；写作辅助移出 v2 实现，但在架构中预留 `writing` 切片（Q5）。
9. v1 的若干历史决定被新方案取代：「桌面智能版式只用 PP-DocLayoutV2、默认文字层原序」「多模态是公式第二层」「整页多模态替换」都不再沿用；「通顺试接」在 v1 中只有文档、没有代码，v2 需要新实现并定标。
10. **arXiv 源码校准公式进入 v2**（Q4 已决定）：新增 `formula-source` 切片，v1 的编号识别、限速下载、解包、TeX 解析、对齐与 KaTeX 闸门规则可复用（[v1 审查](./v1-review.md) §4.17）；源码候选同样经 Jev 与优先级链。
11. **不做 v1 数据迁移**（Q8 已决定）：v2 从零开始，v1 导入器与相关里程碑、验收全部删除，取舍见 PRD §3.2。
12. **UI 与业务核心解耦**（Q3 已决定）：Wisdom 追加的约束经调研后写入 ARCHITECTURE §2.1–§2.6、RULES §8，并由 CI G13–G16 检查；原 G17（UI 与 core 强制分 PR）已按架构评审删除（§6.6）。
13. **服务商适配层**（Wisdom 2026-10-30 19:45、19:46）：新包 `packages/providers` 按 API 格式写适配器、按服务商写注册表；新增一家服务商 = 一条注册表记录，格式没有时再加一个格式适配器，核心零改动；每个模型带能力标记（chat、vision、ocr、scoring、streaming），每个适配器跑契约测试（ARCH §7.9；PRD US-32、AC-64）。各家接口格式于 2026-10-30 按官方文档核实，没有做真实调用，未核实项见 §2.10。同一批修复架构评审的 P1 项（§6.7）。

## 1. 输入与核实方法

| 输入 | 位置 | 说明 |
| --- | --- | --- |
| 用户双引擎方案 | [inputs/pdf_translation_architecture.md](./architecture/inputs/pdf_translation_architecture.md) | 与上传附件逐字节一致（已 diff） |
| 需求对齐记录 | [architecture/README.md](./architecture/README.md) | 十五项确认 |
| 草案 01 / 02 / 03 | [01](./architecture/01_桌面多端与云端架构_草案.md)、[02](./architecture/02_数据协议与高精度规格迁移_草案.md)、[03](./architecture/03_双引擎与质量评估_草案.md) | 本 PR 不修改，降为历史输入 |
| v1 实现 | 旧仓库 `wisdom-km/open-immerse`，`main@96f1dfe` / `v0.3.0 = e9e00e4`，只读 clone | 结论见 [v1 审查](./v1-review.md) |

核实方式（只读）：

- GitHub：`gh api repos/<owner>/<repo>` 取创建时间、许可证、最新提交；MiniCPM-OCR 浅克隆于 `1269e4f`（2026-10-30 02:03 +08:00）逐行读文档与 SDK 源码。
- Hugging Face：`/api/models/<id>` 取参数量、许可证、创建时间。
- PyPI：`/pypi/<name>/json` 取版本与许可证元数据。
- Paddle、MinerU 官方文档：直接读取仓库内 Markdown。
- 「已核实」指**官方资料中存在该说法**；官方自测的精度、速度数字均未经第三方复现，统一列在 §7。

## 2. 模型与依赖核实

### 2.1 汇总

| 名称 | 是否存在 | 官方出处 | 许可证 | 实际是什么 | 与附件 / 草案说法的差异 |
| --- | --- | --- | --- | --- | --- |
| MiniCPM-OCR 1.0 | **已核实** | [OpenBMB/MiniCPM-OCR](https://github.com/OpenBMB/MiniCPM-OCR)（2026-10-27 创建）；HF `openbmb/MiniCPM-OCR-1.0`（2026-10-21 创建，1,300,434,160 参数） | Apache-2.0 | 区域识别 VLM；官方用法是 SDK 流水线（§2.2） | 附件称「端到端、含版面 + 阅读顺序」不准确：版面与顺序来自 SDK 调用的 PP-DocLayoutV3 |
| `minicpm-ocr` SDK | **已核实** | PyPI `minicpm-ocr` 1.0.3，导入名 `minicpmvocr` | Apache-2.0 | 版面 → 裁剪 → 识别 → 组装；可输出块级中间记录 | `pdf` extra 依赖 `PyMuPDF>=1.23`（许可证风险，§2.8） |
| MiniCPM-OCR Jev | **已核实** | HF `openbmb/MiniCPM-OCR-Jev`（约 2.21B）；同仓库 `docs/minicpm_ocr_jev_*.md` | Apache-2.0 | 「原图 + 候选文本 + 渲染图」二分类打分器，输出 `prob_yes` | 附件「打分 0~1」缺少错误占位与阈值语义；草案 03 §9 漏了 `precheck_reject`、`missing_original_image`（§2.3） |
| PP-DocLayoutV3 | **已核实** | HF `PaddlePaddle/PP-DocLayoutV3` 与 `_safetensors`（2026-01-20 创建），随 PaddleOCR 3.4.0 / PaddleOCR-VL-1.5 发布 | Apache-2.0 | 25 类、多点框、自带阅读顺序（§2.4） | 附件把它同时放在 A 和 B，未指出共享依赖；Paddle 文档自相矛盾（§2.4） |
| PP-FormulaNet_plus-L | **已核实** | PaddleOCR `docs/version3.x/module_usage/formula_recognition.en.md` | Apache-2.0 | 公式图 → LaTeX | 无冲突；体积与耗时偏大（§2.5） |
| PP-DocLayout-L / _plus-L | **已核实** | PaddleOCR `layout_detection.en.md` | Apache-2.0 | 版面检测；**不输出阅读顺序** | 附件「PP-DocLayout-L 或 V3」二选一的后果未说明（Q10） |
| PaddleOCR | **已核实** | [PaddlePaddle/PaddleOCR](https://github.com/PaddlePaddle/PaddleOCR) v3.7.0（2026-06-11） | Apache-2.0 | 引擎 A 的 OCR 兜底、表格模块来源 | — |
| Unlimited-OCR | **已核实** | [baidu/Unlimited-OCR](https://github.com/baidu/Unlimited-OCR)（2026-06-18 创建；v1 2026-06-22、v2 2026-10-27）；HF `baidu/Unlimited-OCR`、`-2`（约 3.34B） | MIT | 基于 DeepSeek-OCR 的多页长文档端到端模型（§2.6） | 未见 bbox 输出，不能作为阅读器引擎 |
| MinerU | **已核实** | PyPI `mineru` 4.1.2 | **MinerU Open Source License**（自定义） | 文档解析工具链（§2.7） | 不再是 AGPL；不再是纯几何排序 |
| PyMuPDF | **已核实** | PyPI `PyMuPDF` 2.0（2026-10-19） | **AGPL-3.0 或 Artifex 商业许可** | PDF 渲染与文字提取 | 附件与草案 03 §1、§3 把它定为统一预处理库 |
| pypdfium2 | **已核实**（仅元数据） | PyPI `pypdfium2` 5.14.0 | BSD-3-Clause / Apache-2.0（另含 PDFium 等依赖许可证，M1 需逐项复核） | PDFium 的 Python 绑定：渲染、文字与字符框 | 已采用，替代 PyMuPDF（Q6 已决定） |

### 2.2 MiniCPM-OCR 1.0（引擎 B）

- **流水线**（`docs/minicpm_ocr_1dot0_en.md:45-56`）：页面图 → PP-DocLayoutV3 检测区域并给出阅读顺序 → SDK 裁剪 → MiniCPM-OCR 1.0 逐区域识别 → 按顺序组装 Markdown。表格由 OTSL 转 HTML，公式为 LaTeX。
- **块级中间记录**（`sdk/minicpmvocr/pipeline/_layout_record.py`）字段：`block_id`、`label`、`bbox`、`regions`、`order`、`score`、`crop_filename`、`skip_vlm`。其中 `block_id` 与 `order` 是同一个运行内序号，**不能**当作 v2 的稳定块号（ARCHITECTURE §8：稳定块号由 `document` 切片生成）。
- **版面后端三选一**（`docs/minicpm_ocr_sdk_api_en.md:26`、`sdk/minicpmvocr/layouts/__init__.py:17`）：`ppdoclayout3_paddlex`、`ppdoclayout3_torch`（不需要 PaddlePaddle）、`ppdoclayout3_server`。v2 的 B 引擎建议用 `ppdoclayout3_torch`，避免与 A 的 Paddle 运行时挤在同一环境。
- **输入**：SDK 同时接受图片与 PDF（`sdk/minicpmvocr/pipeline/_inputs.py:50-90`）；PDF 路径在 `:94-97` 处 `import fitz`（PyMuPDF）。因此 v2 由 worker 预处理统一渲染页面图后以图片输入 SDK，**不安装** SDK 的 `pdf` extra，也不 fork SDK。
- **模型本身**：基于 MiniCPM-V 4.6 训练，SigLIP 视觉编码器 + Qwen3.5 语言模型，依赖 Transformers 5 的模型集成（`docs/minicpm_ocr_1dot0_en.md:38`）。HF 另有 `-gguf`、`-AWQ`、`-GPTQ` 等变体。
- **硬件与环境**（按 API 优先，引擎 B 默认用面壁文档解析 API，本地 SDK 是「本地」选项；开发机是 Windows，上游两个验证环境都不是 Windows，开发机上的本地引擎 B 标「不要求 / 未核实」）：vLLM 路线的命令在 RTX 5090 32 GB 上验证，要求 NVIDIA 驱动 ≥ 580（CUDA 13）、磁盘 ≥ 40 GB，其中 GPU 版 SDK 环境约 9 GB（CPU 版不到 1 GB）、vLLM 需从固定提交源码编译（`docs/minicpm_ocr_tutorial_en.md:17-20`）——只适合远程服务。llama.cpp b11901 的服务命令用官方 macOS ARM64 包验证，**未写具体芯片与内存**（`docs/llamacpp_deploy.md:23`）。这些都是「验证环境」，不是最低配置声明。
- **Metal 不等于整条流水线可用**：只有 llama.cpp Metal 推理服务还不够，完整解析还需要能跑 PP-DocLayoutV3 的 SDK 环境；PaddlePaddle 没有对应本机 wheel 时要换宿主（`docs/SKILL_en.md:24`）。SDK 的 Paddle 版面路线固定 `paddlex==3.4.2`（`docs/SKILL_en.md:49`），这也是 v2 选 `ppdoclayout3_torch` 的原因。
- **PDF 库旁证**：官方安装命令同时装 `pypdfium2>=4`，供根项目的版面依赖使用（`docs/SKILL_en.md:75`），说明 pypdfium2 已在上游依赖链中。
- **区域级重跑**：SDK 以页面为输入；只对某个区域重跑 B 意味着「跳过版面、只做识别」，需要适配器显式声明能力（ARCHITECTURE §7.3 `capabilities`）。

### 2.3 MiniCPM-OCR Jev（质量评估）

| 项 | 官方说法 | 出处（MiniCPM-OCR `1269e4f`） | v2 处理 |
| --- | --- | --- | --- |
| 输入 | 原区域图 + 候选文本 + 渲染图；`category` 只能是 `text` / `formula` / `table` | `docs/minicpm_ocr_jev_api_en.md:57` | 区域类别必须映射到这三类；图、页眉等不送评 |
| 输出 | `prob_yes`（0~1），以及每项 `verdict` | 同上 `:345-352` | 只有 `scored` 写入 `rawScore` |
| 错误占位 | `precheck_reject`、`render_error`、`missing_original_image` → 0.0；`encode_error`、`forward_error` → -1.0；其他非 `scored` 值也无效 | 同上 `:347-352` | 全部映射为 `EvaluationResult.status = error`，`detailCode` 分别为 `invalid_candidate`、`render_failed`、`missing_image`、`encode_failed`、`service_failed`、`unknown_verdict`；**不得**触发补救（PRD AC-05） |
| 阈值 | 默认 0.5，只影响 summary 的 `throughput_rate`，不改原始分 | 同上 `:51`、`:365-368` | 不沿用 0.5；按 text / formula / table 分别在校准集上定标（PRD QM-05） |
| 批量上限 | 每请求最多 64 个评分项 | 同上 `:28`、`:57` | worker / 适配器按 64 分批 |
| 图片编码 | 云 API 要求 `data:image/png;base64,` 前缀；Docker API 要求**不带**前缀，带了该项返回 `encode_error` | 同上 `:28`；`docs/minicpm_ocr_jev_docker_api_en.md:17` | 云（即面壁开放平台托管 API，§2.3.1）与 Docker 共用一个适配器 `jev_http`，但编码方式按配置切换，并有契约测试覆盖两种形态 |
| 渲染一致性 | Docker 镜像内置固定版本 Chromium 与 CJK 字体，渲染与云 API 一致，分数可直接与官方数值比较；SDK 部署的渲染器随宿主环境变化，排序稳定，绝对值可能在小数点后第三位不同。macOS 上**不支持**「渲染 + 评分」服务（固定字体环境依赖 `apt-get`），只能跑纯评分服务、由调用方自备渲染图，且分数不能与官方数值比较。Docker API 返回 `template_md5`，与训练模板不一致时分数不可比 | `docs/minicpm_ocr_jev_tutorial_en.md:28-32`、`docs/SKILL_jev_en.md:18-25`、`:96`、`:367`、`docs/llamacpp_deploy_jev_en.md:210`、`docs/minicpm_ocr_jev_docker_api_en.md:61` | 阈值按「部署方式 + 渲染环境」分别定标并记入 `evaluatorVersion`；不同部署的分数不混用；适配器在健康检查时记录 `template_md5`，变化即视为新的 `evaluatorVersion` |
| 硬件 | Docker：NVIDIA ≥ 12 GB、驱动 ≥ 535；vLLM：≥ 12 GB；llama.cpp / Ollama：NVIDIA ≥ 8 GB 或 M 系列 ≥ 16 GB 统一内存；SGLang：≥ 16 GB。CUDA 路线的平台都只写 Linux + NVIDIA | `docs/minicpm_ocr_jev_tutorial_en.md:17`、`docs/SKILL_jev_en.md:31`、`:86-91`、`:116`、`docs/vllm_deploy_jev_en.md:30`、`docs/llamacpp_deploy_jev_en.md:34`、`docs/ollama_deploy_jev_en.md:34`、`docs/sglang_deploy_jev_en.md:30` | Q9 已决定，18:44 按 API 优先调整：设置中选「本地 / API」，默认与推荐都是「API」（面壁开放平台）；硬件只给「本地」标可行性（达到 / 不在官方要求内；Windows 标「官方文档未覆盖」），用户随时可改；两者同一 worker `evaluate` 作业接口；自建 worker / Docker 在「高级」里（ARCH §7.0、§7.4） |
| 精度 | 宣称 JevOCRBench AUROC × 100 = 93.6 | 模型卡 | **未核实**（官方自测，§7） |

草案 03 §9 的总体判断（只有 `scored` 是有效分、错误不是低分、0.5 不适用于本产品）是正确的，本文只补全遗漏的两个 verdict、批量上限、图片编码差异与渲染一致性约束。

#### 2.3.1 面壁开放平台托管 API（Wisdom 2026-10-30 18:37 决定作为 Jev 远程默认；18:44 起是 Jev 与引擎 B 的默认来源）

上游文档里的「Cloud API」就是面壁开放平台的托管服务。以下按平台文档（2026-10-30 查阅）与上游仓库（`1269e4f`）对照；本 PR 没有调用真实服务。

| 项 | 平台文档的说法 | 出处 | v2 处理 |
| --- | --- | --- | --- |
| 端点与站点 | `POST https://api.modelbest.ai/v1/chat/completions`，OpenAI 兼容；`GET /v1/models` 列出 Key 可用的模型 | [平台 ocr-jev 文档](https://platform.modelbest.ai/console/docs/api/ocr-jev)（页面标注更新于 2026-10-29） | 国际站地址写明；base URL 做成配置项（ARCH §7.4「面壁 API」） |
| 国内站 | 控制台 platform.modelbest.cn 的模型列表能看到 `MiniCPM-OCR-Jev`（Wisdom 告知）；上游仓库文档写 `https://api.modelbest.cn/v1` | MiniCPM-OCR `1269e4f` 的 `docs/minicpm_ocr_jev_api_en.md:11` | 国内站 API 地址**未核实**（§7）；预置但标「未核实」 |
| 请求 | `model: "MiniCPM-OCR-Jev"`；顶层 `minicpm_ocr_jev{ mode: score / score_best / score_best_batch, category: text / formula / table, threshold, candidates, items }`；图片 PNG / JPEG 的 Base64 或 data URI；批量时 `messages` 也要放图和文本，否则 400 `moderation_invalid_input`；`stream: false`，不支持 SSE；单请求 ≤ 64 项 | 同上 | v2 只用 `mode: score`；`score_best*` 在全部候选失败时仍返回 `best_index: 0`，选哪个候选由 core 的优先级链决定（ARCH §7.5） |
| 响应 | `choices[0].message.content` 是 JSON 字符串；`usage.prompt_tokens` 在顶层 | 同上 | 二次解析；用量进预算账本 |
| 错误 | HTTP 400 / 401 / 402 / 403 / 404 / 413 / 422 / 429 / 5xx | 同上 | 映射表见 ARCH §7.4「面壁 API」；401 / 402 / 403 记 `unavailable`，不触发补救（PRD AC-05、AC-59） |
| 价格 | 平台没有给 Jev 标价 | 同上 | **未核实**；按 `usage` 记账，单价由用户填，否则显示「未知」 |
| 文档解析（引擎 B 的默认 API 来源） | `POST /v1/document-parse`（同步，单图：`image` / `file_id` / `url`）；PDF 走异步 `/jobs`；`model` 默认 `MiniCPM-OCR-1.0`；鉴权 `Authorization: Bearer ${MODELBEST_API_KEY}`；`upright` 默认 `true`（自适应旋转，坐标改到旋转后的页面）；`ocr.blocks[]` 含 `order`、`label`、`bbox`、`regions`、`content`、`status`（`ok` / `failed` / `skipped_no_vlm` / `skipped_seal`），像素坐标、左上原点；`rotation{ enabled, applied, total_angle }`；图片 ≤ 24 MiB，同步 JSON 体 ≤ 32 MiB，PDF ≤ 500 页；同时最多 2 个活动任务；只按上游返回的用量按页计，缺用量记未知；平台控制台显示限时免费（Wisdom 告知；文档只提到「free trials」按异步任务计数）；页面声明只描述已实现的契约，不证明生产部署或线上连通 | [平台 document-parse 文档](https://platform.modelbest.ai/console/docs/api/document-parse)（页面标注更新于 2026-10-27） | 只用同步接口发页面图，带 `upright: false`，不上传 PDF（与 Q6「由我们渲染页面图」一致，坐标帧也只有一个）；长期价格**未核实**；托管流水线是否与 SDK `1269e4f` 相同**未核实**，对比视图按「版面可能同源」标注（ARCH §7.1） |
| Key | 一个平台 Key 同时用于 Jev 与文档解析（两份文档的鉴权相同） | 同上 | 环境变量名 `MODELBEST_API_KEY`，只放 Cursor Secrets 或用户本机安全存储，绝不进仓库（Wisdom 2026-10-30 18:37；RULES N-05）；开发与测试只从 Cursor Secrets 注入的环境变量读取，不用 `.env`，CI 不调用（ARCH §15.4） |

### 2.4 PP-DocLayoutV3 与版面模型选择

| 模型 | 类别数 | 框 | 阅读顺序 | 备注 |
| --- | --- | --- | --- | --- |
| PP-DocLayoutV3 | 25 | 多点框 | **有**（模型自带） | 引擎 B 的 SDK 固定使用 |
| PP-DocLayoutV2 | 25 | 矩形 | 有（pointer network） | MinerU 3.0+ 与 v1 的「智能版式」规划用它 |
| PP-DocLayout_plus-L | 20 | 矩形 | 无 | 与 B 独立 |
| PP-DocLayout-L / M / S | 23 | 矩形 | 无 | 早期系列 |

- Paddle 官方文档自相矛盾：`docs/version3.x/module_usage/layout_analysis.en.md` 第 25 行写「only supports PP-DocLayoutV2」，同一文件第 100–115 行的 CLI 示例与测速表却使用 V3；PaddleOCR-VL 的部署配置 `deploy/paddleocr_vl_docker/pipeline_config_vllm.yaml` 也写 `model_name: PP-DocLayoutV3`。实施时以锁定版本的实际行为为准，并在 M3 做一次实测。
- PP-DocLayoutV3 面向弯曲、倾斜、翻拍等真实拍摄场景，单次前向同时输出多点框与阅读顺序。模型卡称对应论文 RT-DocLayout（arXiv:2606.23344）已被 ECCV 2026 接收——**未核实**。
- PP-StructureV3 的阅读顺序用规则算法 `xycut_enhanced`（PaddleX `layout_parsing/pipeline_v2.py`），默认版面模型是 PP-DocLayout_plus-L；PaddleOCR-VL 则直接用 V2 / V3 模型预测的顺序。前者与 v2「引擎 A 自写阅读顺序」的思路一致，可作为对照实现。
- **A/B 共享依赖**：附件让 A 选「PP-DocLayout-L 或 PP-DocLayoutV3」，B 内部固定用 V3。A 若选 V3，两条分支的版面判断同源，A/B 一致不能当作「两个专家互相印证」。草案 03 §2 已指出这一点；ARCHITECTURE §7.1 已写入。Q10 已决定：A 以 V3 起步（对比时标注「版面同源」），基准另跑 plus-L 对照，明显更好时作为「高质量档」供用户选择（判据见 PRD QM-13）。
- A 即使用 V3，也只把模型给出的顺序作为「候选 / 对照证据」，正式顺序由项目自写算法给出并版本化（草案 03 §2 的要求保留）。

#### 2.4.1 引擎 A 模型阶段的托管候选与 Windows 本地（API 优先，Wisdom 2026-10-30 18:44）

按 API 优先，引擎 A 的模型阶段（版面、公式识别、OCR 兜底、表格）也要找托管 API。目前找到的候选是百度 AI Studio 的 PaddleOCR 托管 API；它是否能用，M3 开工前核实，核实通过才出现在选项里。Wisdom 2026-10-30 19:11 决定：引擎 A 的三条路径——托管 API（核实通过后）、本地部署、租用的 Linux 远程 worker——都保留可选，M3 开工前定最终选择（默认值与开发用的路径）（ARCH §7.0、§6.4）。本 PR 没有调用该服务。

| 项 | 官方说法 | 出处 | v2 处理 |
| --- | --- | --- | --- |
| 接口 | 异步任务：`POST https://paddleocr.aistudio-app.com/api/v2/ocr/jobs` 提交，`GET /api/v2/ocr/jobs/{jobId}` 查询，结果是 `resultUrl.jsonUrl` 指向的 JSONL；鉴权 `Authorization: Bearer {access_token}` | [异步 API 使用文档](https://ai.baidu.com/ai-doc/AISTUDIO/fml7mozw5)（更新时间 2026-02-04）；[英文版](https://ai.baidu.com/ai-doc/AISTUDIO/Mml7n69e7) | worker 内 `modular_a/backends/aistudio_api.py`（ARCH §10.3）；凭据按作业请求头传入；开发变量名暂定 `PADDLEOCR_ACCESS_TOKEN`（ARCH §15.4） |
| 可选模型 | `PaddleOCR-VL-1.5`、`PaddleOCR-VL`、`PP-StructureV3`、`PP-OCRv5` | 同上（示例代码注释） | 与本地 A 的标准档 PP-DocLayoutV3 / 高质量档 plus-L 如何对应**未核实**（Q10） |
| 输出 | 示例代码只取每页 `layoutParsingResults[].markdown`（文字与图片），文档没有写区域框字段 | 同上 | 我们需要区域框、类别与公式 LaTeX 才能对齐文字层与坐标帧；托管结果能否给出这些**未核实**，给不出时不能作为 A 的来源 |
| 限制 | 单次最多 1000 页 PDF；文件 URL ≤ 200 MB，本地上传 ≤ 50 MB；错误码 12001 每日页数上限（HTTP 403）、12002 频率过高（HTTP 429） | 同上 | 我们只发渲染好的页面图，不上传 PDF（Q6，与面壁一致）；单张图是否接受、每日配额与价格**未核实** |
| 版本 | 文档没有写模型版本锁定方式 | 同上 | **未核实**；不能锁定版本时，结果的 `ParseRun` 只能记「服务端版本未知」，分数与基准不可复现 |

Windows 本地（开发机）：Paddle 3.3 官方提供 Windows 的 pip 安装包，GPU 版有 CUDA 11.8 / 12.6 / 12.9 三种，要求 GPU 计算能力高于 7.5（[Windows 下的 PIP 安装](https://www.paddlepaddle.org.cn/documentation/docs/zh/3.3/install/pip/windows-pip.html)，2026-10-30 查阅）。这只说明框架能装，PaddleOCR / PaddleX 整条版面与公式流水线在 Windows 上**未实测**；按 API 优先，开发机上的本地引擎 A 模型阶段「不要求 / 未实测」。引擎 A 目前没有已确认的托管 API；按 19:11 的决定，开发用哪条路径（托管 API、开发机本地、租用的 Linux 远程 worker）随 M3 前的最终选择一起定（§6.4、§7）。

### 2.5 PP-FormulaNet 系列

五个型号在 HF 均有 `PaddlePaddle/<名称>` 仓库，均为 Apache-2.0。官方表（`docs/version3.x/module_usage/formula_recognition.en.md`，官方自测，硬件以表注为准）：

| 型号 | En-BLEU | Zh-BLEU | GPU 耗时（ms） | 大小（MB） |
| --- | --- | --- | --- | --- |
| PP-FormulaNet-S | 87.00 | 45.71 | 182 | 224 |
| PP-FormulaNet-L | 90.36 | 45.78 | 1482 | 695 |
| PP-FormulaNet_plus-S | 88.71 | 53.32 | 179 | 248 |
| PP-FormulaNet_plus-M | 91.45 | 89.76 | 1040 | 592 |
| PP-FormulaNet_plus-L | 92.22 | 90.64 | 1476 | 698 |

- plus-M、plus-L 增加中文公式支持，最大预测 token 从 1,024 提到 2,560，适合复杂公式；plus-S 侧重英文公式（同文第 59 行）。
- **模块默认是 plus-M**：`FormulaRecognition(model_name=None)` 时使用 PP-FormulaNet_plus-M（同文第 199 行），官方示例也用 plus-M（第 155 行）。附件写的 plus-L 是最高精度档，不是默认档。
- 同文第 221 行列出推理引擎 `paddle_static`（默认）、`paddle_dynamic`、`transformers` 等；`transformers` 引擎是否覆盖 PP-FormulaNet、能否让引擎 A 摆脱 PaddlePaddle 运行时，**未核实**，M3 实测。
- v2 处理：型号不写死；远程服务默认 plus-L，本机默认 plus-M（与上游默认一致），英文为主的低配场景可选 plus-S；最终档位以基准集的公式结构准确率与耗时定标（PRD QM-03、QM-07）。

### 2.6 Unlimited-OCR

- 存在且开源（MIT）。基于 DeepSeek-OCR 的端到端多页长文档模型（核心是 SR-SWA 注意力，论文 arXiv:2606.23050）；部署走 Transformers `trust_remote_code`（会执行模型仓库里的 Python 代码）或定制 SGLang wheel，官方在 A800-80GB 上测试；示例代码用 PyMuPDF 1.27.2.2 读 PDF。README 链接的 `UnlimitedOCR1.0` 实际是 tag，不是分支。
- 公开资料中**未见 bbox / 区域坐标输出**，不满足「译文段落点击跳回原文」「笔记锚点」「区域级补救」的定位要求。
- v1 的历史规划曾想接「百度托管文档解析（Unlimited-OCR）」（见 [v1 审查](./v1-review.md) §4.5），已被双引擎方案取代。Q12 已决定：不接入；上游支持坐标输出后再评估。

### 2.7 MinerU

- 许可证：PyPI 元数据为 `LicenseRef-MinerU-Open-Source-License`，即 Apache-2.0 加附加条款：月活超 1 亿或月收入超 2000 万美元需商业许可、提供在线服务须署名、违约自动终止。**不在** RULES §1.5 白名单内。
- 许可证在 2026 年内反复变更（`LICENSE.md` 提交记录，已用 `gh api` 复核）：03-20 AGPL-3.0 → Apache-2.0，03-28 改回 AGPLv3，04-14 → Apache-2.0，04-17 → MinerU OSL。各版本以发布时的 LICENSE 为准：2026-04-14 之前的大部分版本（包括 03-29 发布的 3.0.0）是 AGPL-3.0。
- 阅读顺序：0.9.0（2024-10-31）起用 LayoutReader（权重为 CC-BY-NC-SA 4.0，非商用）；3.0.0（2026-03-29）移除 LayoutReader 以及 AGPL 的 doclayoutyolo、mfd_yolov8，现在由 PP-DocLayoutV2 的模型输出给出顺序（`mineru/model/layout/pp_doclayoutv2.py`）。当前 PDF 库是 pypdfium2。附件「借鉴 MinerU 的几何规则思路」对应的是旧版本思路。
- v2 处理：只借鉴思路，不引入 MinerU 任何版本的代码、权重或依赖（旧版有 AGPL 与非商用权重风险，新版有自定义条款）；需要模型排序时直接用 Apache-2.0 的 PP-DocLayoutV2 / V3，需要规则排序时参考 PaddleX `xycut_enhanced`；v1 已有的 `lib/pdf-flow-join.js` 跨栏 / 跨页续接规则（MinerU 式，[v1 审查](./v1-review.md) §4.13）是可直接移植的自有资产。

### 2.8 PDF 库许可证

| 用途 | 附件 / 草案 | 风险 | v2 建议 |
| --- | --- | --- | --- |
| worker 预处理（文字层检测、页面渲染、字符框） | PyMuPDF | AGPL-3.0：随桌面分发或作为网络服务提供时有源码公开义务；或购买 Artifex 商业许可 | 只用 pypdfium2；PyMuPDF 禁止引入（Q6 已决定） |
| MiniCPM SDK 的 PDF 输入 | SDK `pdf` extra → PyMuPDF | 同上 | 不装 `pdf` extra，以图片输入 SDK |
| Unlimited-OCR 示例 | PyMuPDF | 同上 | 不接入（Q12） |
| 桌面阅读与文字层基础档 | — | — | `pdfjs-dist`（Apache-2.0） |

- Q6 已决定：项目许可证为 Apache-2.0（根目录 `LICENSE`，版权人 wisdom-km），RULES §1.5 禁止 GPL / AGPL 依赖，PyMuPDF 不能以任何方式引入，包括经 MiniCPM SDK `pdf` extra 间接引入。
- PyMuPDF 2.0 新增的 Office 相关能力需另购许可，与本项目无关，不展开。
- 换库的代价：草案 02 §5 的坐标合同按 PyMuPDF 写；换成 pypdfium2 后，`CoordinateFrame.renderer` 记录实际库名与版本，旋转 / CropBox 的矩阵需在 M3 对 0 / 90 / 180 / 270 度与非零 CropBox 重新验证（草案 02 §5 的测试要求保留）。

### 2.9 成熟度与锁定

| 项 | 公开时间（查询时） | 风险 | 要求 |
| --- | --- | --- | --- |
| MiniCPM-OCR 仓库 / SDK 1.0.3 | 2026-10-27 创建，约 2 天 | 接口、字段、部署脚本可能快速变化；官方基准雷达图自注「some values remain to be confirmed」（`docs/minicpm_ocr_1dot0_en.md:131`） | 锁定仓库提交（当前 `1269e4f`）、SDK 版本、权重 sha256；M6 开工前复核一次 |
| MiniCPM-OCR-1.0 / Jev 权重 | 2026-10-21 起 | 同上 | 记入 worker `runtime/` 模型清单 |
| Unlimited-OCR-2 | 2026-10-27 | 不接入 | — |
| PP-DocLayoutV3 | 2026-01-20 | Paddle 文档矛盾 | 锁定 PaddleOCR / PaddleX 版本，M3 实测 |

### 2.10 服务商 API 格式（Wisdom 2026-10-30 19:45、19:46）

查阅时间 2026-10-30（Asia/Shanghai）。只读官方文档，**没有做真实调用**（真实调用的实测已延后，§6.4）；「已确认」的含义同 §1，指官方文档这样写。规格里的格式与服务商表在 ARCH §7.9.6，本节记来源与页面日期。「页面日期」是页面自己标注的更新时间；本次没有记下日期的写「未记录」。百度 OCR 的部分页面本次抓取超时，相关内容以鉴权页与 §7.7 已有记录为准。

| 服务商 / 格式 | 官方文档（页面日期） | 已确认 | 未核实 |
| --- | --- | --- | --- |
| OpenAI / `openai-chat` | [Chat Completions](https://platform.openai.com/docs/api-reference/chat/create)（未记录） | `POST https://api.openai.com/v1/chat/completions`，`Authorization: Bearer`；图片 `image_url`（URL 或 data URI）；流式 SSE 以 `data: [DONE]` 结束，设 `stream_options.include_usage` 时结束前多一个用量块 | 预置模型与单价（实现时按当时文档填写） |
| Anthropic / `anthropic-messages` | [Messages](https://docs.claude.com/en/api/messages)、[概览](https://docs.claude.com/en/api/overview)（未记录） | `POST https://api.anthropic.com/v1/messages`；`Authorization: Bearer`，`x-api-key` 是仍受支持的旧写法；必须带 `anthropic-version`（文档示例 `2026-10-21`）；未限定工作区的 Key 还要带 `anthropic-workspace-id`；图片块 `source.type: "base64"`；流式事件 `message_start`、`content_block_delta`、`message_delta`、`message_stop`；过大返回 413 `request_too_large`；响应头 `request-id` | 锁定哪个 `anthropic-version` |
| Google Gemini / `gemini-generate-content` | [generateContent](https://ai.google.dev/api/generate-content)（未记录）、[API Key](https://ai.google.dev/gemini-api/docs/api-key)（2026-10-27）、[OpenAI 兼容](https://ai.google.dev/gemini-api/docs/openai)（未记录） | `POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`；流式 `:streamGenerateContent?alt=sse`；请求头 `x-goog-api-key`；图片 `inline_data`；用量 `usageMetadata`；Key 页面写明 2026-05-28 起新建的是鉴权 Key、未加限制的标准 Key 会被拒绝，闲置的未限制 Key 自 2026-05-07 起被封；OpenAI 兼容端点的 Base URL 是 `https://generativelanguage.googleapis.com/v1beta/openai/` | 兼容端点与原生端点在用量与错误体上的差异；默认用原生格式，兼容端点为备选（Wisdom 2026-10-30 20:57） |
| 百度千帆 v2（文心）/ `openai-chat` | [视觉理解](https://cloud.baidu.com/doc/qianfan-api/s/rm7u7qdiq)（2026-02-09）；文本生成页（看到的更新日期 2026-09-29，当前地址**未核实**，不链接） | `POST https://qianfan.baidubce.com/v2/chat/completions`，`Authorization: Bearer` 加千帆 API Key（形如 `bce-v3/…`）；`image_url` 收 URL 或 data URI，单图 ≤ 10 MB；错误体 `{code, message, type}`；响应头带 `X-Ratelimit-*` | `detail` 与 `stream_options.include_usage` 的逐模型支持清单 |
| 百度智能云文字识别 / `baidu-ocr` | [高精度含位置版](https://cloud.baidu.com/doc/OCR/s/tk3h7y2aq)（未记录）、[接口说明](https://cloud.baidu.com/doc/OCR/s/7kibizyfm)（2024-01-26）、[鉴权](https://ai.baidu.com/ai-doc/REFERENCE/Ck3dwjhhu)（2025-01-20） | `POST https://aip.baidubce.com/rest/2.0/ocr/v1/accurate`（或 `accurate_basic`），表单字段 `image`；`access_token` 放查询参数，由 `POST https://aip.baidubce.com/oauth/2.0/token`（`grant_type=client_credentials`）换取，有效期 30 天；鉴权文档列出 access_token、API Key、AK/SK 签名三种方式 | API Key 方式用于 OCR 时的请求头写法；现在用 access_token，API Key 方式核实后加入（Wisdom 2026-10-30 20:57） |
| 智谱 GLM / `openai-chat` | [对话补全](https://docs.bigmodel.cn/api-reference/%E6%A8%A1%E5%9E%8B-api/%E5%AF%B9%E8%AF%9D%E8%A1%A5%E5%85%A8)（未记录） | `POST https://open.bigmodel.cn/api/paas/v4/chat/completions`，Bearer；流式以 `[DONE]` 结束 | 预置模型与单价 |
| 智谱 GLM-OCR / `zhipu-layout-parsing` | [文档解析](https://docs.bigmodel.cn/api-reference/%E6%A8%A1%E5%9E%8B-api/%E6%96%87%E6%A1%A3%E8%A7%A3%E6%9E%90)（未记录） | `POST https://open.bigmodel.cn/api/paas/v4/layout_parsing`，`model: "glm-ocr"`；单图 ≤ 10 MB，PDF ≤ 50 MB、≤ 100 页 | OpenAPI 定义为 Bearer，指南示例的 `Authorization` 不带 `Bearer` 前缀，哪种写法被接受 |
| 百度 AI Studio PaddleOCR / `paddleocr-aistudio-jobs`（worker 侧，候选） | 见 §2.4.1（2026-02-04） | 异步任务提交与查询；`Authorization: bearer`；错误 12001（每日页数上限）、12002（限流） | 见 §2.4.1 与 §7 |
| 面壁开放平台 / `modelbest-jev`、`modelbest-document-parse`（worker 侧） | 见 §2.3.1（ocr-jev 页 2026-10-29，document-parse 页 2026-10-27） | 见 §2.3.1 | 见 §2.3.1 与 §7 |
| 本机 Ollama / llama.cpp server / `openai-chat` | — | 「本地」就是 Base URL 在回环地址上的 `openai-chat` 服务商（ARCH §7.9.5 第 7 条） | 各本地服务对 `image_url` 与 `include_usage` 的支持，接入时核对 |

由此得出的规格（ARCH §7.9）：

- OpenAI、智谱 GLM、千帆 v2、Gemini 兼容端点与本机服务共用 `openai-chat` 一个适配器，各自只是一条注册表记录；需要单独适配器的只有 Anthropic、Gemini 原生、百度 OCR、智谱文档解析，以及 worker 侧的三种格式。
- Key 只放请求头：Gemini 用 `x-goog-api-key`，不用 `?key=`。百度 OCR 的 `access_token` 是唯一放在 URL 里的凭据，由 main 换取并缓存，日志里打码。
- 各家的错误体与 HTTP 状态只在各格式的 `errors.ts` 里映射到 `ProviderFailure`（架构评审 P1-8）。

## 3. 附件（用户双引擎方案）需修改处

| 附件位置 | 原说法 | 核实 / 冲突 | 改为 | 写入 |
| --- | --- | --- | --- | --- |
| §1 输入层 | 用 PyMuPDF 打开 PDF、检测文字层、渲染页面 | AGPL 风险（§2.8） | worker 预处理用 pypdfium2（Q6 已决定）；文字层检测按页、可信度按区域判断（草案 03 §3） | ARCH §7.1、§10.3；Q6 |
| §1 输入层 | 渲染 300 DPI 左右 | 合理起点，非常量 | 作为配置，按模型输入限制、清晰度、内存定标 | PRD QM-06 / QM-07 |
| §2 分支 A | 版面用 PP-DocLayout-L 或 PP-DocLayoutV3 | 二者能力不同（§2.4）；选 V3 则与 B 共享依赖 | Q10 已决定：V3 起步，对比时标注共享依赖；基准另跑 plus-L 对照，明显更好时作为「高质量档」 | ARCH §7.1；Q10 |
| §2 分支 A | 阅读顺序自己写，借鉴 MinerU 几何规则 | MinerU 已改用模型排序、许可证非白名单（§2.7） | 自写算法版本化；借鉴 v1 `pdf-flow-join.js` 与 PP-StructureV3 `xycut_enhanced` 思路；「通顺试接」作为新实现 | ARCH §10.3 `reading_order/`；v1 审查 §4.13 |
| §2 分支 A | 表格「可选」转 Markdown | 合并单元格、跨页表格范围未定 | 首版保留表格结构候选 + 原图；复杂结构在 Markdown 导出时声明降级 | PRD S2；ARCH §7.2 |
| §3 分支 B | MiniCPM-OCR 1.0 直接端到端解析，输出含阅读顺序 | 实际是 SDK 流水线，顺序来自 PP-DocLayoutV3（§2.2） | 称「端到端流水线」；接块级中间记录而非只接 Markdown | ARCH §7.1、§10.3 `e2e_b/` |
| §3 分支 B | 内部使用 PP-DocLayoutV3 | **正确** | 保留；补充「与 A 可能同源」 | ARCH §7.1 |
| §4 统一输出层 | 两分支输出相同格式的结构化 Markdown | Markdown 丢失 bbox、来源、公式关联，无法支撑定位与重锚定 | 权威数据为 JSON 文档模型（候选页 → 采用版本），Markdown / LaTeX 为导出投影（草案 02 §3 的结论） | ARCH §8.1 |
| §5 质量评估层 | Jev 对每个区域打分（0~1），低分标记 | 缺错误占位、阈值语义、批量上限、部署约束（§2.3） | 规范状态 `scored / error / unavailable / not-run`，只有 `scored` 带分；阈值按类别定标 | ARCH §7.3；PRD AC-05、QM-05 |
| §6 多模态位置 | 放在翻译层之前**或并行** | 若与翻译并行，同一区域会先用未核验内容翻译，补救后译文作废、重复计费 | 区域补救必须在该区域**采用之前**完成；其他已采用区域的翻译可以并行进行 | ARCH §7.1 |
| §6 多模态 | 只处理 Jev 低分区域 | 用户已确认：低分**或有明确不确定证据的公式**都可核验 | 两类入口；服务错误、未评分不算证据；Q1 已决定所有识别路径都经 Jev | PRD S4、S5；ARCH §7.1 |
| 可选补充 | Unlimited-OCR（超长文档，低优先级） | 无 bbox（§2.6） | v2 不接入 | Q12 |
| 对比表 | B「阅读顺序：模型直接输出」 | 顺序来自版面模型 | 改为「PP-DocLayoutV3 给出」 | 本文 |
| 实现建议 2 | 通过配置切换当前分支 | 切换会覆盖已采用结果的风险 | 区分 `compare`（只新增候选）与 `adopt`（原子切换采用版本） | PRD AC-13；ARCH §4.2 `document` |
| 实现建议 4 | 两套方案都接入 Jev | 正确 | 保留；Jev 不可用时状态为 `unavailable`，不触发补救 | ARCH §7.3 |

## 4. 草案 01 / 02 / 03 需修改处

### 4.1 草案 01（桌面、多端与云端）

| 位置 | 草案写法 | 冲突 | 改为（权威位置） |
| --- | --- | --- | --- |
| §1、§9、§11、§13 后半 | 手机派任务、账号同步、在线桌面接单、官方云路线 | 用户本轮要求「v2 只做桌面端」 | 移出 v2，只在契约里保留余地，不建目录、不写代码（PRD §3.2；Q3） |
| §1、§10.1、§12 W1 | 写作辅助在 PDF 核心后独立实现 | 不在本轮列出的复用范围内 | 移出 v2 实现；架构预留 `writing` 切片（PRD §3.2；ARCH §4.4；Q5） |
| §3.1 | 文件超约 400 有效行「触发评审提示」，数值是软门槛 | v1 教训表明软约束无效 | 400 建议 / 600 硬上限，入口 150、函数 80、复杂度 15，CI 失败（ARCH §6、§13 G4） |
| §4 | 目录按层组织（`packages/domain/*`、`packages/application/*`、`adapters-desktop`、`adapters-cloud`、`apps/mobile`、`services/cloud-api`） | 按层组织会让一个功能散在五个目录，多个 Agent 改同一功能必然交叉；手机与云不在范围 | 按功能切片 `packages/features/<name>/{domain,application,adapters,ui}`，worker 在 `workers/parser/`（ARCH §3、§4） |
| §5 | 旧代码保留 / 拆分表（约 15 行） | 粒度不足，缺行号；部分判断已变化（如整页多模态） | 以 [v1 审查](./v1-review.md) §2、§4、§5 为准 |
| §6 | 应用端口示例 | 与切片划分不对应 | ARCH §7.3 的端口，按切片放置 |
| §8 | 同步与保留表 | 同步移出范围 | 只保留本机存储与密钥规则（ARCH §8） |
| §12 | P0–P6 + W1 | 范围变化 | PRD §8 的 M0–M8 |
| §13 | worker 用 FastAPI，令牌保护，capability / 提交 / 事件 / 取消 / 产物 | **一致** | 保留，细化为 `oi-parse/1`（ARCH §10） |

### 4.2 草案 02（数据协议）

| 位置 | 草案写法 | 处理 |
| --- | --- | --- |
| §3、§4 | JSON 文档模型为权威，Markdown 为投影；`ContentBlock`、`AcceptedPageRevision` 等类型 | **保留**，落入 `packages/contracts`（ARCH §4.1、§8.1） |
| §5 | 坐标合同按 PyMuPDF / PDF.js 写 | 合同保留；渲染库为 pypdfium2（Q6 已决定），`CoordinateFrame.renderer` 记录实际库与版本 |
| §6 | `FormulaCandidate.engineId: 'paddle-modular' \| 'minicpm-pipeline' \| 'multimodal-repair'` | 改为配置值 `EngineId`，模型名只出现在 adapters 与 `EngineCapabilities.models[]`（ARCH §7.3、F-13） |
| §6 末 | arXiv 源码校准是否保留待定 | Q4 已决定：做，新增 `formula-source` 切片（ARCH §7.6） |
| §6 | `EvaluationResult` 四态 | **保留**；补 `detailCode` 映射（本文 §2.3） |
| §7 | `⟦fN⟧` 占位 + 片段表哈希 | **保留**（v1 审查 §4.6；ARCH `translation/domain/placeholder.ts`） |
| §7 | 译文缓存键含采用版本；公式保护哈希绑定 `pageRevisionId + blockId + formulaDecisionId` | **改**：译文缓存键按内容寻址，不含采用版本、区块号与决定 ID，改含公式决定摘要；记录本身仍绑定采用版本（本文 §6.2.1；ARCH §8.1.1） |
| §10 | blocks-1 导入迁移表 | 不采用：Q8 已决定不做 v1 迁移 |
| §11 | 同步 canonical 与缓存 | 同步移出 v2 |

### 4.3 草案 03（双引擎与质量评估）

草案 03 的上游描述总体准确，以下是需要补充或修改的地方：

| 位置 | 草案写法 | 处理 |
| --- | --- | --- |
| §1、§3 | 输入统一使用 PyMuPDF | Q6 已决定：pypdfium2 |
| §2 | Paddle 公开 PP-DocLayout-L、plus-L、PP-FormulaNet-L、plus-L | 正确；补 Paddle 文档自相矛盾（§2.4） |
| §5 | B 应接块级中间结果 | 正确；补 `block_id` 与 `order` 是同一序号、建议 `ppdoclayout3_torch`、以图片输入（§2.2） |
| §6 | TS `ParseEngine` 接口、`EngineId` 联合类型 | 拆为 TS 侧 `ParseGateway`（application 端口）与 Python 侧 `DocumentEngine`（worker 内部）；`EngineId` 改为配置值（ARCH §7.2、§7.3） |
| §9 | verdict：`render_error` 为 0、`encode_error` / `forward_error` 为 -1 | 补 `precheck_reject`、`missing_original_image`（0.0）与其他非 `scored` 值；补 64 项批量上限与渲染一致性（§2.3） |
| §10 | 补救路由：先试 B 区域候选，仍低分再多模态 | 保留，B 区域候选以 `capabilities` 声明为前提（ARCH §7.1） |
| §11 | 「Paddle、MiniCPM、Jev 重推理由用户配置的服务承担」；vLLM 验证 RTX 5090 32 GB；另有 llama.cpp CPU / Metal 路径 | 正确；补 Jev 硬件下限（§2.3），按 API 优先，所有设备默认用面壁 API 跑 Jev 与引擎 B，本地是可选项（Q9、ARCH §7.0）；Metal 路径只验证了 macOS ARM64 包，芯片未写 |
| §11 | Paddle 与 MiniCPM / Jev 用隔离环境或独立服务 | **保留**（ARCH §10.3：按引擎分 extras / venv / 容器） |
| §13 | 官方来源指向 `main` | 规格中注明锁定提交 `1269e4f`（MiniCPM-OCR） |

### 4.4 需求对齐记录（`docs/architecture/README.md`）

| 已确认项 | 与本轮要求的关系 | 处理 |
| --- | --- | --- |
| 多端互通、手机派任务、账号同步、官方云入口 | 本轮用户指令「v2 只做桌面端」更新 | 移出 v2，只留接口余地（Q3） |
| 写作辅助在 PDF 核心后实现 | 本轮复用范围未列写作 | 移出 v2 实现、架构预留（Q5） |
| 最低硬件不要求本地同时跑两套解析与 Jev | 与 §2.3 的 Jev 硬件下限一致；18:44 的「API 优先」更进一步 | 保留，并改为：有托管 API 的模型能力默认 API，8 GB 设备不要求本地跑任何模型（PRD §2、ARCH §7.0） |
| 其余（双引擎、统一产物、公式不确定处理、自动补救开关与预算、语音首批能力） | 一致 | 保留 |

## 5. 与 v1 实现 / v1 文档的冲突

| v1 做法 | 出处 | 新方案 | v2 处理 |
| --- | --- | --- | --- |
| 桌面智能版式只用 PP-DocLayoutV2，默认文字层原序 | `docs/ui-phase2-plan.md:323`、`docs/architecture-redesign.md` §11 | 引擎 A 为主力 | 文字层原序降为无服务时的「文字层基础档」（Q2） |
| 公式七级兜底，多模态为常规第二层 | `lib/formula-contract.js:10-20`、`REQUIREMENTS.md` §2.6 | 多模态只处理低分 / 不确定区域 | 兜底顺序重排（v1 审查 §4.1），判据数值保留 |
| OCR 层为桩、矢量重绘未实现 | `lib/formula-tiers/ocr.js:9-10`、`vector.js:12-18` | OCR 由引擎 A / B 产出 | 矢量重绘不进 v2 |
| 整页多模态替换（#189，7 轮不收敛，默认关） | `lib/mm-page.js:21` | 只做区域补救 | 丢弃；页面版本切换由原子采用完成 |
| 「通顺试接」 | 只在 `docs/architecture-redesign.md:185-198`，`:168` 自述未写代码 | 自写阅读顺序 | 新实现，打分模型、窗口、阈值由基准定标；不当作已有资产 |
| 旧本机服务 `127.0.0.1:8765` 的 `/v1/layout` | `lib/pdf-layout-client.js:12` | `oi-parse/1` | 不兼容；Q8 已决定不迁移，v2 不读旧服务与旧数据 |
| 多模态账本按页计数，不计金额 | `lib/formula-mm-ledger.js` | 受限 / 不设金额上限预算 | 账本改为金额与次数双口径，带预留与结算 |
| 未配置翻译时借用多模态服务翻译 | `lib/translate-borrow.js` | 未提及 | Q11 已决定：保留，默认关，开启时提示消耗多模态额度 |
| arXiv 源码作为公式第零层 | `lib/formula-tiers/arxiv.js`、`background/arxiv-source.js` | 附件未提及 | Q4 已决定：做；规则复用，接入 Jev 与优先级链（ARCH §7.5、§7.6） |
| 文献库与笔记存 IndexedDB | `lib/library-store.js:41`、`lib/notes-store.js:36-55` | SQLite + 文件 | 规则复用，存储重写；不迁移旧数据（Q8） |
| 诊断日志 7 天 / 2 MB | `lib/diag-log.js:15-17` | — | 沿用为默认值（ARCH §11） |
| 两步润色默认开 | `lib/storage.js:68` | — | 保留为设置项，默认值沿用 |
| 测试语料：30 篇 / 639 页预标注、134 页人工复核、1,000 个公式单元 | `corpus/manifest.json`、`labels/*` | 基准集 | 作为公式基准起点；**不是**阅读顺序真值，顺序基准需另建（PRD §7） |

## 6. 决策记录（Q1–Q12）

编号在 PRD、ARCHITECTURE、RULES、v1 审查中通用。全部 12 个问题已由 Wisdom 于 2026-10-30 决定（Q1、Q2、Q3、Q6、Q9 先行决定；Q4、Q5、Q7、Q8、Q10、Q11、Q12 于 16:53 决定）。

| 编号 | 问题 | 决定 | 状态 | 落点 |
| --- | --- | --- | --- | --- |
| Q1 | MiniCPM-OCR 1.0（引擎 B）与 Jev（质量评估）是否照附件使用？ | 照用，锁定版本，M6 开工前复核。硬性不变式：**所有**识别结果路径（引擎 A、引擎 B、百度 OCR、智谱 OCR、arXiv 源码对齐、多模态补救）都必须经过 Jev 评分；低分区域进入多模态补救；评分不可用标「待评分」，不触发补救 | 已决定（Wisdom 2026-10-30） | ARCH §7.1、§7.3、§7.5、§7.7；PRD S5、AC-18；RULES N-17 |
| Q2 | 「文字层基础档」是否作为无服务时的默认降级？ | 同意 | 已决定（Wisdom 2026-10-30） | PRD S2、AC-11；ARCH §7.1 |
| Q3 | v2 只做桌面端，同时支持远程 / 自建 worker？ | 同意；手机、账号同步、官方云只在契约中留余地。另加约束「UI 与业务核心解耦（functional core, imperative shell）」：先调研再写，调研来源见 ARCH §2.2 | 已决定（Wisdom 2026-10-30） | PRD S11、S12、AC-21；ARCH §2.1–§2.6、§13 G13–G16（原 G17 已删除，§6.6）；RULES §8 |
| Q4 | arXiv 源码校准公式是否进入 v2？ | 做，进入 M0–M8：编号与版本识别、源码下载缓存限流超时、TeX 解析、与版面区域对齐、KaTeX 安全渲染、对齐失败回落识别链路；对齐结果同样进 Jev 与优先级链 | 已决定（Wisdom 2026-10-30） | ARCH §4.2 `formula-source`、§7.5、§7.6；PRD S4、US-18、AC-22–AC-26、M4、M6；v1 审查 §4.17 |
| Q5 | 写作辅助是否移出 v2？ | 移出 v2 实现范围，但在架构中提前设计：切片位置、seam 草案、依赖的数据模型（笔记 / 引用 / 文献库）与扩展点；PRD 记为后续阶段并验收保留接口 | 已决定（Wisdom 2026-10-30） | ARCH §4.4；PRD §3.2、AC-27、M5 |
| Q6 | worker 的 PDF 渲染与文字提取库？ | pypdfium2；MiniCPM SDK 以图片输入；根目录 `LICENSE` 改为 Apache-2.0；禁止 GPL / AGPL 依赖（含 PyMuPDF） | 已决定（Wisdom 2026-10-30） | `LICENSE`、`package.json`、`README.md`；RULES §1.5、N-13；ARCH §7.1、§10.3、G10 |
| Q7 | 本机 worker 传输方式？ | 本机与远程同一协议 HTTP + SSE；不采用 stdio JSON-RPC | 已决定（Wisdom 2026-10-30） | ARCH §1、§10.1；PRD S11 |
| Q8 | 是否做 v1 数据迁移器？ | 不做，v2 从零开始；删除迁移器相关里程碑与验收。取舍：省去导入器的格式解析、dry-run、冲突处理与测试，v2 数据模型不受 v1 约束；代价是 v1 的文献库、笔记、已存译文不进 v2 | 已决定（Wisdom 2026-10-30） | PRD §3.2；ARCH §4.2 `library`；v1 审查 §2、§4.14、§5 |
| Q9 | Jev 部署在哪？ | 设置主选项「本地 / API」，默认「API」；两者走同一个 `evaluate` 作业接口。API 服务商是面壁开放平台托管 API（`MiniCPM-OCR-Jev`）；「本地」首选 llama.cpp CUDA 构建；硬件画像只给「本地」标可行性，用户随时可改；自建远程 worker 与 Jev Docker 在「高级」。Key 名 `MODELBEST_API_KEY`，只放 Cursor Secrets 或用户本机安全存储，绝不进仓库。引擎 B 同样默认用面壁 MiniCPM-OCR-1.0 文档解析 API（§2.3.1、§6.3）。开发机是 Windows（32 GB 内存 + RTX 4070 12 GB）：开发走 API 路径，本地 Jev「不要求 / 未核实」，M0 只要求 API 路径（实测已延后，§6.4） | 已决定（Wisdom 2026-10-30；开发机配置 17:56、面壁 API 18:37、API 优先 18:44 补充） | ARCH §1、§2.6、§4.2、§7.0、§7.1、§7.4、§8.3、§10.1–§10.3；PRD §2、S2、S5、§3.3、US-19、US-29、US-30、AC-19、AC-20、AC-59、AC-60、M0、M6 |
| Q10 | 引擎 A 的版面模型？ | PP-DocLayoutV3 起步，PP-DocLayout_plus-L 对照；明显更好时作为「高质量档」供用户选择 | 已决定（Wisdom 2026-10-30） | ARCH §7.1；PRD S2、US-21、AC-28、QM-13 |
| Q11 | 是否保留「未配置翻译时借用多模态服务翻译」？ | 保留，默认关闭，开启时提示会消耗多模态额度 | 已决定（Wisdom 2026-10-30） | ARCH §4.2 `settings`；PRD S3、US-22、AC-29 |
| Q12 | Unlimited-OCR 是否接入？ | 不接入；上游支持坐标输出后再评估 | 已决定（Wisdom 2026-10-30） | 本文 §2.6；PRD §3.2 |

另有两项需要用户知情：

- 许可证政策（RULES §1.5）：GPL / AGPL 一律禁止；MinerU Open Source License、LGPL 与任何非商用权重为「需批准」。
- 全部「待基准定标」数值（PRD §6.2，含新增的 QM-12–QM-17）在基准跑出前不填数；QM-13（高质量档「明显更好」的判据）由用户拍板。

### 6.1 后续决定：Markdown 阅读（Wisdom 2026-10-30 17:32）

Loom 提交 Markdown 阅读方案（[docs/design/md-reader.md](./design/md-reader.md)，含线框图），方案内三个问题由 Wisdom 于 17:27 决定，17:32 修订 D6 并批准整体方案并入 v2 M0–M8。方案 §6 的「Q1–Q3」是方案内部编号，与上表的 Q1–Q12 不是一套，规格中统一引用方案的 D1–D7。

| 方案编号 | 决定 | 状态 | 落点 |
| --- | --- | --- | --- |
| D1 | 应用内统一 `MarkdownView`，渲染笔记、译文、AI 回答与 `.md` | 已决定（Wisdom 2026-10-30） | ARCH §4.5.4、§4.1 `ui-kit/src/markdown`；PRD S13、AC-30 |
| D2 | 公式用 KaTeX，与 formula 同一份安全选项；失败显示原文加错误标记 | 已决定（Wisdom 2026-10-30） | ARCH §4.1 `latex-policy`、§4.5.5、§7.6；PRD AC-25、AC-31、AC-32 |
| D3 | `.md` 阅读器只读，外部修改自动重载并保留位置 | 已决定（Wisdom 2026-10-30） | ARCH §4.5.2 `watch-debounce`；PRD AC-36、QM-15 |
| D4 | 文件夹即笔记库：文件树、wikilink、`![[img]]`、`[[x#标题]]`、失效链接、后退 / 前进、大纲；链接在 core 解析 | 已决定（Wisdom 2026-10-30） | ARCH §4.5.2–§4.5.3；PRD US-25、AC-37–AC-41、AC-44 |
| D5 | `.md` 独立入口，不进文献库，只链接库内 PDF | 已决定（Wisdom 2026-10-30） | ARCH §4.3 `markdown → library`；PRD AC-34、AC-43 |
| D6 | 译文按原文段落分块结构化存储（不是整篇 `.md`），正文字段是 Markdown；seam `translation.getBlocks` / `translation.onBlockChanged`；先过公式校验再写、校验失败不存文本、重译期间保留上一版，规则都在 core；整篇导出推迟到 v2 之后 | 已决定（Wisdom 2026-10-30 17:27，17:32 修订；四项细节见 §6.2） | ARCH §8.1.1、§4.2 `translation`；PRD S3、AC-03、AC-48–AC-51、AC-56–AC-58；v1 审查 §4.9、§4.18 |
| D7 | v2 只读，预留编辑接口（源码区间、写入契约类型、不注册、不注入） | 已决定（Wisdom 2026-10-30） | ARCH §4.5.7；PRD AC-52–AC-55；RULES N-18 |

规格对方案做的校正（不改界面设计，详见方案文首「入库说明」）：

1. KaTeX 选项只保留一份，`throwOnError:true`（方案写 `false`），失败由组件捕获后显示原文，效果相同。
2. 共享渲染组件放 `ui-kit/src/markdown/`，因为切片 UI 不能互相 import；阅读器专属组件仍在 `features/markdown/src/ui`。
3. 其他切片的 UI 不调用 Markdown 解析：`translation`、`notes`、`qa` 在 core 里经 `markdown` 的 seam 解析，随结果返回 `MdDocument`；reader 不依赖 `markdown`。
4. 里程碑：笔记接入由 M2 改为 M5，问答定 M5，D7 定 M2（PRD §8.1）。
5. 契约补充：公式节点的 `blocked` 字段、`unsupported_scheme` 失效原因、`openVault` 返回 `jobId`、`openExternal` 与 `revealInFolder` 两条命令（ARCH §4.5.3）；译文记录补 `revisionId`、`targetLang`（ARCH §8.1.1）。
6. 方案的人日估算不进规格；方案的阈值均标「待定标」（ARCH §4.5.6、PRD QM-15–QM-17）。

### 6.2 后续决定：译文区块的四项结论（Loom 2026-10-30，经 Wisdom 转达）

规格并入 D6 后列了四项风险，Loom 给出结论如下。前三项直接写入规格；第四项要求本文写清论证，见 §6.2.1。

| 风险 | Loom 的结论 | 落点 |
| --- | --- | --- |
| 「段落级文本块」包含哪些块 | 正文段落、标题、图表题注、脚注、列表项、引用块。表格和图用原文裁图，不进翻译块（只翻题注）；独立公式走公式回退链，不算翻译块 | ARCH §8.1.1「哪些块是翻译块」、`block-scope.ts`；PRD S3、AC-58 |
| 规格在 Loom 的 seam 之外加的 `retranslateBlock` 与 `onBlockChanged.documentId` | 同意。`retranslateBlock` 返回 `Result`；状态变化只经 `onBlockChanged` 推送，UI 不自行推断状态 | ARCH §2.6 `TranslationSeam`、§8.1.1；RULES §5 第 13 项；PRD AC-56 |
| 重译失败而旧版本还在时怎么显示 | 正文照常显示上一版；块左侧 2px 标记线（`--oi-reader-warn`）；块末次要文字「重译未成功，仍显示上一版 · 重试」，「重试」是次级文字按钮、调 `retranslateBlock`，悬停显示原因（校验未通过 / 网络 / 模型错误）；不弹 toast、弹窗或全局横幅；重试中显示「正在重译…」并禁用重试，成功后标记与提示行消失；从未成功的块显示原文 +「翻译未通过校验」+「重译」；提示行 `role="status"`，「重试」可键盘聚焦，焦点环 `--oi-reader-focus`，状态不只靠颜色。新增验收 MD-27 | ARCH §8.1.1「状态与显示版本」；PRD US-28、AC-03、AC-56 |
| 缓存键不含采用版本号是否安全 | 在本文写清论证：片段表哈希是否覆盖所有公式变化（候选更换、采用版本变化、重解析）；不能覆盖就把采用版本或公式决定摘要加入缓存键，并加对应验收 | 本节 §6.2.1；ARCH §8.1.1「缓存键」；PRD AC-57 |

为落实前三项，规格做了以下补充，需 Loom 知悉：

1. `StoredTranslationBlock` 加 `failureKind`（`check_failed` / `network` / `model_error`），悬停原因从这里取；加 `blockKind`、`formulaDigest`。
2. `getBlocks` 每块返回 `display`（`current` / `retranslating` / `previous_with_failure` / `never_succeeded` / `pending`），由 core 判定样式，UI 只照着选。
3. `retranslateBlock` 的成功值是新版本号 `{ version }`，不再返回 `jobId`，避免 UI 去看任务事件猜状态；新增错误 `block_not_translatable`、`already_retranslating`。
4. 键盘聚焦到「重试」时也显示原因（悬停对键盘用户不可达）。待 Loom 确认。
5. 调用被拒绝（`Result` 为错误，例如预算用尽、未配置服务）时块状态不变；原因在界面上怎么显示，Loom 的结论没有覆盖，待 Loom。

#### 6.2.1 译文缓存键论证：片段表哈希是否覆盖所有公式变化

**问题。** 译文缓存键（ARCH §8.1.1）按内容寻址，不含 `revisionId`，以便重解析后内容不变的块不重发请求（PRD AC-02）。原写法靠「受保护片段表哈希」挡住 v1 的事故：公式变了却显示旧译文（v1 审查 §4.18）。要回答的是，这个哈希能不能覆盖所有会改变译文显示的公式变化。

**一块译文由什么决定。** 一块的 `markdown` = 还原（模型输出, 片段表）。模型只看到占位文本 `⟦fN⟧`，看不到公式内容；公式只在还原这一步写进正文。所以缓存键要覆盖两组输入：

- 进模型的：占位文本、提示词模板、润色开关、模型、目标语言，以及提示词实际用到的块信息（例如块类型）。
- 进还原和显示的：每个片段在还原时写进正文的内容，以及它该以什么方式显示。

原写法的片段表哈希只覆盖「公式 LaTeX、编号、引用」的字符串。

**逐类变化。** 前提：公式决定只随新的采用版本改变（草案 02 §8：采用时在事务里写入新的块、顺序、公式决策，再原子切换；ARCH §8.2 乐观锁）。

| 变化 | 例子 | 片段表哈希（原写法）变不变 | 结论 |
| --- | --- | --- | --- |
| 候选更换，采用的 LaTeX 字节不同 | arXiv 源码候选取代 OCR 候选 | 变 | 覆盖 |
| 候选更换，采用的 LaTeX 字节相同 | 两个来源给出同一串 LaTeX | 不变 | 命中缓存；还原出的正文逐字节相同，安全 |
| 显示决定变化，LaTeX 字节不变 | 「待评分」的候选按默认显示裁图，补评通过后改为已核验 LaTeX；反过来，复核后改为显示裁图，而片段表里记的仍是同一串候选 LaTeX | **不变** | **不覆盖**：会复用按旧决定还原的正文。降级时，未核验的公式仍以 LaTeX 出现在译文栏，违反 AC-04 |
| 裁图本身变化 | 裁图外扩规则或重渲染改变了裁图 | **不变** | **不覆盖**（只要译文栏的裁图来自片段，就会显示旧裁图） |
| 采用版本变化，块内容与公式决定都不变 | 只重解析了别的页，或重新采用同一结果 | 不变 | 命中缓存，正确。这正是不把 `revisionId` 放进键的理由 |
| 重解析改了分块 | 段落被拆分或合并 | 占位文本变 | 覆盖 |
| 重解析只改了块类型 | 段落改判为列表项或标题 | 不变 | 提示词或还原依赖块类型时**不覆盖**（原写法的键里没有块类型） |
| 在途结果 | 请求发出后用户采用了新版本 | — | 不是键的问题：缓存条目按发出时的输入算，本身是对的；危险在于把结果写到新版本的记录上 |
| 公式决定原地修改 | 某条代码路径不建新采用版本就改了决定 | 记录不会被重新查键 | **不覆盖**：记录绑定的 `revisionId` 没变，`getBlocks` 会一直返回旧正文。前提被违反时，键再完整也挡不住 |

**结论：原写法不能覆盖全部公式变化。** 按 Wisdom 的要求改键，并补读写两侧的规则（ARCH §8.1.1）：

1. **把公式决定摘要 `formulaDigest` 加入缓存键，取代片段表哈希。** 每个片段取「写进正文或决定显示方式」的全部内容：行内 / 行间、显示决定（`verified-latex` / `source-crop`）、已核验时的规范化 LaTeX 字节、裁图时的裁图内容哈希；编号与引用取原文字节；另含占位协议与公式切块版本。上表的「显示决定变化」与「裁图本身变化」因此被覆盖。
2. **不加采用版本号。** 加了以后每次重解析都要整篇重译（AC-02 想避免的费用），而安全性没有增加：采用版本变了、摘要和占位文本都没变时，写进正文的字节相同。决定 ID、候选 ID、候选来源、评分、评估器版本同理不进摘要。
3. **把块类型加入键**，覆盖「只改块类型」；并定规则「进提示词的每一项都要进键」，以后加上下文或术语表时同步改键（草案 02 §7 的键含术语表，v2 暂不做术语表）。
4. **在途结果只写缓存，不写到已被替换的采用版本的记录上**（ARCH §8.2「过期任务结果不能覆盖新版本」）。
5. **原地修改的兜底。** 规格要求公式决定只随新采用版本改变，`reevaluate-pending` 补评改变显示决定时也建新版本。另外记录保存写入时的 `formulaDigest`，`getBlocks` 读取时与当前比对：不一致就不返回旧正文，并自动重译，同时记诊断事件。
6. **验收**：PRD AC-57 逐条覆盖上表（①–⑧），M4 交付。

**已定（架构评审 P0-4，Wisdom 2026-10-30 19:57 批准）。** `source-crop` 的公式不写进 `oi-md/1` 正文：`StoredTranslationBlock.markdown` 只含已核验 LaTeX，另用 `crops: FormulaCropRef[]` 记每个裁图在正文中的位置（`fragmentId`、`at`、`display`、`assetId`）；`getBlocks` 在 core 里解析正文后在这些位置插入 `MdFormulaCrop` 节点，reader 只渲染这个 `MdDocument`。复核要求 `crops` 与片段表中的 `source-crop` 片段一一对应，位置不合法记 `crop_position` 失败。方言不升级，摘要计算不变（ARCH §8.1.1；PRD AC-04、AC-48、AC-49）。裁图在译文栏里的视觉样式由 Loom 定；v1 在这种情况下怎么显示，本 PR 没有核对。

### 6.3 后续决定：API 优先（Wisdom 2026-10-30 18:44）

原话要点：开发与最终用户一视同仁，每个由模型提供的能力（Jev 评分、引擎 B / MiniCPM-OCR、版面、多模态、OCR、翻译）有托管 API 时默认用 API，把用户的硬件要求降到最低；本地部署必须保留为一等、有文档、用户可在设置中选（「本地 / API」）的选项，与 API 走同一接口；开发机是 Windows、32 GB 内存、RTX 4070 12 GB，某个模型在开发机上部署不了时不要求本地，标「不要求 / 未核实」，规格里的本地选项照常保留；M0 退出条件改为 API 路径必做、本地实测可选；密钥只经 Cursor Secrets。

| 项 | 决定 | 落点 |
| --- | --- | --- |
| 默认来源 | 有托管 API 的能力默认 API；没有托管 API 的能力在 worker 上运行。文本问答与 TTS / ASR 同样依赖模型，一并适用 | ARCH §7.0；PRD §2、§3.3 |
| 本地选项 | 同一端口或同一种 worker 作业；两个来源跑同一份契约测试；部署文档 `docs/deploy/<能力>.md` 随实现里程碑交付；「本地」在设置主选项里，不放进「高级」 | ARCH §7.0；PRD AC-61；RULES §4、§5 第 14 项 |
| 硬件推荐 | 硬件画像只给「本地」标可行性；只有没有托管 API 或用户拒绝外发时才用它决定推荐本地还是降级 | ARCH §2.6、§7.4 推荐规则；PRD AC-20 |
| 降级 | 没有 Key、拒绝外发或 API 不可用时，不静默改用其他付费服务、也不静默改成本地，按能力降级并提示 | ARCH §7.0 表；PRD §3.3、AC-61 |
| 各能力的 API 服务商 | Jev 与引擎 B：面壁开放平台；引擎 A 模型阶段：百度 AI Studio PaddleOCR 托管 API 为候选，**未核实**，M3 前核实，核实通过才进入选项；引擎 A 三条路径都保留，M3 前定最终选择（§2.4.1、§6.4）；多模态、翻译、问答：用户自带 Key，经服务商适配层接入，不预选，用户从全部服务商中选（§6.7）；TTS / ASR 在 M7 选型 | ARCH §7.0、§7.1、§7.9；PRD S2、§3.3 |
| 开发机 | Windows + 32 GB + RTX 4070 12 GB：开发走 API；本地 Jev、本地引擎 B「不要求 / 未核实」；本地引擎 A「不要求 / 未实测」 | ARCH §7.0、§7.4「开发机」、§10.3、§15.4；本文 §7 |
| M0 退出条件 | API 路径：经 Cursor Secrets 注入 `MODELBEST_API_KEY` 后对面壁 Jev API 跑参考样例（19:11 改为延后、「待执行」，见 §6.4）；可选：开发机本地实测 | PRD §8 M0；ARCH §7.4「开发机」 |
| 密钥 | 开发与测试 Key 只以环境变量提供：云端 Agent 经 Cursor Secrets 注入，开发者本机由开发者自己设置（§6.7）；变量名登记在 ARCH §15.4；不用 `.env`；CI 不调用付费 API；真实调用的冒烟测试标 `@live` | ARCH §8.3、§12、§15.4；RULES §4、N-05 |

### 6.4 后续决定：四项风险（Wisdom 2026-10-30 19:11）

| 项 | 决定 | 落点 |
| --- | --- | --- |
| 数据外发 | 批准：任何会外发数据的 API 能力，第一次使用前弹出同意对话框；拒绝 = 该服务商对所列能力的请求为 0、不改发给别的服务商，并按能力降级；对话框布局由 Loom 定；询问粒度见 §6.5 | ARCH §2.5、§4.2 `settings/domain/egress-consent.ts`、§7.0 第 6 条、§7.4「面壁 API」；PRD §3.3、AC-61 ⑦ |
| 引擎 A 的模型阶段 | 三条路径都保留可选：托管 API（核实通过后；候选是百度 AI Studio，§2.4.1）、本地部署、租用的 Linux 远程 worker（「高级」里的远程 worker，跑同一份 worker）；M3 开工前定最终选择（默认值与开发用的路径） | ARCH §7.0 表、§7.1、§10.3；PRD S2、§3.3、AC-61 ①、M3 |
| 文本问答 | 批准纳入 API 优先；问答同时支持多模态模型与纯文本 LLM，走同一个 `ChatProvider` 接口，差别只在「是否接受图片」，未知时按纯文本处理 | ARCH §4.2 `qa`、§7.0 表、§7.3；PRD S8、§3.3、AC-62、M5 |
| M0 的 API 实测 | 延后，现在不跑；记「待执行」，不阻塞规格文档；执行前需在 Cursor Secrets 中添加 `MODELBEST_API_KEY` | ARCH §7.0 第 7 条、§7.4「开发机」；PRD §8 M0；本文 §7 |

### 6.5 后续决定：外发同意按服务商（Wisdom 2026-10-30 19:30）

| 项 | 决定 | 落点 |
| --- | --- | --- |
| 询问粒度 | 按服务商问，不按「能力 + 服务商」：每个服务商一个对话框，列出当前选定发给它数据的全部能力（例：面壁开放平台——Jev 评分 + 引擎 B）；用户对整个对话框同意或拒绝 | ARCH §2.5、§4.2 `settings/domain/egress-consent.ts`、§7.0 第 6 条、§7.4「面壁 API」；PRD §3.3、AC-61 ⑦ a、d |
| 新增能力 | 已同意的服务商之后又有能力要发数据给它时，仍须告知：该能力第一次请求前再问一次，只列新增的能力；被拒时此前已同意的能力不受影响 | ARCH §7.0 第 6 条、§7.4「面壁 API」；PRD §3.3、AC-61 ⑦ b、c |
| 「外发前询问」开关 | 设置里可以关闭同意对话框，默认开（弹对话框）；关闭必须是用户的明确操作，新安装、升级、恢复默认都不会关闭它；关闭后请求照常发送 | ARCH §2.5（`setEgressPromptEnabled`）、§4.2、§7.0 第 6 条；PRD §3.3、AC-61 ⑦ e、f |
| 数据去向 | 无论开关状态，设置都显示哪些服务商会收到数据、发给它的能力与状态（已同意 / 询问已关闭 / 已拒绝） | ARCH §2.5（`listEgressDestinations`）、§4.2、§7.0 第 6 条、§7.4；PRD §3.3、AC-61 ⑦ f |
| 界面 | 对话框布局与开关在设置里的位置由 Loom 定（DESIGN.md 待 Loom 产出） | ARCH §7.0 第 6 条；PRD §3.3 |
| 规格补充（按架构评审 P1-1，Wisdom 2026-10-30 20:57 确认保留，§6.7） | 重新打开开关后，没有在对话框里同意过的「服务商 + 能力」，下次使用前照常询问 | ARCH §7.0 第 6 条；PRD §3.3、AC-61 ⑦ g、§9 |

### 6.6 后续决定：架构评审修复 A（Wisdom 2026-10-30 19:57）

Wisdom 批准按[架构评审](./reviews/2026-10-30-architecture-review.md)修复。本节只列这一批（4 个 P0 与 G17）；P1 见 §6.7，阅读顺序（P1-5）、M6 拆分（P1-12）与 P2 留到之后。

| 项 | 决定 | 落点 |
| --- | --- | --- |
| P0-1 流水线没有归属 | 新增无 UI 的 `ingest` 切片，独占「解析 → Jev 评分 → 采用 → 翻译」与补救后重评的跨切片编排；不建表，下一步由已落库的事实重新推出，进度经 `jobs` 的 `ingest` 任务上报；PDF 打开只有 `ingest.openDocument` 一个 IPC 入口，`library.importPdf` 不再暴露给 IPC；任何切片不 import `ingest` | ARCH §2.5、§3、§4.2、§4.3、§5.2 F-17、§5.3、§7.1、§9、§13 G5；PRD §4 原则 3、M1、M3；RULES §5 第 16 条 |
| 删除 `repair → quality` | 补救后的重评由 `ingest` 调用 `quality`，`repair` 不再依赖 `quality` | ARCH §4.3 |
| P0-2 utilityProcess 的说法 | `safeStorage`、对话框、`shell`、`oi-asset://` 协议处理、窗口、preload、IPC 校验、`worker-supervisor` 固定在 main；用例、SQLite、HTTP 适配器、`worker-client`、文件资产、md 读取 / 扫描 / 监视可在 M3 按实测迁到 utility；密钥明文只在 main，按次授权并核对该服务商登记的主机；启用 utility 后 assetId → 路径经 MessagePort 查询 | ARCH §1、§9 |
| P0-3 预算只管补救 | 新增 `budget` 切片（账本从 `repair` 移出，上限从 `settings` 移出），经 `contracts/src/budget.ts` 的 `BudgetGate` 端口由装配根注入；每次外发付费调用先 `reserve`，被拒就不发请求；账户按「服务商 + 能力」，有金额上限与请求数 / 页数 / token 上限；受限预算下单价未知且没设上限时拒绝（`budget_cap_unset`）；worker 作业带额度信封；Jev 被拒记为 `unavailable/budget`；本机回环服务与 arXiv 下载不计 | ARCH §2.5、§4.1、§4.2、§7.3、§7.8、§10.2；PRD §3.3、AC-06、AC-59 ③、AC-63；RULES §5 第 15 条 |
| P0-4 `oi-md/1` 表示不了裁图 | 见 §6.2.1 末段：裁图位置记在 `crops`，`getBlocks` 生成 `MdFormulaCrop` 节点，正文只含已核验 LaTeX；AC-04 加入译文栏断言 | ARCH §4.1、§4.5.4、§8.1.1；PRD AC-04、AC-48、AC-49 |
| 删除 G17 | 同一切片的 UI 与 core 可以在一个 PR 里，seam 的类型变更先单独合入；Q3 执行规则 2、3、5 改由评审清单与 UI–core 交接说明检查；G13–G16 保留 | ARCH §5.2 F-16、§13；RULES §8；PRD AC-21、AC-45、§8.1 |
| 切片数 | 由 16 个增至 18 个（`ingest`、`budget`） | ARCH §2.5、§3、§13 |
| 已定（Wisdom 2026-10-30 20:57，按建议） | ① 新增 `budget` 切片；② 新安装与恢复默认时是受限预算模式，升级不改用户已选的模式与上限；③ 每个付费科目默认带保守的占位次数类上限（请求数 / 页数 / token），只在 `budget/domain/default-caps.ts`，界面标「占位」，数字随 M1 的 `budget` 实现 PR 提出、经 Wisdom 批准，M0 实测后定标；④ 评审建议的热点收窄（P1-11 后半）留到之后的 PR C，本批不做 | ARCH §4.2 `budget`、§7.8 第 4 条、§16；PRD §3.3、AC-63 ⑥、§9 |

### 6.7 后续决定：架构评审修复 B 与服务商适配层（Wisdom 2026-10-30 19:45、19:46、19:57）

Wisdom 19:57 批准按[架构评审](./reviews/2026-10-30-architecture-review.md)修复；19:45、19:46 要求服务商适配层：支持所有主流 API 格式，新增一家服务商 = 一个适配器 + 一条注册表记录、核心零改动，带能力标记，每个适配器有契约测试，并按各家官方文档核实接口格式。本节列这一批。

| 项 | 决定 | 落点 |
| --- | --- | --- |
| P1-1 同意规则的措辞 | AC-61 ⑦c 与 §3.3 对齐：拒绝或未作答只影响该服务商、只影响对话框里列出的能力——这些能力对它的请求为 0、不改发给别的服务商；其他服务商上已同意的能力照常。「重新打开开关后照常询问」（§6.5 末行）按评审采纳，成为 AC-61 ⑦ g | ARCH §7.0 第 6 条；PRD §3.3、AC-60 ①、AC-61 ⑦ c、⑦ g |
| P1-2 外发检查没有端口 | 新端口 `EgressCheck.check({ vendorId, capability, host })` → `allow` / `ask` / `refused`，`settings` 实现；三处调用：`ingest` 提交作业前、`providers` 传输层连接前、`worker-client` 连接远程 worker 前。回环地址与用户标为「本机可信」的主机（默认没有）不算外发，其余都算，包括远程 worker；服务商按（`vendorId`, 主机）识别，主机不在 `allowedHosts` 里就当新服务商重新询问；`ask` 时这次不发请求、记 `consent_required`、释放预留 | ARCH §1、§2.5、§4.2 `settings`、§7.0 第 6 条；PRD §3.3、AC-65 |
| P1-3 远程 worker 收到用户的 Key | worker 分 `local`（只绑 127.0.0.1）与 `server` 两种模式。`OI-Provider-Authorization` 只在 `local` 模式、经回环地址接收，由 main 按次授权；`server` 模式收到这个头返回 400 `provider_credential_not_accepted`，不建作业，只用服务器上自己配置的后端，并在 `/v1/capabilities` 里报出这些后端的 `vendorId` 与主机，供外发检查与同意使用；`worker-client` 只对受监管的回环 worker 带这个头，否则 `credential_to_remote_refused` | ARCH §1、§10.1、§10.2；PRD §3.3、AC-59 ⑤、AC-65 |
| P1-4 已被取代的句子 | 删除，不追加「后来改为」：Q9 的「按硬件推荐 / 推荐本机」「本地 / 面壁 API」，引擎 B「默认关 / 可选云端来源」，「18:44 起替换…」，§6.5「待 Wisdom 确认」，§7 中「引擎 B 云端来源默认关」等（本文 §0 第 4 条、§6.3–§6.5、§6.6 引言、§7、§8；ARCH §7.1、§7.4、§16；PRD §9） | 同左 |
| P1-8 HTTP 错误映射写在三处 | 统一为 `ProviderFailure`（`auth` / `quota` / `rate_limited` / `invalid_request` / `too_large` / `service_failed` / `timeout`，带 `retryable`、`retryAfterMs`、`httpStatus`、`vendorCode`、`requestId`），映射只在各格式的 `errors.ts`；TS 与 worker 共用 `fixtures/protocol/provider-errors/` | ARCH §7.1、§7.3、§7.4、§7.9.5、§10.2 |
| P1-9 存储与协议不能独立升级 | 存储：`app_meta.app_schema`，迁移前备份到 `staging/`、在事务里迁移，数据比应用新时只读打开，JSON 带 `schemaVersion`。协议：请求头 `OI-Protocol: major.minor`（首版 1.0），`/v1/health` 返回 `protocol`、`workerVersion`、`mode`；主版本不一致时作业为 0，worker 回 426 与 `{ supported }`。两者写进同一份 ADR，M2 建表前合入 | ARCH §8.4、§10.4；PRD AC-66 |
| P1-10 Electron 安全基线 | 应用页面由 `oi-app://` 提供；CSP 常量在 `apps/desktop/src/main/security/csp.ts`，e2e 读出实际生效值逐字比对；fuses 清单，M8 打包后核对；`oi-asset://` 只给 `standard` 与 `secure`，只收 GET / HEAD，按 realpath 判断是否在允许目录内，只返回 PNG / JPEG / GIF / WebP，带 `nosniff` | ARCH §9；PRD AC-67 |
| 服务商适配层 | 新包 `packages/providers`：格式与服务商分开，格式适配器（TS 侧 `openai-chat`、`anthropic-messages`、`gemini-generate-content`、`baidu-ocr`、`zhipu-layout-parsing`；worker 侧 `modelbest-jev`、`modelbest-document-parse`、`paddleocr-aistudio-jobs`）+ 注册表 `registry/vendors/<vendor>.ts`；能力标记 chat / vision / ocr / scoring / streaming，只来自注册表或用户勾选，未知按否，闸门在传输层；鉴权经 main 的 `ProviderAuthorizer`；发送必须带 `Reservation` 并经 `EgressCheck`；按能力的共享契约测试套件，样例全部合成；原先每家一个切片适配器改为经 `@oi/providers`；M4 用一个新增假服务商的样例 PR 验证「核心零改动」。各家格式的核实见 §2.10 | ARCH §1、§2.5、§3、§4.1–§4.3、§5.1、§5.2 F-18、§7.3、§7.7、§7.9、§12、§13 G5；PRD §3.3、US-32、AC-64；RULES §4、§5 第 17、18 条 |
| 开发用 Key | 只以环境变量提供：云端 Agent 经 Cursor Secrets，开发者本机（Windows）由开发者自己设为用户级或会话级环境变量，值不进仓库里的脚本与配置；新增的变量名（只登记名字）见 ARCH §15.4 | ARCH §15.4；RULES N-05 |
| 已定（Wisdom 2026-10-30 20:57，按建议） | ① 翻译、多模态补救、问答、云 OCR：设置列出全部服务商，不预选，由用户选；没选之前按能力降级（Jev 与引擎 B 的 API 服务商仍是面壁，Q9）；② Gemini 默认用原生格式，OpenAI 兼容端点保留为备选；③ 百度 OCR 现在用 access_token，API Key 方式在请求头写法核实后加入；④ 开发者本机的 Key 现在用环境变量，Windows 凭据管理器之后支持；⑤ 保留「本机可信」主机选项，默认没有；⑥ 保留 §6.5 末行的规格补充（重新打开开关后照常询问）；⑦ P1-5（阅读顺序两套实现）、P1-6（借用多模态翻译的位置）、P1-7（Markdown 两条解析路径）、P1-11（门禁与 PR 粒度，含热点收窄）、P1-12（M6 拆分）、P2-3（历史草案的表格）与其余 P2 项留到之后的 PR C，本批不开始 | ARCH §7.0 第 6 条、§7.9.6、§7.9.8、§15.4、§16；PRD §3.3、AC-61 ⑦ g、AC-64 ⑨、§9 |
| **待 Wisdom 定** | ① 应用页面改由 `oi-app://` 提供；② CSP 的放宽项待 M2 实测后经 ADR 定 | ARCH §9 |

## 7. 未核实的说法

| 说法 | 来源 | 状态 |
| --- | --- | --- |
| MiniCPM-OCR 1.0 在 OmniDocBench 等公开基准上的分数 | 官方 README / 模型卡 | **未核实**（官方自测，无第三方复现） |
| Jev 在 JevOCRBench 上 AUROC × 100 = 93.6 | 模型卡 | **未核实**（官方自测） |
| PP-FormulaNet_plus-L 的 BLEU 与 1476 ms 耗时 | Paddle 文档 | **未核实**（官方自测，硬件以表注为准） |
| 面壁开放平台 Jev（`MiniCPM-OCR-Jev`）的价格 | 平台 ocr-jev 文档与控制台没有标价（Wisdom 2026-10-30 18:37 告知） | **未核实**；规格不写死单价，按 `usage` 记账，单价未填时显示「未知」（ARCH §7.4「面壁 API」） |
| 面壁 MiniCPM-OCR-1.0 文档解析的长期价格与限时免费的截止时间 | 平台控制台显示限时免费（Wisdom 告知）；文档只说按页计用量、「free trials」按异步任务计数 | **未核实**；引擎 B 默认用面壁文档解析 API（§6.3），计价同上 |
| 面壁国内站的 API base URL | 国内站 platform.modelbest.cn 控制台模型列表可见 `MiniCPM-OCR-Jev`（Wisdom 告知）；上游仓库 `docs/minicpm_ocr_jev_api_en.md:11` 写 `https://api.modelbest.cn/v1`；平台文档只写国际站 `https://api.modelbest.ai/v1` | **未核实**；设置里两站都预置，国内站标「未核实」，默认国际站（PRD §3.3），M6 开工前用真实 Key 核对 |
| 面壁国内站与国际站的 Key、账号、模型清单能否互用 | — | **未核实**；两站按不同站点记 `evaluatorVersion`、分别定标 |
| 面壁 API 的开通条件、配额、限流数值与服务稳定性 | 两份平台文档只给错误码与「最多 2 个活动任务」，没有给配额与限流数值；文档页声明只描述已实现的契约，不证明生产部署或线上连通 | **未核实**；本 PR 没有调用真实服务，M6 用 `MODELBEST_API_KEY` 冒烟（PRD M6） |
| 面壁托管文档解析背后的模型版本与流水线（是否与 SDK `1269e4f` 相同、版面是否 PP-DocLayoutV3） | 平台文档未说明 | **未核实**；与引擎 A 对比时按「版面可能同源」标注（ARCH §7.1） |
| 面壁 Jev API 的分数与官方 Docker 的一致性 | 上游说云 API 与 Docker 渲染一致、可与官方数值比较（`docs/minicpm_ocr_jev_tutorial_en.md:28-32`） | **未实测**；按 PRD QM-14 测，分别定标 |
| MiniCPM-OCR 1.0 在 Apple Silicon 上可用的具体芯片与内存下限 | `docs/llamacpp_deploy.md:23` 只写 macOS ARM64 包 | **未核实** |
| MiniCPM-OCR 1.0 在 8 GB 核显 Windows / M1 8 GB 上本机运行 | — | **未核实**，规格不承诺 |
| PaddlePaddle 在 macOS ARM64 / Windows 核显上运行引擎 A 的实际速度与内存 | — | **未核实**，M3 实测 |
| PP-DocLayoutV3 在 `layout_analysis` 模块中的支持状态 | 文档第 25 行与第 100–115 行矛盾 | **未核实**，M3 实测 |
| PP-DocLayoutV3 对应论文已被 ECCV 2026 接收 | HF 模型卡 | **未核实** |
| PaddleOCR 的 `transformers` 推理引擎可运行 PP-FormulaNet / PP-DocLayout，从而免装 PaddlePaddle | `formula_recognition.en.md:221` 只列出引擎选项 | **未核实**，M3 实测 |
| Unlimited-OCR 是否有区域坐标输出 | 公开 README 与示例 | 未见，**未核实**是否存在隐藏接口 |
| pypdfium2 依赖链（PDFium 及其第三方库）的完整许可证清单 | PyPI 元数据只写「dependency licenses」 | **未核实**，M1 用许可证工具逐项确认 |
| 附件中「MiniCPM 方案开发量小、复杂版面开箱较好」 | 附件对比表 | **未核实**，以 A/B 基准结果为准 |
| Jev 在 Windows 上本机运行（官方部署文档只覆盖 Linux + NVIDIA 与 macOS） | MiniCPM-OCR `1269e4f` 的 Jev 部署文档 | **未核实**；界面标「官方文档未覆盖」（ARCH §7.4）。开发机是 Windows，按 API 优先，开发机上的本地 Jev **不要求 / 未核实**（PRD §8 M0 中为可选项） |
| Jev 纯 CPU 推理的可用性与速度 | 官方文档未给 CPU 路线 | **未核实**；开发机有 NVIDIA 独显，不走这条路线，只影响没有独显的用户机器 |
| 开发机配置 | Wisdom 2026-10-30 17:56 告知：32 GB 内存 + NVIDIA RTX 4070 12 GB 独显；18:44 告知：Windows | 已告知；Windows 版本、驱动与 CUDA 版本**未告知**，只在做可选的本地实测时记录 |
| RTX 4070 12 GB 满足 Jev 官方显存要求 | 官方下限按后端：llama.cpp / Ollama ≥ 8 GB，vLLM / Docker ≥ 12 GB，SGLang ≥ 16 GB（ARCH §7.4「开发机」） | llama.cpp / Ollama：按文档满足；vLLM / Docker：名义上恰好等于下限，扣除桌面显示等占用后可用显存是否 ≥ 12 GB **未核实**，文档也没说「GB」指 GB 还是 GiB；SGLang：不满足。显存够不等于能在 Windows 上部署（见上一行）；可选的本地实测时用 `nvidia-smi` 记录 |
| 开发机上本地跑通 Jev（启动自检 + 参考样例三项 ≤ 0.02） | 官方 CUDA 路线只在 Linux + NVIDIA 上写明；llama.cpp CUDA 构建与 Ollama Windows 版运行 Jev 的说明都没有，文档未提 WSL2 | **不要求 / 未核实**：18:44 起不是 M0 退出条件，只是可选实测（PRD §8 M0、ARCH §7.4「开发机」）；不做或不通过都不阻塞里程碑 |
| 开发机上 Jev 的峰值显存与单批（64 项）耗时 | — | **未实测**，只在做可选的本地实测时记录 |
| M0 的面壁 Jev API 实测（参考样例单项与批量、三项分数与参考值的差值、耗时、`usage`、国内站 base URL） | ARCH §7.4「开发机」、PRD §8 M0 | **待执行**（Wisdom 2026-10-30 19:11 决定延后，现在不跑，不阻塞规格文档）；执行前需在 Cursor Secrets 中添加 `MODELBEST_API_KEY` |
| MiniCPM-OCR 1.0 SDK（引擎 B 本地）在 Windows 上运行 | 上游两个验证环境是 Linux vLLM（RTX 5090 32 GB）与 macOS ARM64 llama.cpp（§2.2） | **未核实**；按 API 优先，开发机上的本地引擎 B **不要求**，引擎 B 默认走面壁文档解析 API |
| PaddleOCR / PaddleX 版面与公式流水线在 Windows + RTX 4070 上运行 | Paddle 3.3 有 Windows GPU 包（CUDA 11.8 / 12.6 / 12.9，计算能力 > 7.5，§2.4.1）；整条流水线无 Windows 实测记录 | **未实测**；按 API 优先在开发机上不要求，引擎 A 的三条路径都保留，开发用哪条随 M3 前的最终选择定（§2.4.1、§6.4） |
| 百度 AI Studio PaddleOCR 托管 API 能否作为引擎 A 模型阶段的来源：区域框与类别、公式 LaTeX、单张页面图输入、模型版本锁定、对应 Q10 的哪一档、价格与每日页数配额 | [异步 API 使用文档](https://ai.baidu.com/ai-doc/AISTUDIO/fml7mozw5)（2026-02-04）示例只取 Markdown，未写区域框与版本 | **未核实**，M3 开工前核实；核实通过才出现在选项里，是否作为默认随 M3 前的最终选择定（ARCH §7.0、§6.4） |
| TTS / ASR 的服务商 | — | **待定**，M7 选型；接入方式是服务商适配层（ARCH §7.9），变量名登记到 ARCH §15.4 |
| 在本地 Windows 开发机（不在 Cursor 云端 Agent 里）开发时，Cursor Secrets 如何注入环境变量 | Cursor Secrets 用于云端 Agent 的环境 | **未核实**；现在的做法：开发者自己设为系统用户级或会话级环境变量，值不进仓库里的脚本与配置（ARCH §15.4、RULES N-05）；Key 只放 Cursor Secrets 或用户本机安全存储、不写 `.env`、不进仓库（Wisdom 18:37）；Windows 凭据管理器的支持之后再加（Wisdom 2026-10-30 20:57） |
| 本机 worker 基础安装（不含模型）的体积 | — | **未实测**，M1 统计 |
| 本机模式自备渲染图的 Jev 分数与官方 Docker / 面壁 API 的一致性 | 上游说明 macOS 只能跑纯评分服务、分数不能与官方数值比较 | **未核实**；按 PRD QM-14 单独定标 |
| 百度「通用文字识别（高精度含位置版）」对学术公式的识别能力、当前计价与免费额度 | 官方文档只描述接口与字段 | **未核实**，M6 接入前确认 |
| 智谱 GLM-OCR 在 OmniDocBench V1.5 得分 94.62 | 智谱官方模型介绍 | **未核实**（官方自测） |
| 智谱 GLM-OCR 的公式输出格式与质量、价格稳定性 | 官方文档 | **未核实**，M6 实测 |
| 智谱 OCR 服务（`files/ocr`，`tool_type: hand_write`）对印刷体论文是否适用 | 官方文档定位为手写体识别 | **未核实**；v2 默认不接入 |
| `export.arxiv.org` 是否提供 `/src/<编号>` 源码下载 | arXiv Bulk Data 页面建议程序访问使用 `export.arxiv.org`，未说明源码路径 | **未核实**，M4 前确认；v1 实际使用 `https://arxiv.org/src/` |
| arXiv「每三秒一次、单连接」限制是否适用于源码下载 | arXiv API 使用条款只列旧版 API、OAI-PMH、RSS | 条款**未明确**；v2 按同一口径执行 |
| PP-DocLayout_plus-L 相对 V3 是否「明显更好」 | — | 无数据；M3 基准对照后由用户拍板（PRD QM-13） |
| Markdown 方案调研表中 Logseq、VS Code 两栏 | Loom 方案「调研结论」（方案自述部分来自已有产品知识） | **未核实** |
| Markdown 方案调研表中其余竞品条目（Obsidian 用 MathJax、Typora 监视文件夹、Zettlr 3.0 起默认载入外部修改等） | Loom 方案附官方链接 | 本 PR **未逐条复核**；不作为规格依据，只作为设计参考 |
| 文件事件去抖 300 ms、外部修改 1 秒内更新、1 万个文件确认、单文件 5 MB 截断 | Loom 方案建议值 | **未实测**，待定标（ARCH §4.5.6；PRD QM-15–QM-17） |
| markdown-it 或 micromark / mdast 能给出足以支持 `serialize(parse(t)) === t` 的源码位置 | 两库文档（本 PR 未查阅；需要确认行内节点是否有字符级偏移） | **未核实**，M2 选型时用往返属性测试验证 |
| Node `fs.watch` 递归模式在 Windows / macOS 上对「原子替换保存」与重命名的事件表现；chokidar 当前版本的许可证与依赖 | — | **未核实**，M2 实测后选型 |
| Electron `webUtils.getPathForFile`（拖入文件取路径）在锁定版本中可用 | Electron 文档 | **未核实**，M2 随 Electron 版本锁定确认 |
| KaTeX 对 Obsidian 笔记常见写法（`\begin{align}` 自动编号、部分 AMS 宏）的覆盖程度 | Loom 方案「代价」一栏 | **未量化**；不支持的公式显示原文加错误标记（PRD AC-31） |
| Anthropic 应锁定哪个 `anthropic-version` | [Messages](https://docs.claude.com/en/api/messages) 示例为 `2026-10-21` | **未核实**是否为当前推荐值；实现时按当时文档定，写进注册表（ARCH §7.9.6） |
| 智谱 `layout_parsing` 的 `Authorization` 是否带 `Bearer` 前缀 | OpenAPI 定义为 Bearer，指南示例不带 | **未核实**；M6 接入前用真实 Key 确认（§2.10） |
| 百度 OCR 用 API Key 鉴权时的请求头写法 | [鉴权文档](https://ai.baidu.com/ai-doc/REFERENCE/Ck3dwjhhu)列出三种方式 | **未核实**；现在用 access_token，核实后加入 API Key 方式（Wisdom 2026-10-30 20:57） |
| 千帆 v2 逐模型支持 `detail` 与 `stream_options.include_usage` 的清单；千帆文本生成页的当前地址 | [视觉理解](https://cloud.baidu.com/doc/qianfan-api/s/rm7u7qdiq)只写了部分模型 | **未核实**，M5 实现时核对 |
| Gemini OpenAI 兼容端点与原生端点在用量与错误体上的差异 | [OpenAI 兼容文档](https://ai.google.dev/gemini-api/docs/openai) | **未核实**；默认用原生格式，兼容端点为备选（Wisdom 2026-10-30 20:57） |
| 各服务商的预置模型清单与单价 | 各家官方文档 | **未核实**；实现时按当时文档填写并记 `verifiedAt`，单价未核实的按次数类上限管（ARCH §7.8、§7.9.8） |
| Electron fuse `EnableEmbeddedAsarIntegrityValidation` 在各平台上的支持情况 | Electron `docs/tutorial/fuses.md`（2026-10-30 查阅 main 分支） | **未核实**，M1 按锁定版本复核（ARCH §9） |
| CSP 草案能否不放宽就跑通 KaTeX 与 PDF.js；`oi-asset://` 是否必须注册为 `standard` | — | **待 M2 实测**；任何放宽都要 ADR（ARCH §9） |

## 8. 本文结论在规格中的落点

| 结论 | 落点 |
| --- | --- |
| 模型名称、能力、许可证、成熟度 | 本文 §2；RULES §1.5 |
| B 是流水线、A/B 版面可能同源、B 用图片输入与 `ppdoclayout3_torch` | ARCH §7.1、§10.3 |
| Jev verdict 映射、阈值、批量、部署位置与推荐（Q9）、全路径评分（Q1） | ARCH §7.1、§7.2、§7.3、§7.4、§10.3；PRD S5、§2、AC-18–AC-20、QM-05、QM-14 |
| PyMuPDF → pypdfium2；项目许可证 Apache-2.0 | ARCH §7.1、§10.3、G10；PRD §9 Q6；RULES §1.5；`LICENSE` |
| 多模态补救在区域采用前完成，可先试 B 区域候选 | ARCH §7.1 |
| 草案目录与门槛改为切片与硬上限 | ARCH §3、§6、§13 |
| 手机、同步移出 v2；写作移出实现、架构预留；不做 v1 迁移；不接 Unlimited-OCR | PRD §3.2；ARCH §4.4 |
| UI 与业务核心解耦 | ARCH §2.1–§2.6、§13 G13–G16；RULES §8；PRD S12、AC-21 |
| arXiv 源码校准公式、云 OCR、公式候选优先级链 | ARCH §7.5–§7.7；PRD S4、AC-22–AC-26 |
| 基准集真实规模与阅读顺序真值缺口 | PRD §7；v1 审查 §6 |
| 决策记录 Q1–Q12 | 本文 §6；PRD §9；ARCH §16 |
| Markdown 阅读方案（D1–D7）、译文按区块存 Markdown | 本文 §6.1；ARCH §4.5、§8.1.1；PRD S13、§3.2、US-23–US-28、AC-30–AC-56、QM-15–QM-17、§8.1；RULES N-18；方案原文 `docs/design/md-reader.md` |
| Jev 的 API 服务商是面壁开放平台、设置「本地 / API」、`MODELBEST_API_KEY` 的保管、引擎 B 的面壁 API 来源（Wisdom 2026-10-30 18:37） | 本文 §2.3.1、§7；ARCH §1、§2.6、§4.2、§7.1、§7.3、§7.4「面壁 API」、§8.3、§10.1–§10.3、§16；PRD §2、S2、S5、§3.3、US-19、US-29、US-30、AC-19、AC-20、AC-59、AC-60、QM-14、M6、§9 |
| API 优先：每个模型能力默认托管 API、「本地」是同一接口后的一等选项、硬件只标可行性、开发机 Windows 上不要求本地、M0 只要求 API 路径、开发密钥只以环境变量提供（Wisdom 2026-10-30 18:44） | 本文 §0 第 4 条、§2.3、§2.4.1、§6.3、§7；ARCH §1、§2.5、§2.6、§4.2、§7.0、§7.1、§7.4、§7.7、§8.3、§10.3、§12、§15.4、§16；PRD §2、S2、S3、S5、S8、S9、§3.3、US-19、US-30、US-31、AC-20、AC-60、AC-61、M0、M3–M7、§9；RULES §4、§5 第 14 项、N-05 |
| 四项风险的决定：数据外发同意对话框、引擎 A 三条路径、问答支持多模态与纯文本模型、M0 API 实测延后（Wisdom 2026-10-30 19:11） | 本文 §0 第 4 条、§2.4.1、§6.3、§6.4、§7；ARCH §2.5、§4.2、§7.0、§7.1、§7.3、§7.4、§10.3、§16；PRD S2、S8、§3.3、AC-61、AC-62、M0、M3、M5、§9 |
| 外发同意按服务商、追加告知新增能力、「外发前询问」开关与「数据去向」列表（Wisdom 2026-10-30 19:30） | 本文 §6.4、§6.5；ARCH §2.5、§4.2、§7.0 第 6 条、§7.4、§16；PRD §3.3、AC-61 ⑦、§9 |
| 译文区块四项结论（翻译块范围、重译 seam、重译失败显示、缓存键论证） | 本文 §6.2；ARCH §2.6、§8.1.1；PRD S3、US-28、AC-03、AC-56–AC-58、§9；RULES §5 第 13 项 |
| 架构评审修复 A：`ingest` 编排切片、进程边界、预算闸门与 `budget` 切片、译文裁图、删除 G17（Wisdom 2026-10-30 19:57） | 本文 §0 第 12 条、§6.2.1、§6.6；ARCH §1、§2.5、§3、§4.1–§4.4、§5.2、§7.1、§7.3、§7.8、§8.1.1、§8.2、§9、§10.2、§13、§16；PRD §3.3、§4、AC-04、AC-06、AC-21、AC-45、AC-48、AC-49、AC-59、AC-63、§8、§9；RULES §5 第 15、16 条、§8 |
| 架构评审修复 B：同意规则措辞、外发检查端口、远程 worker 不收 Key、删除被取代的旧表述、`ProviderFailure`、存储与协议升级、Electron 加固；服务商适配层与各家 API 格式核实（Wisdom 2026-10-30 19:45、19:46、19:57） | 本文 §0 第 13 条、§2.10、§6.7、§7；ARCH §1、§2.5、§3、§4.1–§4.3、§5.1、§5.2 F-18、§7.0、§7.3、§7.4、§7.7、§7.9、§8.3、§8.4、§9、§10.1–§10.4、§12、§13、§15.4、§16；PRD §2、§3.3、US-32、AC-59–AC-62、AC-64–AC-67、§8、§9、§10；RULES §4、§5 第 17、18 条、N-05 |

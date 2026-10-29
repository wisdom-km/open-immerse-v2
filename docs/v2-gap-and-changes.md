# v2 差异与修改清单

状态：v0.1。日期：2026-10-30（Asia/Shanghai）；上游查询时间 2026-10-29（UTC）。
用途：把三类输入——用户提供的双引擎方案（[附件原文](./architecture/inputs/pdf_translation_architecture.md)）、`docs/architecture/` 下的 01 / 02 / 03 草案、v1 实际实现（见 [v1 审查](./v1-review.md)）——与上游模型的官方资料逐条对照，列出**需要改的地方、冲突点、未核实的说法**，并给出统一编号的待拍板问题。
结论已写入根目录规格：[PRD.md](../PRD.md)、[ARCHITECTURE.md](../ARCHITECTURE.md)、[RULES.md](../RULES.md)。三份规格与本文冲突时以规格为准；本文记录「为什么这样改」。视觉与交互规格 [DESIGN.md](../DESIGN.md)、[docs/design-principles.md](./design-principles.md) **待 Loom 产出**，本文不涉及。

---

## 0. 结论先行

1. **五个模型名都真实存在**，没有编造的名称；但多数是近期发布，成熟度风险高：MiniCPM-OCR 仓库 2026-10-27 才创建（查询时公开约 2 天），Unlimited-OCR v2 同日发布，PP-DocLayoutV3 发布于 2026-01-20。实施时必须锁定提交与权重摘要。
2. **引擎 B 不是「一个模型端到端」**：MiniCPM-OCR 1.0 官方 SDK 是「PP-DocLayoutV3 版面 → 裁剪 → MiniCPM-OCR 1.0 识别 → 按序组装」的流水线；阅读顺序来自 PP-DocLayoutV3，不来自 OCR 模型。A 若也用 PP-DocLayoutV3，**A/B 的版面判断不独立**（Q10）。
3. **Jev 的 0~1 分不是全部**：只有 `verdict = scored` 才是有效分；`precheck_reject`、`render_error`、`missing_original_image` 返回占位 0.0，`encode_error`、`forward_error` 返回 -1.0，都必须当作「错误」而不是「低分」，否则会误触发付费补救。默认阈值 0.5 只影响统计，不改原始分。
4. **Jev 不适合在 8 GB 目标设备本机运行**：官方最低要求是 NVIDIA ≥ 8–12 GB 显存或 Apple M 系列 ≥ 16 GB 统一内存；且只有 Docker 镜像（Linux + NVIDIA）的渲染环境与云 API 一致、分数可直接比较。v2 默认走远程 / Docker 服务（Q9）。
5. **PyMuPDF 是 AGPL-3.0 / 商业双许可**，附件和草案 03 把它定为统一预处理库；MiniCPM SDK 的 PDF 输入与 Unlimited-OCR 示例也依赖它。建议 worker 预处理改用 pypdfium2（BSD-3-Clause / Apache-2.0），由我们渲染页面图再以图片交给 MiniCPM SDK（Q6）。
6. **MinerU 许可证已不是 AGPL**，而是自定义的 MinerU Open Source License（Apache-2.0 加附加条款）；且 MinerU 3.0 起阅读顺序改由 PP-DocLayoutV2 给出，不再是「纯几何规则」。附件「借鉴 MinerU 几何规则」只能借思路，不能引入代码或依赖（RULES §1.5）。
7. **Unlimited-OCR 存在（MIT），但未见 bbox 输出**，是面向多页长文档的端到端模型，无法满足「点击段落跳回原文」的定位要求，v2 不接入（Q12）。
8. 草案 01 的多端 / 云 / 写作目录与里程碑、按层组织的目录、400 行「软门槛」与用户的新要求冲突，已在 ARCHITECTURE 中改为功能切片 + 硬上限，并把手机、同步、写作移出 v2（Q3、Q5）。
9. v1 的若干历史决定被新方案取代：「桌面智能版式只用 PP-DocLayoutV2、默认文字层原序」「多模态是公式第二层」「整页多模态替换」都不再沿用；「通顺试接」在 v1 中只有文档、没有代码，v2 需要新实现并定标。

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
| pypdfium2 | **已核实**（仅元数据） | PyPI `pypdfium2` 5.14.0 | BSD-3-Clause / Apache-2.0（另含 PDFium 等依赖许可证，M1 需逐项复核） | PDFium 的 Python 绑定：渲染、文字与字符框 | 本文建议的 PyMuPDF 替代（Q6） |

### 2.2 MiniCPM-OCR 1.0（引擎 B）

- **流水线**（`docs/minicpm_ocr_1dot0_en.md:45-56`）：页面图 → PP-DocLayoutV3 检测区域并给出阅读顺序 → SDK 裁剪 → MiniCPM-OCR 1.0 逐区域识别 → 按顺序组装 Markdown。表格由 OTSL 转 HTML，公式为 LaTeX。
- **块级中间记录**（`sdk/minicpmvocr/pipeline/_layout_record.py`）字段：`block_id`、`label`、`bbox`、`regions`、`order`、`score`、`crop_filename`、`skip_vlm`。其中 `block_id` 与 `order` 是同一个运行内序号，**不能**当作 v2 的稳定块号（ARCHITECTURE §8：稳定块号由 `document` 切片生成）。
- **版面后端三选一**（`docs/minicpm_ocr_sdk_api_en.md:26`、`sdk/minicpmvocr/layouts/__init__.py:17`）：`ppdoclayout3_paddlex`、`ppdoclayout3_torch`（不需要 PaddlePaddle）、`ppdoclayout3_server`。v2 的 B 引擎建议用 `ppdoclayout3_torch`，避免与 A 的 Paddle 运行时挤在同一环境。
- **输入**：SDK 同时接受图片与 PDF（`sdk/minicpmvocr/pipeline/_inputs.py:50-90`）；PDF 路径在 `:94-97` 处 `import fitz`（PyMuPDF）。因此 v2 由 worker 预处理统一渲染页面图后以图片输入 SDK，**不安装** SDK 的 `pdf` extra，也不 fork SDK。
- **模型本身**：基于 MiniCPM-V 4.6 训练，SigLIP 视觉编码器 + Qwen3.5 语言模型，依赖 Transformers 5 的模型集成（`docs/minicpm_ocr_1dot0_en.md:38`）。HF 另有 `-gguf`、`-AWQ`、`-GPTQ` 等变体。
- **硬件与环境**：vLLM 路线的命令在 RTX 5090 32 GB 上验证，要求 NVIDIA 驱动 ≥ 580（CUDA 13）、磁盘 ≥ 40 GB，其中 GPU 版 SDK 环境约 9 GB（CPU 版不到 1 GB）、vLLM 需从固定提交源码编译（`docs/minicpm_ocr_tutorial_en.md:17-20`）——只适合远程服务。llama.cpp b11901 的服务命令用官方 macOS ARM64 包验证，**未写具体芯片与内存**（`docs/llamacpp_deploy.md:23`）。这些都是「验证环境」，不是最低配置声明。
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
| 图片编码 | 云 API 要求 `data:image/png;base64,` 前缀；Docker API 要求**不带**前缀，带了该项返回 `encode_error` | 同上 `:28`；`docs/minicpm_ocr_jev_docker_api_en.md:17` | 云与 Docker 共用一个适配器，但编码方式按配置切换，并有契约测试覆盖两种形态 |
| 渲染一致性 | Docker 镜像内置固定版本 Chromium 与 CJK 字体，渲染与云 API 一致，分数可直接与官方数值比较；SDK 部署的渲染器随宿主环境变化，排序稳定，绝对值可能在小数点后第三位不同。macOS 上**不支持**「渲染 + 评分」服务（固定字体环境依赖 `apt-get`），只能跑纯评分服务、由调用方自备渲染图，且分数不能与官方数值比较。Docker API 返回 `template_md5`，与训练模板不一致时分数不可比 | `docs/minicpm_ocr_jev_tutorial_en.md:28-32`、`docs/SKILL_jev_en.md:18-25`、`:96`、`:367`、`docs/llamacpp_deploy_jev_en.md:210`、`docs/minicpm_ocr_jev_docker_api_en.md:61` | 阈值按「部署方式 + 渲染环境」分别定标并记入 `evaluatorVersion`；不同部署的分数不混用；适配器在健康检查时记录 `template_md5`，变化即视为新的 `evaluatorVersion` |
| 硬件 | Docker：NVIDIA ≥ 12 GB、驱动 ≥ 535；llama.cpp / Ollama：NVIDIA ≥ 8 GB 或 M 系列 ≥ 16 GB 统一内存；SGLang：≥ 16 GB | `docs/minicpm_ocr_jev_tutorial_en.md:17`、`docs/SKILL_jev_en.md:31`、`docs/llamacpp_deploy_jev_en.md:34`、`docs/ollama_deploy_jev_en.md:34`、`docs/sglang_deploy_jev_en.md:30` | 8 GB Windows / M1 8 GB 目标设备不本机跑 Jev；默认走远程（云 API 或用户 Docker 服务），本机 SDK 部署为可选（Q9） |
| 精度 | 宣称 JevOCRBench AUROC × 100 = 93.6 | 模型卡 | **未核实**（官方自测，§7） |

草案 03 §9 的总体判断（只有 `scored` 是有效分、错误不是低分、0.5 不适用于本产品）是正确的，本文只补全遗漏的两个 verdict、批量上限、图片编码差异与渲染一致性约束。

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
- **A/B 共享依赖**：附件让 A 选「PP-DocLayout-L 或 PP-DocLayoutV3」，B 内部固定用 V3。A 若选 V3，两条分支的版面判断同源，A/B 一致不能当作「两个专家互相印证」。草案 03 §2 已指出这一点；ARCHITECTURE §7.1 已写入，A 的选型列为 Q10。
- A 即使用 V3，也只把模型给出的顺序作为「候选 / 对照证据」，正式顺序由项目自写算法给出并版本化（草案 03 §2 的要求保留）。

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
- v1 的历史规划曾想接「百度托管文档解析（Unlimited-OCR）」（见 [v1 审查](./v1-review.md) §4.5），已被双引擎方案取代。v2 不接入（Q12）；若将来需要「整篇长文档快速通读」再单独评估。

### 2.7 MinerU

- 许可证：PyPI 元数据为 `LicenseRef-MinerU-Open-Source-License`，即 Apache-2.0 加附加条款：月活超 1 亿或月收入超 2000 万美元需商业许可、提供在线服务须署名、违约自动终止。**不在** RULES §1.5 白名单内。
- 许可证在 2026 年内反复变更（`LICENSE.md` 提交记录，已用 `gh api` 复核）：03-20 AGPL-3.0 → Apache-2.0，03-28 改回 AGPLv3，04-14 → Apache-2.0，04-17 → MinerU OSL。各版本以发布时的 LICENSE 为准：2026-04-14 之前的大部分版本（包括 03-29 发布的 3.0.0）是 AGPL-3.0。
- 阅读顺序：0.9.0（2024-10-31）起用 LayoutReader（权重为 CC-BY-NC-SA 4.0，非商用）；3.0.0（2026-03-29）移除 LayoutReader 以及 AGPL 的 doclayoutyolo、mfd_yolov8，现在由 PP-DocLayoutV2 的模型输出给出顺序（`mineru/model/layout/pp_doclayoutv2.py`）。当前 PDF 库是 pypdfium2。附件「借鉴 MinerU 的几何规则思路」对应的是旧版本思路。
- v2 处理：只借鉴思路，不引入 MinerU 任何版本的代码、权重或依赖（旧版有 AGPL 与非商用权重风险，新版有自定义条款）；需要模型排序时直接用 Apache-2.0 的 PP-DocLayoutV2 / V3，需要规则排序时参考 PaddleX `xycut_enhanced`；v1 已有的 `lib/pdf-flow-join.js` 跨栏 / 跨页续接规则（MinerU 式，[v1 审查](./v1-review.md) §4.13）是可直接移植的自有资产。

### 2.8 PDF 库许可证

| 用途 | 附件 / 草案 | 风险 | v2 建议 |
| --- | --- | --- | --- |
| worker 预处理（文字层检测、页面渲染、字符框） | PyMuPDF | AGPL-3.0：随桌面分发或作为网络服务提供时有源码公开义务；或购买 Artifex 商业许可 | 默认 pypdfium2；PyMuPDF 仅在用户批准（Q6）后使用 |
| MiniCPM SDK 的 PDF 输入 | SDK `pdf` extra → PyMuPDF | 同上 | 不装 `pdf` extra，以图片输入 SDK |
| Unlimited-OCR 示例 | PyMuPDF | 同上 | 不接入（Q12） |
| 桌面阅读与文字层基础档 | — | — | `pdfjs-dist`（Apache-2.0） |

- PyMuPDF 2.0 新增的 Office 相关能力需另购许可，与本项目无关，不展开。
- 换库的代价：草案 02 §5 的坐标合同按 PyMuPDF 写；换成 pypdfium2 后，`CoordinateFrame.renderer` 记录实际库名与版本，旋转 / CropBox 的矩阵需在 M3 对 0 / 90 / 180 / 270 度与非零 CropBox 重新验证（草案 02 §5 的测试要求保留）。

### 2.9 成熟度与锁定

| 项 | 公开时间（查询时） | 风险 | 要求 |
| --- | --- | --- | --- |
| MiniCPM-OCR 仓库 / SDK 1.0.3 | 2026-10-27 创建，约 2 天 | 接口、字段、部署脚本可能快速变化；官方基准雷达图自注「some values remain to be confirmed」（`docs/minicpm_ocr_1dot0_en.md:131`） | 锁定仓库提交（当前 `1269e4f`）、SDK 版本、权重 sha256；M6 开工前复核一次 |
| MiniCPM-OCR-1.0 / Jev 权重 | 2026-10-21 起 | 同上 | 记入 worker `runtime/` 模型清单 |
| Unlimited-OCR-2 | 2026-10-27 | 不接入 | — |
| PP-DocLayoutV3 | 2026-01-20 | Paddle 文档矛盾 | 锁定 PaddleOCR / PaddleX 版本，M3 实测 |

## 3. 附件（用户双引擎方案）需修改处

| 附件位置 | 原说法 | 核实 / 冲突 | 改为 | 写入 |
| --- | --- | --- | --- | --- |
| §1 输入层 | 用 PyMuPDF 打开 PDF、检测文字层、渲染页面 | AGPL 风险（§2.8） | worker 预处理默认 pypdfium2；文字层检测按页、可信度按区域判断（草案 03 §3） | ARCH §7.1、§10.3；Q6 |
| §1 输入层 | 渲染 300 DPI 左右 | 合理起点，非常量 | 作为配置，按模型输入限制、清晰度、内存定标 | PRD QM-06 / QM-07 |
| §2 分支 A | 版面用 PP-DocLayout-L 或 PP-DocLayoutV3 | 二者能力不同（§2.4）；选 V3 则与 B 共享依赖 | 选型列为 Q10；本文假设先用 V3，对比时标注共享依赖，基准另跑 plus-L 对照 | ARCH §7.1；Q10 |
| §2 分支 A | 阅读顺序自己写，借鉴 MinerU 几何规则 | MinerU 已改用模型排序、许可证非白名单（§2.7） | 自写算法版本化；借鉴 v1 `pdf-flow-join.js` 与 PP-StructureV3 `xycut_enhanced` 思路；「通顺试接」作为新实现 | ARCH §10.3 `reading_order/`；v1 审查 §4.13 |
| §2 分支 A | 表格「可选」转 Markdown | 合并单元格、跨页表格范围未定 | 首版保留表格结构候选 + 原图；复杂结构在 Markdown 导出时声明降级 | PRD S2；ARCH §7.2 |
| §3 分支 B | MiniCPM-OCR 1.0 直接端到端解析，输出含阅读顺序 | 实际是 SDK 流水线，顺序来自 PP-DocLayoutV3（§2.2） | 称「端到端流水线」；接块级中间记录而非只接 Markdown | ARCH §7.1、§10.3 `e2e_b/` |
| §3 分支 B | 内部使用 PP-DocLayoutV3 | **正确** | 保留；补充「与 A 可能同源」 | ARCH §7.1 |
| §4 统一输出层 | 两分支输出相同格式的结构化 Markdown | Markdown 丢失 bbox、来源、公式关联，无法支撑定位与重锚定 | 权威数据为 JSON 文档模型（候选页 → 采用版本），Markdown / LaTeX 为导出投影（草案 02 §3 的结论） | ARCH §8.1 |
| §5 质量评估层 | Jev 对每个区域打分（0~1），低分标记 | 缺错误占位、阈值语义、批量上限、部署约束（§2.3） | 规范状态 `scored / error / unavailable / not-run`，只有 `scored` 带分；阈值按类别定标 | ARCH §7.3；PRD AC-05、QM-05 |
| §6 多模态位置 | 放在翻译层之前**或并行** | 若与翻译并行，同一区域会先用未核验内容翻译，补救后译文作废、重复计费 | 区域补救必须在该区域**采用之前**完成；其他已采用区域的翻译可以并行进行 | ARCH §7.1 |
| §6 多模态 | 只处理 Jev 低分区域 | 用户已确认：低分**或有明确不确定证据的公式**都可核验 | 两类入口；服务错误、未评分不算证据 | PRD S4、S5；ARCH §7.1 |
| 可选补充 | Unlimited-OCR（超长文档，低优先级） | 无 bbox（§2.6） | v2 不接入 | Q12 |
| 对比表 | B「阅读顺序：模型直接输出」 | 顺序来自版面模型 | 改为「PP-DocLayoutV3 给出」 | 本文 |
| 实现建议 2 | 通过配置切换当前分支 | 切换会覆盖已采用结果的风险 | 区分 `compare`（只新增候选）与 `adopt`（原子切换采用版本） | PRD AC-13；ARCH §4.2 `document` |
| 实现建议 4 | 两套方案都接入 Jev | 正确 | 保留；Jev 不可用时状态为 `unavailable`，不触发补救 | ARCH §7.3 |

## 4. 草案 01 / 02 / 03 需修改处

### 4.1 草案 01（桌面、多端与云端）

| 位置 | 草案写法 | 冲突 | 改为（权威位置） |
| --- | --- | --- | --- |
| §1、§9、§11、§13 后半 | 手机派任务、账号同步、在线桌面接单、官方云路线 | 用户本轮要求「v2 只做桌面端」 | 移出 v2，只在契约里保留余地，不建目录、不写代码（PRD §3.2；Q3） |
| §1、§10.1、§12 W1 | 写作辅助在 PDF 核心后独立实现 | 不在本轮列出的复用范围内 | 移出 v2，另立（PRD §3.2；Q5） |
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
| §5 | 坐标合同按 PyMuPDF / PDF.js 写 | 合同保留；渲染库待 Q6，`CoordinateFrame.renderer` 记录实际库与版本 |
| §6 | `FormulaCandidate.engineId: 'paddle-modular' \| 'minicpm-pipeline' \| 'multimodal-repair'` | 改为配置值 `EngineId`，模型名只出现在 adapters 与 `EngineCapabilities.models[]`（ARCH §7.3、F-13） |
| §6 末 | arXiv 源码校准是否保留待定 | Q4 |
| §6 | `EvaluationResult` 四态 | **保留**；补 `detailCode` 映射（本文 §2.3） |
| §7 | `⟦fN⟧` 占位 + 片段表哈希 | **保留**（v1 审查 §4.6；ARCH `translation/domain/placeholder.ts`） |
| §10 | blocks-1 导入迁移表 | 保留为 v1 导入器设计，是否做见 Q8 |
| §11 | 同步 canonical 与缓存 | 同步移出 v2 |

### 4.3 草案 03（双引擎与质量评估）

草案 03 的上游描述总体准确，以下是需要补充或修改的地方：

| 位置 | 草案写法 | 处理 |
| --- | --- | --- |
| §1、§3 | 输入统一使用 PyMuPDF | Q6；默认 pypdfium2 |
| §2 | Paddle 公开 PP-DocLayout-L、plus-L、PP-FormulaNet-L、plus-L | 正确；补 Paddle 文档自相矛盾（§2.4） |
| §5 | B 应接块级中间结果 | 正确；补 `block_id` 与 `order` 是同一序号、建议 `ppdoclayout3_torch`、以图片输入（§2.2） |
| §6 | TS `ParseEngine` 接口、`EngineId` 联合类型 | 拆为 TS 侧 `ParseGateway`（application 端口）与 Python 侧 `DocumentEngine`（worker 内部）；`EngineId` 改为配置值（ARCH §7.2、§7.3） |
| §9 | verdict：`render_error` 为 0、`encode_error` / `forward_error` 为 -1 | 补 `precheck_reject`、`missing_original_image`（0.0）与其他非 `scored` 值；补 64 项批量上限与渲染一致性（§2.3） |
| §10 | 补救路由：先试 B 区域候选，仍低分再多模态 | 保留，B 区域候选以 `capabilities` 声明为前提（ARCH §7.1） |
| §11 | 「Paddle、MiniCPM、Jev 重推理由用户配置的服务承担」；vLLM 验证 RTX 5090 32 GB；另有 llama.cpp CPU / Metal 路径 | 正确；补 Jev 硬件下限（§2.3），说明 M1 8 GB 不本机跑 Jev；Metal 路径只验证了 macOS ARM64 包，芯片未写 |
| §11 | Paddle 与 MiniCPM / Jev 用隔离环境或独立服务 | **保留**（ARCH §10.3：按引擎分 extras / venv / 容器） |
| §13 | 官方来源指向 `main` | 规格中注明锁定提交 `1269e4f`（MiniCPM-OCR） |

### 4.4 需求对齐记录（`docs/architecture/README.md`）

| 已确认项 | 与本轮要求的关系 | 处理 |
| --- | --- | --- |
| 多端互通、手机派任务、账号同步、官方云入口 | 本轮用户指令「v2 只做桌面端」更新 | 移出 v2，只留接口余地（Q3） |
| 写作辅助在 PDF 核心后实现 | 本轮复用范围未列写作 | 移出 v2（Q5） |
| 最低硬件不要求本地同时跑两套解析与 Jev | 与 §2.3 的 Jev 硬件下限一致 | 保留（PRD §2） |
| 其余（双引擎、统一产物、公式不确定处理、自动补救开关与预算、语音首批能力） | 一致 | 保留 |

## 5. 与 v1 实现 / v1 文档的冲突

| v1 做法 | 出处 | 新方案 | v2 处理 |
| --- | --- | --- | --- |
| 桌面智能版式只用 PP-DocLayoutV2，默认文字层原序 | `docs/ui-phase2-plan.md:323`、`docs/architecture-redesign.md` §11 | 引擎 A 为主力 | 文字层原序降为无服务时的「文字层基础档」（Q2） |
| 公式七级兜底，多模态为常规第二层 | `lib/formula-contract.js:10-20`、`REQUIREMENTS.md` §2.6 | 多模态只处理低分 / 不确定区域 | 兜底顺序重排（v1 审查 §4.1），判据数值保留 |
| OCR 层为桩、矢量重绘未实现 | `lib/formula-tiers/ocr.js:9-10`、`vector.js:12-18` | OCR 由引擎 A / B 产出 | 矢量重绘不进 v2 |
| 整页多模态替换（#189，7 轮不收敛，默认关） | `lib/mm-page.js:21` | 只做区域补救 | 丢弃；页面版本切换由原子采用完成 |
| 「通顺试接」 | 只在 `docs/architecture-redesign.md:185-198`，`:168` 自述未写代码 | 自写阅读顺序 | 新实现，打分模型、窗口、阈值由基准定标；不当作已有资产 |
| 旧本机服务 `127.0.0.1:8765` 的 `/v1/layout` | `lib/pdf-layout-client.js:12` | `oi-parse/1` | 不兼容；旧数据只经迁移器读取（Q8） |
| 多模态账本按页计数，不计金额 | `lib/formula-mm-ledger.js` | 受限 / 不设金额上限预算 | 账本改为金额与次数双口径，带预留与结算 |
| 未配置翻译时借用多模态服务翻译 | `lib/translate-borrow.js` | 未提及 | Q11 |
| 文献库与笔记存 IndexedDB | `lib/library-store.js:41`、`lib/notes-store.js:36-55` | SQLite + 文件 | 规则复用，存储重写；迁移见 Q8 |
| 诊断日志 7 天 / 2 MB | `lib/diag-log.js:15-17` | — | 沿用为默认值（ARCH §11） |
| 两步润色默认开 | `lib/storage.js:68` | — | 保留为设置项，默认值沿用 |
| 测试语料：30 篇 / 639 页预标注、134 页人工复核、1,000 个公式单元 | `corpus/manifest.json`、`labels/*` | 基准集 | 作为公式基准起点；**不是**阅读顺序真值，顺序基准需另建（PRD §7） |

## 6. 需要用户拍板的问题

编号在 PRD、ARCHITECTURE、RULES、v1 审查中通用。「本文假设」是规格先行采用的做法，用户否决后按 RULES §7 同步修改。

| 编号 | 问题 | 本文假设 | 影响 |
| --- | --- | --- | --- |
| Q1 | MiniCPM-OCR 1.0（引擎 B）与 Jev（质量评估）已核实存在，但公开仅约 2 天。是否仍按附件把 B 作为「对比 + 兜底」、Jev 作为质量评估主方案？ | 是；锁定提交与权重摘要，M6 开工前复核一次；Jev 不可用时状态为 `unavailable`，只显示原图与候选，不触发补救 | M6 范围；PRD S2、S5 |
| Q2 | 「文字层基础档」是否作为无服务时的默认降级？ | 是 | M2 范围；PRD S2、AC-11 |
| Q3 | v2 只做桌面端，同时支持远程 / 自建 worker；手机、账号同步、官方云只在契约中留余地、不建目录。是否同意？（与需求对齐记录中的多端条目衔接） | 是 | 目录结构；PRD §3.2 |
| Q4 | arXiv 源码校准公式是否保留为可选候选来源？ | 不进入 M0–M8；规则与测试资产保留在 v1 审查，后续单独评估 | `formula` 切片是否有 arXiv 适配器 |
| Q5 | 写作辅助是否移出 v2？ | 是，PDF 核心闭环后另立 | 里程碑 |
| Q6 | worker 的 PDF 渲染与文字提取用哪个库？PyMuPDF（AGPL / 商业许可）还是 pypdfium2（BSD-3-Clause / Apache-2.0）？ | pypdfium2；MiniCPM SDK 以图片输入；如用户接受 AGPL 义务或购买商业许可可改 | 许可证、坐标合同验证；RULES §1.5 |
| Q7 | 本机 worker 传输：HTTP + SSE（与远程同协议）还是 stdio JSON-RPC？ | HTTP + SSE，`127.0.0.1` + 一次性令牌；只有一个客户端实现 | ARCH §10.1 |
| Q8 | 是否做 v1 数据迁移器（读取 v1 导出包，导入文献、笔记、已存译文）？ | 做，只读 v1 导出的 JSON 包、先 dry-run 报告；不读浏览器 IndexedDB；排在 M5 之后 | `library` 切片 `adapters/v1-import` |
| Q9 | Jev 部署在哪？ | 默认远程（官方云 API 或用户自建 Docker 服务）；本机 SDK 部署为可选，分数与阈值按部署方式分别定标 | ARCH §7.2、§10.3；PRD §2 |
| Q10 | 引擎 A 的版面模型：PP-DocLayoutV3（与 B 同源）还是 PP-DocLayout_plus-L（与 B 独立、无阅读顺序）？ | 先 V3；A/B 对比结果标注「版面同源」；基准中另跑 plus-L 对照后再定 | ARCH §7.1；QM-01 |
| Q11 | 是否保留 v1「未配置翻译时借用多模态服务翻译」？ | 保留为设置项，默认关 | `settings` 切片 |
| Q12 | Unlimited-OCR 是否接入？ | 不接入 v2（无 bbox、依赖 PyMuPDF 示例） | 无 |

另有两项不需要拍板、但需要用户知情：

- 许可证白名单（RULES §1.5）把 MinerU Open Source License、PyMuPDF（AGPL）以及任何非商用权重列为「需批准」。
- 全部「待基准定标」数值（PRD §6.2）在基准跑出前不填数。

## 7. 未核实的说法

| 说法 | 来源 | 状态 |
| --- | --- | --- |
| MiniCPM-OCR 1.0 在 OmniDocBench 等公开基准上的分数 | 官方 README / 模型卡 | **未核实**（官方自测，无第三方复现） |
| Jev 在 JevOCRBench 上 AUROC × 100 = 93.6 | 模型卡 | **未核实**（官方自测） |
| PP-FormulaNet_plus-L 的 BLEU 与 1476 ms 耗时 | Paddle 文档 | **未核实**（官方自测，硬件以表注为准） |
| Jev 官方云 API 的开通条件、价格、配额与服务稳定性 | `docs/minicpm_ocr_jev_api_en.md` 只描述接口 | **未核实**；Q9 若选云 API 需先确认 |
| MiniCPM-OCR 1.0 在 Apple Silicon 上可用的具体芯片与内存下限 | `docs/llamacpp_deploy.md:23` 只写 macOS ARM64 包 | **未核实** |
| MiniCPM-OCR 1.0 在 8 GB 核显 Windows / M1 8 GB 上本机运行 | — | **未核实**，规格不承诺 |
| PaddlePaddle 在 macOS ARM64 / Windows 核显上运行引擎 A 的实际速度与内存 | — | **未核实**，M3 实测 |
| PP-DocLayoutV3 在 `layout_analysis` 模块中的支持状态 | 文档第 25 行与第 100–115 行矛盾 | **未核实**，M3 实测 |
| PP-DocLayoutV3 对应论文已被 ECCV 2026 接收 | HF 模型卡 | **未核实** |
| PaddleOCR 的 `transformers` 推理引擎可运行 PP-FormulaNet / PP-DocLayout，从而免装 PaddlePaddle | `formula_recognition.en.md:221` 只列出引擎选项 | **未核实**，M3 实测 |
| Unlimited-OCR 是否有区域坐标输出 | 公开 README 与示例 | 未见，**未核实**是否存在隐藏接口 |
| pypdfium2 依赖链（PDFium 及其第三方库）的完整许可证清单 | PyPI 元数据只写「dependency licenses」 | **未核实**，M1 用许可证工具逐项确认 |
| 附件中「MiniCPM 方案开发量小、复杂版面开箱较好」 | 附件对比表 | **未核实**，以 A/B 基准结果为准 |

## 8. 本文结论在规格中的落点

| 结论 | 落点 |
| --- | --- |
| 模型名称、能力、许可证、成熟度 | 本文 §2；RULES §1.5 |
| B 是流水线、A/B 版面可能同源、B 用图片输入与 `ppdoclayout3_torch` | ARCH §7.1、§10.3 |
| Jev verdict 映射、阈值、批量、部署位置 | ARCH §7.2、§7.3、§10.3；PRD S5、§2、QM-05 |
| PyMuPDF → pypdfium2 | ARCH §7.1、§10.3；PRD Q6；RULES §1.5 |
| 多模态补救在区域采用前完成，可先试 B 区域候选 | ARCH §7.1 |
| 草案目录与门槛改为切片与硬上限 | ARCH §3、§6、§13 |
| 手机、同步、写作移出 v2 | PRD §3.2 |
| 基准集真实规模与阅读顺序真值缺口 | PRD §7；v1 审查 §6 |
| 问题清单 Q1–Q12 | PRD §9；ARCH §16 |

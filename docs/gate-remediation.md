# 门禁失败时的改正说明

工具原来的报错保持原样。失败时再在后面追加一段说明：编号、问题、改法、规格位置。文案只在 `tools/gate-remediation/catalog.json`。脚本调用 `tools/gate-remediation/format.mjs` 或 `run.mjs`，不另写一份。下表由这个文件生成，测试核对表和脚本没有漂移。

`tsc -b` 仍不是必需检查（PRD §8 的延后项；编号是 docs/backlog.md 的 M1-DEFER-G3）。G3 的违例样例在 `tools/gate-fixtures/g3/`，只由测试调用，不在主 `tsconfig` 的编译范围内。

<!-- gate-remediation-table:start -->
| 编号 | 问题 | 怎么改 | 规格 |
| --- | --- | --- | --- |
| G1 | ruff format 报告 worker 源码与当前格式不一致。 | 在 workers/parser 执行 uv run ruff format . 后重新提交。G1 的 Prettier 仍按 PRD §8 延后，不要为了这条去接 Prettier。 | ARCHITECTURE §13 G1、PRD §8 (M1 deferrals); docs/backlog.md M1-DEFER-G1 |
| G2 | ESLint 或 ruff 报错，常见是函数超过 80 行、圈复杂度超过 15、顶层 let、受限 import，或 ruff 的 E/F/I/UP/B/C901/PLR0915。 | 按工具点名的规则改。domain 纯函数与 Python core 不受 80 行限制，但仍受圈复杂度和文件上限约束。不要放宽规则或加行内禁用，除非有用户批准的 ADR。 | ARCHITECTURE §6、§13 G2、RULES §1.1、§1.2、§1.3 |
| G3 | tsc 报告类型错误。当前必需的是 tsc --noEmit，不是 tsc -b。 | 按 tsc 指出的文件和行列改正类型，直到 tsc --noEmit 退出码为 0。不要改成 tsc -b，也不要打开 composite。那一项的编号在 docs/backlog.md，是 M1-DEFER-G3。tools/gate-fixtures/g3 只给测试证明文案，不进入必需检查。 | ARCHITECTURE §13 G3、RULES §1.1、PRD §8 (M1 deferrals); docs/backlog.md M1-DEFER-G3 |
| G3-pyright | pyright strict 报告 Python 类型错误。 | 按 pyright 点名的那一行补类型或改正。检查器锁定 pyright 1.1.407。不要改回 mypy，也不要降低 strict。 | RULES §1.2、ARCHITECTURE §13 G3 |
| G4 | 源文件物理行数超过硬上限。普通源文件 600 行，入口 150 行，React 组件 400 行，测试 800 行。 | 把文件拆到上限以内。豁免只能写入 tools/check-file-size/allowlist.json，并带 ADR 与到期里程碑。不要调高上限。 | ARCHITECTURE §6、§13 G4 |
| G5 | dependency-cruiser 报告依赖方向违规，例如循环、层方向、跨切片内部、切片矩阵、renderer 隔离、Electron 范围、contracts 叶子或 providers 边界。 | 删掉这条 import，或改成 ARCHITECTURE §4.3 与 §5 允许的方向。任何切片都不要 import ingest 或 budget。ui-events-declared 仍是 M1-DEFER-G5，不要在这次里手写一份事件名单。 | ARCHITECTURE §4.3、§5、§13 G5、PRD §8 (M1 deferrals); docs/backlog.md M1-DEFER-G5 |
| G6 | import-linter 报告 Python 分层被打破，或 core 引用了禁止的模块。 | 按 workers/parser/pyproject.toml 的契约调整 import。层次是 api、jobs、engines 与 quality、preprocess、protocol。Python core 不要 import fastapi、starlette、httpx、torch、paddle、pypdfium2、pymupdf 或 fitz。 | ARCHITECTURE §10.3、§13 G6 |
| G7 | pnpm codegen 之后，已提交的生成文件和工作区不一致。 | 运行 pnpm codegen，把生成结果一起提交。不要手改生成文件。 | ARCHITECTURE §13 G7、RULES N-09 |
| G8 | pytest 失败，或一个用例都没收集到因而退出码为 5。 | 修好失败的用例。不要删测试，也不要把断言放宽来换绿灯。退出码 5 算失败。慢测试和付费测试按 RULES §4 标记，不要塞进这个门禁。 | ARCHITECTURE §13 G8、RULES §4 |
| G9 | gitleaks 在仓库里发现疑似密钥。 | 把密钥从该提交去掉，改用 ARCHITECTURE §15.4 登记的环境变量。契约测试的假 Key 用前缀 oitest_，已在 .gitleaks.toml 放行。不要把真 Key 写进 allowlist。 | ARCHITECTURE §13 G9、§7.9.7、§15.4、RULES N-05 |
| G10 | 依赖或模型权重的许可证不能与 Apache-2.0 并存，或 PDF 锁文件不是 pypdfium2。 | 换掉 GPL、AGPL（含 PyMuPDF 与 fitz）以及未经批准的 LGPL、非商用和自定义许可证。白名单是 MIT、Apache-2.0、BSD-2-Clause、BSD-3-Clause、ISC，以及只作为独立文件的 MPL-2.0。PSF-2.0 只允许 dev-only.json 里的包。uv.lock 必须含 pypdfium2，且不能含 pymupdf。 | RULES §1.5、ARCHITECTURE §13 G10 |
| G11 | 单个具名热点文件的 diff 超过 30 行。机器检查目前只数 composition-root.ts 和 slots.ts。 | 把这个 PR 里该文件的增删减到 30 行以内。被多个切片 import 的契约热点等有了 packages/contracts 再按 import 图计算，不要手写名单。 | ARCHITECTURE §13 G11、RULES §3 |
| G12 | 非生成改动超过 600 行，只改 packages/contracts 时超过 200 行，并且提交说明和 PR_BODY 里没有以 G12: 开头的理由。 | 拆开这个 PR，或在提交说明、或环境变量 PR_BODY 里写一行以 G12: 开头的不拆理由。pnpm-lock.yaml、workers/parser/uv.lock 和 dist/ 不计入行数。 | ARCHITECTURE §13 G12、RULES §2 |
| G13 | core、契约或路线代码依赖了界面，包括 type-only 的 react。 | 去掉这条依赖。这些路径不能依赖 react、路由、样式、electron、pdfjs-dist、ui-kit、切片的 src/ui，或 desktop 的 renderer 与 preload。 | ARCHITECTURE §2.1、§13 G13、RULES N-21 |
| G14 | core 的编译环境里出现了 DOM 或 Node 全局。 | 去掉 window、document、HTMLElement、KeyboardEvent、process 等用法。core 的 tsconfig 只有 lib ES2023，types 为空。 | ARCHITECTURE §13 G14、RULES §1.3 |
| G15 | 界面绕过 seam，直接碰到 domain、application、adapters、worker、存储或服务商。 | 界面只导入本切片的 pure.ts 和 contracts，或经 window.oi 调用。renderer、src/ui 和 pure.ts 不能到达 markdown 的解析实现。 | ARCHITECTURE §2.1、§13 G15、RULES N-21 |
| G16 | core 测试离开了 seam，或文件里写了 vitest 的 environment 指令。 | 测试放在 test/core/，只导入该切片的 index.ts、pure.ts 或 testing/。不要导入 react、testing-library、jsdom、happy-dom、ui-kit 或 src/ui。删掉该 environment 指令。环境固定为 node。 | ARCHITECTURE §13 G16、RULES §8.2 |
| G18 | 一个 PR 改了多个切片的 src，或解析规则集没有三边一起改。 | packages/features 下只留一个切片的 src。解析规则集必须同时改 parsing 的 text-layer、fixtures/parsing-rules 和 worker 纯规则，而且不能再带别的文件。带 docs/adr 下 ADR 文件的 PR 可以例外。 | ARCHITECTURE §13 G18、§7.10、RULES §2 |
| E-P1-5 | 提交标题不符合 Conventional Commits。 | 标题改成 feat、fix、docs、refactor、test、chore、build 或 ci，可选括号里的切片名，然后是冒号和空格。例如 fix(parsing): 修正阅读顺序。 | RULES §2 |
<!-- gate-remediation-table:end -->

# open-immerse v2 协作与编码规则（RULES）

状态：v0.6，规格基线（唯一真相源之一）。Q1–Q12 已由 Wisdom 于 2026-10-30 全部决定；v0.2 加入许可证政策（Q6）与 UI–core 解耦执行规则（Q3，§8）；v0.3 加入 Markdown 阅读相关规则（Wisdom 2026-10-30 17:32 批准的 Loom 方案：§1.3、§5 第 13 条、N-10、N-18、§7），以及「API 优先」与开发密钥规则（Wisdom 2026-10-30 18:44：§4、§5 第 14 条、N-05）。v0.4 按[架构评审](./docs/reviews/2026-10-30-architecture-review.md)修复（Wisdom 2026-10-30 19:57 批准）：§5 第 15、16 条（付费调用先预留额度、跨切片编排只在 `ingest`），§8 删除 G17、改由评审与交接说明检查。v0.5 按评审的 P1 项与 Wisdom 2026-10-30 19:45、19:46 的服务商适配层要求：§4 服务商适配层的契约测试，§5 第 17、18 条（服务商细节只在 `packages/providers`、外发检查与凭据），N-05 开发者本机的 Key。v0.6 按 Wisdom 2026-10-30 21:12 批准的 PR C：§1.3 domain 纯函数的行数，§1.5 与 N-19 禁止复制 BabelDOC 代码，§2 一个 PR 一个切片与解析规则集的例外，§3 热点收窄与 UI 事件登记，§5 第 19 条（解析规则集两侧一致）。同版起 DESIGN.md 与 docs/design-principles.md 已入库，正文仍由 Loom 维护（N-10）。同日 22:45 增加 N-20：禁止在 core 或某个积木里写死另一个积木（§5 第 20 条）。同日 23:55、23:56 增加 N-21、N-22：依赖方向只能是界面 → 接口 → core，M1 起由 CI 挡住反向依赖（dependency-cruiser，见 [backlog](./docs/backlog.md) E-P1-6）；M1 门禁落地前不建业务切片（§5 第 21 条）。Wisdom 2026-10-31 起：调试模式默认关；日志不记密钥、不记论文正文，调试日志短期保留，只存本机（§4、§5 第 8 条、N-05）。同日 09:15：agent 工作记录写在 PR 描述，不另建对话记录（§2）。日期：2026-10-30（Asia/Shanghai）；上述变更为 2026-10-31。
适用对象：所有人类开发者与 AI Agent。
同级规格：[PRD.md](./PRD.md)（做什么）、[ARCHITECTURE.md](./ARCHITECTURE.md)（怎么搭）。视觉与交互：[DESIGN.md](./DESIGN.md)、[docs/design-principles.md](./docs/design-principles.md)，Loom 2026-10-30 已入库。结构、状态与「当 seam 返回 X 时显示 Y」按 DESIGN 实现；标「待审批」的颜色、间距、字号不当作定稿。DESIGN 文首若仍写「Loom 交付前 UI 只搭结构」，以本句为准，那一句留给 Loom 删（N-10，本文件不改 DESIGN 正文）。其他人或 Agent **不得**改正文（N-10）。

规则冲突时的优先级：用户（Wisdom）的明确指示 > 本文 > ARCHITECTURE.md > PRD.md 中的实现建议 > `docs/architecture/` 草案。

---

## 1. 编码约定

### 1.1 TypeScript

- `tsconfig` 基线：`strict: true`、`noUncheckedIndexedAccess`、`exactOptionalPropertyTypes`、`noImplicitOverride`、`noFallthroughCasesInSwitch`、`useUnknownInCatchVariables`、`verbatimModuleSyntax`。
- 模块：ESM；`import type` 导入类型；禁止默认导出（React 路由懒加载除外）。
- 禁止 `any`；必须绕过类型时用 `unknown` + 类型守卫。`@ts-expect-error` 必须附原因，`@ts-ignore` 禁止。
- 错误：seam（切片的 `index.ts`、`pure.ts` 与 IPC 命令）一律返回 `Result`，错误是带 `code` 的普通数据，不向 seam 外抛异常（ARCHITECTURE §2.4）；切片内部可以抛 `AppError` 子类（带错误码），由用例在 seam 处转换；不抛字符串；adapters 把外部错误映射为契约错误码。
- 异步：端口与 adapters 中所有可能耗时的调用接受 `AbortSignal`；`AbortSignal` 不穿过 seam，取消经 `jobs.cancel({ jobId })`；不写无上限的重试或轮询。
- 不写模块级可变状态（ARCHITECTURE F-06）。
- 命名：文件 `kebab-case.ts`；React 组件文件 `kebab-case.tsx`，组件名 `PascalCase`；端口接口名词（`TranslationProvider`），用例动宾（`translatePage`）。
- 注释只写代码表达不了的约束或原因，不复述代码，不写「本次修改了什么」。

### 1.2 Python（worker）

- Python 版本以 `workers/parser/pyproject.toml` 为准；依赖用 `uv` 管理，`uv.lock` 入库。
- ruff（lint + format）、mypy `--strict`（或 pyright strict，M1 二选一后锁定）。
- 类型注解覆盖全部公开函数；协议模型只来自生成的 `oi_worker/protocol/`，不得手改。
- 重依赖（Paddle、Torch、vLLM 等）只能出现在对应引擎目录与 `runtime/`，不得出现在 `api/`、`jobs/`、`preprocess/`。
- 模型与权重只从 `runtime/` 模型清单登记的来源加载，并校验 sha256；需要 `trust_remote_code` 的模型必须锁定 `revision` 到具体提交，并在 PR 描述说明。

### 1.3 Lint 与格式

- Prettier + ESLint（typescript-eslint `strict-type-checked`）；ruff。
- 关键规则（错误级）：`max-lines-per-function: 80`（domain 纯函数与 Python core 不受此条约束，按「一个不变量一个文件」拆分并受文件上限约束，ARCHITECTURE §6）、`complexity: 15`、`max-params: 4`、`no-restricted-imports`（按层）、`no-restricted-syntax`（顶层 `let`）、`no-restricted-globals`（全局禁用 `chrome`；core 路径另禁 `window`、`document`、`navigator`、`location`、`history`、`localStorage`、`sessionStorage`、`requestAnimationFrame`，ARCHITECTURE G14）。
- Markdown 与公式渲染（ARCHITECTURE §4.5）：renderer 全局 `react/no-danger` 为错误级；`katex` 只能在 `packages/ui-kit/src/markdown/math.tsx` 与 `packages/features/formula/src/adapters/katex-renderer.ts` 导入，选项只从 `contracts/src/latex-policy.ts` 读取，不得在别处另写一份；Markdown 解析库只能在 `features/markdown/src/domain/parse/` 导入；`features/markdown/src/adapters/**` 禁止导入 `fs` 的写入类 API。
- 文件行数与依赖方向由 CI 门禁检查（ARCHITECTURE §6、§13），不得在本地关闭后提交。

### 1.4 测试命名与组织

- TS 测试放在切片的 `test/` 下：`test/core/`（经 seam 的核心测试，Node 环境，不渲染 UI）、`test/adapters/`、`test/ui/`；文件名 `<被测文件名>.test.ts`；Python 为 `tests/.../test_<被测模块>.py`。
- 用例名描述**行为与条件**，格式：`<结果> when <条件>`，例如 `rejects translation when a formula placeholder is missing`。中文团队可写中文，但同一文件保持一种语言。
- 与验收标准对应的用例在名称前加编号：`AC-03 rejects translation when ...`。
- 从 v1 移植的规则测试，在 `describe` 名称后注明来源：`describe('integrity-check (v1: lib/pdf-blocks.js)')`。
- 测试只断言可观察行为；禁止读取源码文本断言（ARCHITECTURE F-08）；禁止真实网络（HTTP 客户端在测试中默认拒绝未打桩的请求）。

### 1.5 依赖引入

- 新增运行时依赖须在 PR 描述写：用途、许可证、体积、替代方案。
- 本项目许可证为 **Apache-2.0**（Q6，见根目录 `LICENSE`）。新依赖必须与 Apache-2.0 兼容。
- 许可证白名单：MIT、Apache-2.0、BSD-2/3、ISC、MPL-2.0（仅作为独立文件使用时）。
- **禁止 GPL / AGPL**（任何版本），不接受例外申请。已知禁止项：PyMuPDF（AGPL-3.0；包括作为 MiniCPM SDK `pdf` extra 被间接引入），以及 MinerU 在 2026-04-14 之前以 AGPL-3.0 发布的版本。
- LGPL、非商用、自定义许可证一律需要用户批准；已知需批准的：MinerU 当前版本（MinerU Open Source License，Apache-2.0 加附加条款）。
- 间接依赖同样适用：引入一个包前检查它的 extras 与传递依赖，不得借上游包把需批准的许可证带进来。
- 模型权重视同依赖：在 worker `runtime/` 模型清单登记名称、版本、sha256、许可证与官方出处；非商用或自定义许可证的权重需要用户批准。
- 「借鉴思路」不等于引入代码：可以参考需批准许可证项目的公开算法描述，但不得复制其代码或把它加为依赖。
- **BabelDOC**（`funstory-ai/BabelDOC`，AGPL-3.0，依赖 PyMuPDF；Wisdom 2026-10-30 21:12）：只借思路（ARCHITECTURE §7.11 列出的六项），严禁复制、改写、翻译成 TS 或摘录它的代码，也不引入它与它的依赖。参考时只看 README 与公开文档；PR 描述写明参考了哪一项、查阅的提交。实现由我们按规格自写，不得对照它的源码逐段改写（N-19）。
- 不复制第三方代码进仓库；确需复制时保留许可证头并在 `THIRD_PARTY_NOTICES.md` 登记。

## 2. 分支、提交与 PR

- 分支命名：`feature/<简短描述>`（功能与文档）、`fix/<简短描述>`（修复）、`chore/<简短描述>`（工具与依赖）。小写、连字符。
- 一个分支只做一件事；一个 PR 只动**一个切片**（ARCHITECTURE §3.1，G18）。同一切片的 UI 与 core 可以在一个 PR 里；UI 改动的 PR 不得改另一个切片的 core。契约（`packages/contracts`）改动单独成 PR，先合入，再开实现 PR；契约 PR 的非生成代码超过 200 行时，在 PR 描述写明不拆的理由（G12）。
- 提交信息：Conventional Commits，类型 `feat|fix|docs|refactor|test|chore|build|ci`，范围用切片名，例如 `feat(translation): reject reordered placeholders`。描述可用中文。
- PR 一律先开 **Draft**；自检（§4、§5）全部完成后再转为 Ready。
- PR 描述必须包含：
  1. 改了什么、为什么（关联 PRD 的 US / AC 编号）。
  2. 涉及的切片与热点文件（ARCHITECTURE G11）。
  3. 测试证据：命令、结果摘要；失败项与重跑记录（§4）。
  4. 未验证项与风险。
  5. 改动了 UI 或 core 路径时，附「UI–core 交接说明」（§8.4）。任务类型为「UI 改动」时，core 目录零改动（N-16、N-21）。
  6. 证据目录：`docs/evidence/<PR号>/` 的链接。放测试日志和截图。没有就写「无」。大文件写 CI artifact 链接，不把大二进制提交进仓库（N-12）。
  7. agent 工作记录：一小段，写读了哪些规格、关键决定、跑了哪些命令与结果、坑。不另建完整 agent 对话记录，Cursor 已保存 transcript。不新建 `docs/agent-logs/`。
- 合入方式由用户决定；任何人与 Agent 不自行合入他人或自己的 PR，除非用户明确要求。
- **解析规则集的例外**（ARCHITECTURE §7.10）：改阅读顺序、扫描页判定或段落切分的规则时，TS `parsing/domain/text-layer/`、worker 对应的纯规则模块与 `fixtures/parsing-rules/` 必须在同一个 PR 里改；这是唯一允许一个 PR 同时动 TS 切片与 worker 的情形，PR 里不得夹带其他改动。

## 3. 并行开发规则

目的：多个 Agent 同时工作而不在同一文件上冲突。

1. **开工前声明。** 在 PR 描述（或任务说明）写明：要改的切片、要改的热点文件。热点文件包括：`apps/desktop/src/main/composition-root.ts`、`apps/desktop/src/renderer/slots.ts`、被两个以上切片 import 的契约文件（如 `ids.ts`、`errors.ts`；清单由 `tools/check-hotspots` 按 import 图算出）、`dependency-cruiser` 配置、`tools/check-file-size/allowlist.json`、根 `package.json`、`pnpm-lock.yaml`。只被一个切片使用的契约文件（如 `contracts/src/ipc/<切片>.ts`）算该切片的文件，不是热点（架构评审 P1-11）。
2. **一个切片同一时间一个活跃 PR。** 与进行中的 PR 改同一切片时，串行；或先抽出接口（契约 PR）再并行。
3. **契约先行。** 新功能先合入契约（类型、IPC 定义、端口接口），实现可以先返回固定值；接口稳定后，各切片并行实现。
4. **热点文件只加行。** 装配根与插槽注册遵循「一行一个切片」，PR 对每个热点文件的改动不超过 30 行（G11）。新增 UI 事件或给事件新增发布方、订阅方，在 `contracts/src/ui-events.ts` 登记并附 ADR（ARCHITECTURE §4.3、§5.3）。
5. **迁移不撞号。** 数据库迁移放在各切片自己的 `migrations/`，编号只在切片内递增。
6. **锁文件冲突**：以目标分支为准重新生成，不手工合并。
7. **短分支。** 分支落后目标分支时先同步再继续；同步方式用 merge 或 rebase 均可，但已推送的共享分支不得 force push（§6）。

## 4. 测试运行纪律

- **全量每个 tip 只跑一次。** 对同一个提交（分支 tip），完整测试套件（TS + Python + 静态门禁）只完整运行一次。不得在没有新提交的情况下反复跑全量「碰运气」。
- **失败只重跑失败项。** 全量出现失败后：修复 → 提交 → 只重跑失败的用例（`pnpm test:failed`、`uv run pytest --lf`）确认修复；新的 tip 若需要全量（例如合入前），再跑一次全量。
- **记录。** PR 描述写明：全量运行所在的提交 SHA、通过 / 失败 / 跳过数量；每次只重跑失败项的命令与结果。
- **不稳定测试（flaky）。** 连续两次在相同代码上结果不同，即判定为不稳定：开 issue、加 `quarantine` 标记移出门禁，并在 issue 中写修复所有者；不得通过删测试或放宽断言让 CI 变绿。
- **慢测试。** 需要真实模型、真机或付费 API 的测试标记 `@model` / `@device` / `@paid`，不进 PR 门禁，只在手动或夜间任务运行，且付费测试必须有调用次数上限。调用真实托管 API 的冒烟测试标记 `@live`，按 `@paid` 对待（平台标「免费」的服务也一样），只在对应 Key 已作为环境变量提供时运行（云端 Agent 经 Cursor Secrets 注入，开发者本机见 ARCHITECTURE §15.4），Key 不存在时跳过（ARCHITECTURE §12、§15.4）。
- **两种来源同一套契约测试。** 有「本地 / API」两种来源的模型能力，两个来源跑同一份契约测试（假后端或去掉凭据与图片内容的录制样例）；只测其中一个来源不算完成（ARCHITECTURE §7.0）。
- **服务商适配层的契约测试。** 每个格式适配器跑 `packages/providers/src/testing/` 里它支持的能力对应的共享套件，每条注册表记录至少跑 auth 与 errors；样例只用合成数据（假 Key 用登记在 gitleaks allowlist 的测试前缀，图片用合成图，不用真实论文页面），样例目录的 README 记来源文档链接与查阅日期（ARCHITECTURE §7.9.7）。
- **跳过。** 门禁中出现 `skip` 视为失败，除非 PR 描述写明原因且关联 issue。
- **调试模式。** 产品日志的调试模式默认关。打开后的明细仍不得含密钥、论文正文、译文、提示词、绝对路径（§5 第 8 条、N-05）。调试日志短期保留，只存本机；用户不主动选择就不上传（ARCHITECTURE §11）。保留天数不在这里填。
- **证据目录。** Cloud Agent 与 Anvil 的测试日志、截图放在 `docs/evidence/<PR号>/`。大文件用 CI artifact 链接代替入库。产品运行日志在本机应用数据目录，工作记录在 PR 描述里，三处各写各的（ARCHITECTURE §11）。

## 5. 代码评审清单

评审者（人或 Agent）逐项检查，任何一项不满足即要求修改：

1. 每个新增或修改的文件**只承接一种变化**（状态、取数、展示、持久化、装配中的一种）。
2. 文件、函数大小在建议上限内；超过建议上限有理由；没有触及硬上限。
3. 新增的 import 符合层方向与切片依赖矩阵（ARCHITECTURE §4.3、§5）。
4. 没有新的模块级可变状态；没有新的 `utils` 类文件。
5. 入口与装配文件只有装配代码。
6. 端口新增或变更时，`testing/` 中的契约测试同步更新，且至少两个实现（内存 / 真实）都跑过。
7. 涉及公式、来源、版本、费用的改动有对应的 domain 测试，且覆盖失败路径。
8. 日志与错误信息中没有正文、译文、提示词、密钥、绝对路径。默认不记密钥、不记论文正文。调试模式打开后同样禁止。日志只存本机，用户不主动选择就不上传。不把文档全文写入日志（N-05、ARCHITECTURE §11）。
9. UI 改动遵循 DESIGN.md 与 docs/design-principles.md。标「待审批」的视觉数值不是定稿，不在实现 PR 里另写一套。
10. PR 描述完整（§2）。
11. UI 与核心解耦（§8）：业务规则（校验、计价、状态转移、权限、失败条件）只在 core；UI 改动 PR 中 core 文件零改动；seam 只传普通数据；新增或修改的规则有经 seam 的 core 测试且不渲染 UI。
12. 新依赖与模型权重的许可证与 Apache-2.0 兼容，没有 GPL / AGPL（§1.5）。
13. Markdown 显示（ARCHITECTURE §4.5.4）：UI 拿到的是 core 解析好的 `MdDocument`，不解析 Markdown 字符串、不拼路径、不判断链接是否存在、不决定是否重载、不读 front-matter；显示 Markdown 一律用 ui-kit 的 `MarkdownView`，不另写渲染器。译文块的样式只按 `translation.getBlocks` 返回的 `display` 选择，状态变化只从 `translation.onBlockChanged` 得知；不根据 `retranslateBlock` 的返回、计时器或任务事件推断块状态（ARCHITECTURE §8.1.1）。
14. 模型能力 API 优先（ARCHITECTURE §7.0）：新增或修改由模型提供的能力时，有托管 API 就默认 API，「本地」作为同一端口或同一种 worker 作业后的一等选项保留在设置主选项里（不放进「高级」），并有部署文档 `docs/deploy/<能力>.md`；硬件画像只用于标注「本地」的可行性；没有 Key、拒绝外发或 API 不可用时按 §7.0 表降级，不静默改用其他付费服务或本地；新服务的 Key 变量名先登记在 ARCHITECTURE §15.4，代码不读 `.env`。
15. 付费调用先预留（ARCHITECTURE §7.8）：任何向外部服务发出、可能计费的请求（Jev、引擎 B、云 OCR、多模态、翻译、问答、TTS / ASR，以及以后新增的）在发出之前调用 `BudgetGate.reserve`，被拒就不发请求，按 §7.0 降级；完成后 `settle` 实际用量，未发出则 `release`。计价、额度、上限判断只写在 `budget/domain`，其他切片与 worker 不自己算钱；单价未知时用请求数 / 页数 / token 上限，不当作 0 元。测试覆盖「被拒时请求数为 0」。
16. 跨切片编排只在 `ingest`（ARCHITECTURE §4.2、§7.1、F-17）：按顺序调用多个切片的 seam 并按结果分支（解析 → 评分 → 采用 → 翻译、补救后重评）只写在 `ingest` 的用例里；UI、hooks、装配根、`jobs` 与其他业务切片里出现这种顺序即退回。
17. 服务商细节只在 `packages/providers`（ARCHITECTURE §7.9、F-18）：新增服务商 = 一条注册表记录，格式没有时再加一个格式适配器；切片里不出现服务商主机名、请求体格式、鉴权头、错误码表，也不为某一家服务商新建切片适配器。模型的能力标记来自注册表或用户勾选，不探测，未知按否。
18. 外发检查与凭据（ARCHITECTURE §7.0 第 6 条、§10.1）：任何连接发出前经 `EgressCheck`；回环地址之外都算外发，包括远程 worker。桌面的服务商 Key 只由 main 按次授权，发给对应服务商与本机回环 worker，绝不发给远程 worker；Key 只放请求头，不放 URL（百度 OCR 的 `access_token` 例外，日志里必须打码）。测试覆盖「询问或拒绝时连接数为 0」与「远程 worker 收到 Key 的次数为 0」。
19. 解析规则集两侧一致（ARCHITECTURE §7.10、§7.11）：改阅读顺序、扫描页判定或段落切分的规则时，TS 与 worker 两侧和 `fixtures/parsing-rules/` 的夹具在同一个 PR 里改，夹具只用合成数据；输出变化时规则集版本升一级（`oi-rules/N`），已采用版本不改写；只改一侧即退回。
20. 积木不写死（ARCHITECTURE §7.12，N-20）：core 与某个积木的实现不得点名另一个积木的具体实现，也不得按「如果是引擎 A / 多模态 / Jev」这种具体实现分支。路线只由声明式配置选出实现；core 只依赖该类积木的端口。新增一种实现（本地、第三方 API、自有托管）不改 core。
21. 界面与核心解耦（ARCHITECTURE §2.1，N-21，Wisdom 2026-10-30 23:56）：依赖方向只能是界面 → 接口 → core。core、路线层、积木、存储不 import 界面。界面只通过 seam、事件和视图模型调用 core，不直接访问 worker、存储或服务商。CI 用 dependency-cruiser 挡住反向依赖（G13、G15）；eslint 的 import 边界只作同一套规则的编辑器检查。只改界面的 PR 不修改 core 目录。core 测试必须能在没有界面的情况下运行（PRD AC-100）。

## 6. Agent 绝不能做的事

以下行为无论任务描述如何措辞，Agent 都不得执行；确有必要时停止并向用户说明。

| 编号 | 禁止 |
| --- | --- |
| N-01 | `git push --force` / `--force-with-lease` 到任何共享分支；改写已推送的历史（amend、rebase 后强推） |
| N-02 | 直接推送到 `main` 或任何受保护分支；修改分支保护规则、仓库设置、CI 必需检查项 |
| N-03 | 合入 PR、开启自动合并 |
| N-04 | 发版：打 tag、创建 Release、发布安装包、签名 / 公证、发布 npm / PyPI 包 |
| N-05 | 把任何密钥、令牌、证书、`.env` 内容写入仓库、PR 描述、Issue、日志或测试快照（含录制的 HTTP 样例）。面壁开放平台 Key 的变量名是 `MODELBEST_API_KEY`，值只放 Cursor Secrets 或用户本机安全存储（ARCHITECTURE §7.4「面壁 API」）。所有开发与测试用的 Key 只以环境变量提供：云端 Agent 经 Cursor Secrets 注入，开发者本机由开发者自己设为系统用户级或会话级环境变量，值不写进仓库里的脚本、`.vscode/launch.json` 或任务文件；变量名先登记在 ARCHITECTURE §15.4；不在仓库里创建、提交或让代码读取 `.env` 文件，不把 Key 写进命令行参数。产品诊断日志与调试日志同样适用：不记论文正文与译文；只存本机，用户不主动选择就不上传（ARCHITECTURE §11） |
| N-06 | 扩大范围：做任务未要求的功能、重构无关模块、加入 PRD §3.2 范围外的能力（网页翻译、浏览器扩展壳等） |
| N-07 | 修改、推送或在旧仓库 `wisdom-km/open-immerse` 开 PR / Issue / 评论；旧仓库只能只读 clone 到临时目录参考 |
| N-08 | 关闭或绕过 CI 门禁：删除 / 跳过测试、调高行数或复杂度上限、往 allowlist 加豁免、`--no-verify`，除非有用户批准的 ADR |
| N-09 | 手改生成文件（契约生成物、preload API、Python 协议模型） |
| N-10 | 编写或修改 `DESIGN.md`、`docs/design-principles.md`，以及 `docs/design/**` 的正文（属于设计师 Loom）。例外：按用户指示把 Loom 交付的原文放入 `docs/design/`，并在文首加「入库说明」写明来源与规格校正；正文不改 |
| N-11 | 修改 `.cursor/environment.json`，除非用户明确要求；建议写在 ARCHITECTURE §15 或 PR 描述里 |
| N-12 | 在 CI 或自动测试中调用付费 API、下载模型权重、提交大体积二进制（PDF、权重、音频）进仓库 |
| N-13 | 引入 GPL / AGPL 依赖（含 PyMuPDF，含经上游 extras 间接引入）；引入未经批准的 LGPL / 非商用 / 自定义许可证依赖 |
| N-14 | 删除或改写用户数据迁移、已入库的规格历史，或把「待基准定标」的数值自行填成具体数字 |
| N-15 | 以「模型说对」为依据把候选标为已核验；在代码或文档中编造上游模型能力、API 或测试结果 |
| N-16 | 在 UI 任务中修改 core 文件；为迁就页面给 seam 加参数或改返回形状而不先停下说明（§8 规则 2、3） |
| N-17 | 让识别结果在应当经过 Jev 时绕过评分进入已核验，或把没有 Jev 有效高分的公式标成已核验。当前已核验只有一条路（Wisdom 2026-10-31 01:14，修订 00:46 里「路线不含 Jev 时通过即可标已核验」）：Jev 有效高分，并且程序核对通过。Jev 应当运行时（评分开关为开，且路线的判定列表含 Jev），引擎 A、引擎 B、云 OCR、arXiv 对齐、多模态识别与补救都要经过评分，并且通过 ARCHITECTURE §7.5 第 1、2 步的四项（位置、字符集、编号、可渲染），才标已核验（Q1，Wisdom 2026-10-30 23:55）。arXiv 源码比对（第 4 步 `source-checked-latex`）算不算已核验由 [backlog](./docs/backlog.md) §8 W-5 决定，选定前不算，不在这里翻转 `source-check-standing`。路线不含 Jev 时不调用 Jev，记 `not-run/disabled`，不论开关开或关；第 5 步程序核对通过的显示决定是 `format-checked-latex`（徽标暂定「格式已核对」），不算已核验。核对步骤不改。把「格式已核对」或当前的「源码核对」标成已核验，同样禁止 |
| N-18 | 在 v2 为 `.md` 实现写入、删除、重命名，或以「保存」「导出」等任何名义写入用户的笔记库文件夹；在 preload 暴露 `markdown.writeFile`、在装配根注入 `MdFileWriter`（Markdown 方案 D7，ARCHITECTURE §4.5.7） |
| N-19 | 复制、改写、逐段翻译或摘录 BabelDOC（AGPL-3.0）的代码，把它或它依赖的 PyMuPDF 加为依赖，或对照它的源码写实现；只允许按 ARCHITECTURE §7.11 借用思路（§1.5） |
| N-20 | 在 core 或某个积木的实现里写死另一个积木：点名它的具体实现，或按具体实现分支。处理路线只由声明式配置选出实现，core 只依赖该类积木的端口（ARCHITECTURE §7.12，Wisdom 2026-10-30 22:45） |
| N-21 | 让核心业务依赖界面，或让界面直接访问 worker、存储、服务商。依赖方向只能是界面 → 接口 → core。禁止绕过 dependency-cruiser / eslint import 边界放行反向依赖（ARCHITECTURE §2.1、G13、G15，Wisdom 2026-10-30 23:56）。只改界面的 PR 不得修改 core 目录（domain、application、`index.ts`、`pure.ts`、`contracts/src/ipc/**`） |
| N-22 | 在 M1 门禁 PR（ARCHITECTURE §13 的 G1–G18 脚本落地）合入之前，新建 `packages/features/**` 业务切片。在那之前允许的代码限于工具链、契约草稿与测试夹具。当前 CI 全绿只说明工具链能跑，不等于 §13 已生效 |

## 7. 文档规则

- 全部文档用中文。代码标识符、命令、路径保持原文。
- 规格的唯一真相源是根目录的 `PRD.md`、`ARCHITECTURE.md`、`RULES.md`；设计规格是 `DESIGN.md` 与 `docs/design-principles.md`（Loom 2026-10-30 已入库），以及 `docs/design/` 下 Loom 的功能级设计文档（目前是 Markdown 阅读方案 `md-reader.md`）。设计文档与规格冲突时，需求、验收、里程碑、架构以规格为准，界面细节以设计文档为准；校正写在设计文档的「入库说明」里。`docs/architecture/` 是历史草案。
- 修改规格必须在同一个 PR 同步修改受影响的其他规格与 CI 配置；结构性变更配 ADR。
- 引用上游模型、库、API 的能力时附官方链接、锁定的提交或版本、核实日期；未核实的写「未核实」。官方自测的精度与速度数字一律注明「官方自测」，不当作已验证结论。
- 上游核实结论集中在 `docs/v2-gap-and-changes.md` §2；规格引用它而不是各自重述，避免多处说法漂移。
- 「待基准定标」「待 Loom 产出」「待用户拍板」三种标记保持原样，直到对应的人给出结论。用户已决定的问题标「已决定（Wisdom 日期）」，并在同一个 PR 改入全部受影响的规格。`DESIGN.md` 与 `docs/design-principles.md` 已于 2026-10-30 入库，不再标「待 Loom 产出」。DESIGN 文首「交付前只搭结构」一句过时，以本文文首为准，正文等 Loom 删。

## 8. UI 与业务核心解耦（Q3）

约束原文、调研依据、seam 定义与切片映射见 [ARCHITECTURE.md](./ARCHITECTURE.md) §2.1–§2.6，CI 规则见 ARCHITECTURE §13 的 G13–G16。本节是执行细则。原 G17（同一 PR 同时改 UI 与 core 即失败）已按架构评审删除（Wisdom 2026-10-30 19:57 批准）：一个切片的功能同时包含 core 与 UI，同一切片的 UI 与 core 可以在一个 PR 里，但 seam 的类型变更先单独合入（§3 第 3 条）。下面规则 2、3、5 改由评审与交接说明检查。

### 8.1 执行规则（Wisdom 2026-10-30 原文，不得删改或弱化）

1. 校验、计价、状态转移、权限、失败条件只写在 core。
2. 改 UI（布局、文案、组件、交互）时，默认不改 core 文件。
3. 现有 seam 不够用时先停下来说明缺什么，不要为了迁就页面去加参数、改返回形状。
4. 核心测试直接调用 seam，不渲染 UI。这是完成标准。
5. 做完说明：改了哪些 UI 文件，core 是否没动，核心测试是否通过。

Wisdom 2026-10-30 23:56 在不改上面五条原文的前提下写死：核心业务（core、路线层、积木、存储）不依赖任何界面代码。界面只通过接口、事件和视图模型调用 core。依赖方向只能是界面 → 接口 → core。只改界面的 PR 不允许修改 core 目录。PR #11 审查 §4.3 的结论与此相同：UI 任务停在 seam 上，由 G13–G16 检查。验收 PRD AC-100。

### 8.2 每条规则怎么做、怎么查

| 规则 | 怎么做 | 机器检查 | 人工检查 |
| --- | --- | --- | --- |
| 1 | 五类规则写成 `features/<f>/src/domain/` 下的纯函数，由 application 用例调用；组件、hooks、`ipc-handlers.ts` 里不出现这五类判断（显示用的格式化除外） | G13、G14（core 不能依赖 UI）；G16（规则必须有 core 测试） | 评审清单 §5 第 11 条：在组件里看到 `if` 判断业务条件即退回 |
| 2 | 「core 文件」= domain、application、`index.ts`、`pure.ts`、`contracts/src/ipc/**`。UI 任务的分支只改 `src/ui/**`、`apps/desktop/src/renderer/**`、`ui-kit` | G18 拒绝「改 UI 又改另一个切片的 core」；同一切片内的 core 改动不由机器检查 | 任务类型为「UI 改动」时，交接说明中「core 是否没动」必须为「是」，评审对照 diff 核实；core 文件出现在 UI 改动任务的 diff 里即退回 |
| 3 | 发现 seam 不够用：停止 UI 工作，在任务或 PR 中写明缺什么输入或结果、为什么现有 seam 不行；另开 seam PR（契约先行，§3 第 3 条），由 core 侧按领域语义设计，合入后再继续 UI | 契约 PR 的体量（G12）；被两个以上切片 import 的契约文件是热点（G11）；一个 PR 一个切片（G18） | 评审 seam PR 时检查：新增字段是否是领域概念，而不是某个页面的布局需要 |
| 4 | core 测试放在 `test/core/`，只 import `src/index.ts`、`src/pure.ts`、`src/testing/**`，用 fake 端口。M1 前此项写不适用（脚本尚未提供）；M1 起以 package.json 实际脚本为准 | G16（Node 环境、禁止 UI 依赖、规则覆盖核对） | 任务完成以该 core 测试通过为准，组件测试通过不能代替。M1 前不要求执行尚未提供的脚本 |
| 5 | 在 PR 描述或任务回复中填写 §8.4 模板 | 无（G17 已删除） | 改动 UI 或 core 路径的 PR 缺少交接说明块即退回（§2）；评审核对说明与 diff 一致 |

### 8.3 交接指令必须引用

给人或 Agent 分派任何涉及 UI 或 core 的任务时，任务说明里必须包含下面这一行，且不得删减：

> 本任务受 UI 与业务核心解耦约束：ARCHITECTURE.md §2.1 与 RULES.md §8。改 UI 不得改变核心行为，也不得让核心测试失败；seam 不够用时先停下来说明缺什么。

任务说明还需写明任务类型（UI 改动 / seam 变更 / core 改动三选一）与涉及的切片。没有这一行的交接指令，接手方应先补上再开工。

### 8.4 完成说明模板

```markdown
### UI–core 交接说明（ARCHITECTURE §2.1 / RULES §8）

- 任务类型：UI 改动 / seam 变更 / core 改动（三选一）
- 涉及切片：
- 改了哪些 UI 文件：
  - `packages/features/<切片>/src/ui/...`
- core 是否没动：是 / 否（否时列出文件与原因；UI 改动任务中出现 core 改动即不合格，按规则 3 另开 seam PR）
- 用到的 seam：`<切片>.<操作>`（`index.ts` / `pure.ts` / `window.oi`）
- seam 是否够用：够用 / 不够用（不够用时写：缺什么输入或结果、为什么现有 seam 不行、对应的 seam PR 链接）
- 核心测试是否通过：M1 前写不适用（脚本尚未提供）；M1 起以 package.json 实际脚本为准，于提交 `<SHA>`：通过 N / 失败 N / 跳过 N
- 未验证项与风险：
```


# 执行计划

B「纯替换门」的精确实施计划。20:17 批准之后，同一 Draft 新增了门和 B3–B10 的 fake 测试。没有接上生产菜单。

分支 `feature/view-menu-gate-b-plan-174`。基线是已合 main `f9725cac9eec23f08d08506ae592116c5dc876b2`，唯一 parent `a5a27bf0b3586f337f190a1ab8874dda538ce61d`，tree `30169b1cda6fb7e6bb7288670fcb7770c93647c6`。`git fetch origin main` 之后，这个 SHA、parent 和 tree 与官方 main 一致。

PR #230 已由 Jone 按 [评论 7077002282](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-7077002282) 合入。合入同步是 [评论 7077050649](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-7077050649)。合入的是 A 的形状、原生读取和纯行数报告。不是生产三视图接线，也不是本计划的实施批准。

本任务受 UI 与业务核心解耦约束：[ARCHITECTURE.md](../../ARCHITECTURE.md) §2.1 与 [RULES.md](../../RULES.md) §8。改 UI 不得改变核心行为，也不得让核心测试失败；seam 不够用时先停下来说明缺什么。写计划当时（2026-11-22，20:17 批准之前）的任务类型是不适用（纯文档）。20:17 之后，同一文件记录已经落地的门。21:31 的修正仍只动这扇门和它的测试。

## 现状理解

- 已有：`apps/desktop/src/main/view-menu-mirror.ts` 导出 `ViewShape` 和 `viewSlotDescriptions`。`none` 只返回原文、对照、译文的 `label` 与 `event`，不写 `type` 或 `checked`。三种活动值返回 `type: "radio"`，且恰有一项 `checked: true`。事件来自已导出的 `oi-view-original`、`oi-view-bilingual`、`oi-view-translation`。
- 已有：Windows CI 在桌面单测之后用 `vitest.windows-native.config.ts` 跑真实 Electron 45.2.1 的菜单形状。那是 A 的 B1、B2。fake 不能代替它，它也不能代替产品菜单画面、物理键或读屏。
- 写计划当时还没有 `view-menu-gate.ts`。这句是 20:17 之前的现状。20:17 实施后，本分支已经有这个文件和 `view-menu-gate.test.ts`。生产 `library-wiring.ts` 仍走原来的 `installFileMenu`，不引用门。`index.ts` 里的 epoch 和菜单装配不是同一个生命周期所有者。commit、退役、关闭和 floor 的唯一写者没有进 A，也不进 B 或 C。
- 相关的节：[docs/arch/02-01.md](../arch/02-01.md#21-ui-与业务核心解耦q3wisdom-2026-10-30-原文)、[docs/arch/05.md](../arch/05.md#5-依赖方向与禁止事项)、[docs/arch/06.md](../arch/06.md#6-文件与函数大小)；[RULES.md](../../RULES.md#16-职责解耦与行数) §1.6、[§1.7](../../RULES.md#17-代码规模与审查)、[§8](../../RULES.md#8-ui-与业务核心解耦q3)；[DESIGN.md](../../DESIGN.md#410-hig-基础补齐来源hig-gap-auditmd必须补10-项wisdom-2026-11-04-0308-拍板三项) §4.10 的 11.1；[docs/design-principles.md](../design-principles.md#1-原则7-条) §1。这些正文本轮不改，正式约束和设计源保持一致。
- 行为来源不改写：[seam](feature-reader-view-menu-seam-174.md) 的「[仍然成立](feature-reader-view-menu-seam-174.md#仍然成立)」「[替换门](feature-reader-view-menu-seam-174.md#替换门)」「[轨迹](feature-reader-view-menu-seam-174.md#轨迹)」「[验收](feature-reader-view-menu-seam-174.md#验收)」。旧实施总计划里的 B 段是历史轮廓，见 [feature-view-menu-gate-s2b-implementation-plan-174.md](feature-view-menu-gate-s2b-implementation-plan-174.md)。本文件不回写那份已合计划。那里的 600 停报是当时的句子，不是现行硬阻断。

## 目标

B 是防旧状态覆盖的纯替换门。它记住已提交镜像，挡住过期的 none 或过期的提交把新状态盖回去。它不是产品三视图接线，不装进启动路径，不新增可见控件。

none 不是第四个栏位。菜单仍是系统原生的「视图(&V)」或 mac「显示」。标签、accelerator、enabled 和三个事件名不变。不自绘，不加「无」，不改成 checkbox，不把不可用项改成置灰。

## 单一职责和依赖

将来获批实施时，只新增两个文件：

| 路径 | 职责 |
| --- | --- |
| `apps/desktop/src/main/view-menu-gate.ts` | 替换门。已提交镜像、`known` 或 `unknown`、至多一个生命周期 pending、退出时最多再替换一次、click 是否派发 |
| `apps/desktop/test/view-menu-gate.test.ts` | B3–B10。Node fake。不导入 Electron |

门只从已合 `view-menu-mirror.ts` 取形状。不在门里再写一份标签、事件或 checked 表。测试要断言最终镜像时，用 `viewSlotDescriptions` 的结果作期望，不复制那张表。

依赖方向：门在 desktop main，向 mirror 取值。mirror 已经依赖 `library-menu.ts` 的三个事件常量。门不改 `library-menu.ts`，不导入 Electron，不导入 `library-wiring.ts`，不导入 epoch，不进 core。测试不导入 Electron。没有新的 seam。seam 不够用时停，不在 B 里加 IPC。

禁止一起改：`library-wiring.ts`、`library-menu.ts`、`view-menu-epoch.ts`、`index.ts`、`composition-root.ts`、handler、`expose`、三份生成物、renderer、UI、存储、CSP、协议。C 以后才许改 `library-wiring.ts` 的菜单装配。完整生命周期所有者另写计划，不塞进 B 或 C。

## 状态机

状态只有三样：已提交镜像、安装状态 `known` 或 `unknown`、至多一个 pending。pending 只收生命周期写下的 none，并记下当时的阶段记号。被拒绝的上报不能变成 pending。B 没有 handler，门上不造「拒绝上报」入口。

三个入口：

- 合法完整快照。开始前先清掉同一阶段记号留下的 pending none，再按 mirror 做这次替换。不能先装上新快照，退出时再装旧 none。
- 生命周期 none。替换进行中写下的 none 留下。不在进行中时，它就是下一次要处理的 pending，仍至多一个。
- click。按已提交镜像重建，用来抵消 radio 的自动勾。门正在替换时不派发，也不用旧镜像覆盖 pending。21:31 之后，click 另外收下这次请求的既有事件。重建仍用已提交镜像。成功后派发的是请求，不是当前勾选。

退出时，不论成功、抛错还是后置核对失败，都看 pending。记号仍对应当前槽，才再替换一次。这次额外替换期间 pending 又被更新：留下最新值，安装状态标为 `unknown`，不再进入下一轮。下一次上报、click 或生命周期事件才再试。窗口已销毁时，submit、生命周期 none 和 click 的替换次数都是 0，不调用 Menu。已提交镜像不变。不宣称原生回滚。

换代由测试把新的阶段记号交给门。这不是生产已经接上 epoch。旧 submit 的后置核对失败时，不把旧形状提交为镜像。

click 只有整次重建最终成功才派发 1。忙、替换失败、后置失效、重建期间镜像被 pending 换成别的形状，都派发 0。`executeJavaScript` 的 Promise 拒绝要接住，不能冒出。文件菜单仍是现有的 `void dispatchMenu`。B 不改那条路径，也不用源码文本证明它。

错误边界：替换函数抛错不算测试失败本身，门要按 B4 收场。后置核对返回失败按 B5 收场。第三次替换不允许出现。销毁之后的 Menu 调用次数是 0。

## 验收

B3–B10 一条不删。载体都是 fake。必须看到最终镜像，以及 `known` 或 `unknown`，不能只数 `replace`。

| 编号 | 通过 |
| --- | --- |
| B3 | 成功退出消费仍有效的 pending，最多再替换一次。最终镜像是这份 none，安装 `known` |
| B4 | 抛错退出同样最多再替换一次。最终镜像不是抛错的形状，而是被消费的 pending，安装 `known` |
| B5 | 后置核对失败同样最多再替换一次。最终镜像是被消费的 pending，安装 `known` |
| B6 | 额外那次替换期间 pending 再更新：没有第三次 `replace`。最新 pending 留下。安装 `unknown`。已提交镜像保持进入这次之前的值 |
| B7 | 合法 `contrast` 开始前清掉同记号的旧 pending。只替换 contrast。最终菜单和镜像都是 contrast，安装 `known` |
| B8 | 替换期间换代写下的 none 留下。旧 submit 后置失败，不把旧形状提交为镜像。新 none 再替换一次。最终镜像是这份 none，安装 `known` |
| B9 | `destroyed` 为真时，submit、生命周期 none、click 的 `replace` 都是 0，不调用 Menu。已提交镜像不变 |
| B10 | 忙时派发 0，且不覆盖 pending。空闲重建最终成功才派发 1。替换失败或后置失效派发 0。click 重建期间若 pending 把镜像换成别的形状，派发 0。接住 Promise 拒绝 |

fake 不能代替 A 已经做过的真实 `_menuWillShow`，也不能代替产品 UI、菜单仍开着的画面、物理 Ctrl 或 ⌘、读屏、mac 菜单栏。B 自己的测试通过，不能写成生产已经装上 none，也不能写成三视图已经联动。

## 命令和证据

写计划当时（20:17 之前）只跑文档检查，不跑门的测试，因为那两个文件当时还不存在。不启动 Electron，不操作真机，不外发消息。20:17 实施后的命令、第一次全量超时和单独重跑留在 `docs/evidence/231/commands.md`，不改写成后来的结果。cbc11f8 的官方 CI 六项成功只证明那个 tip，不继承为 21:31 修正的绿灯。

将来实施获批后，在那一支 PR 里跑：

`corepack pnpm exec vitest run apps/desktop/test/view-menu-gate.test.ts`

再跑类型检查。不把这条测试写进会启动 Electron 的 native 配置。证据写到那一支的 `docs/evidence/<PR号>/commands.md`。没跑的 native、真机和产品画面保持未验证。

历史轮廓是门 166 行、门测试 333 行，合计 499，另有证据预留。那是旧计划的点估计，不是额度，也不是上限。P、L、X 没有新的实测，不记 0。行数只报告。超过 600 不构成停工，也不写理由字符串去换通过。不删 B3–B10，不压格式，不把 B10 挪到 C。

PLR0915 仍是语句数量，`max-statements` 为 80，不关。圈复杂度 15 和 C901 仍失败。函数物理行数不再单独失败。仓库的 eslint 没有 `max-params`，本计划不新增这条自动检查。

## 并行

顺序是已合的 A，然后 B，然后 C。C 要导入已合的门，所以不能和 B 并行。B 与 C 串行。

C 只启动 none 装配：常量记号，`noteNone` 次数是 0，三个栏位 click 进门，文件菜单不进门。C 的装配测试不代替 B3–B10。

同一 epoch 实例如何到达门、换代或退役或关闭通知进哪一次调用、floor 的唯一写者，是将来另一份计划。A、B、C 的白名单都不含 `index.ts` 和 `view-menu-epoch.ts`。本文件不替那一项起文件名。

同时最多三个代码互不影响的 PR。这条链不凑满名额。真机 QA 仍串行。16:01 的真机准备见台账下一笔，本代理不执行它。

## 风险

- 把 fake 的 `known` 说成菜单已经在 Windows 上打开。
- 为了让门在生产里生效，顺手改 `library-wiring.ts` 或 epoch。
- 用第二份代次表或模块级单例补生命周期。
- 复制 mirror 的形状表，使两处 checked 规则分叉。
- 删掉 B6 或 B10 的某一支来缩短文件。
- 把旧计划里的 600 停报重新当成现行规则。
- 把 Loom 的原则对齐、15:08 的路线或 PR #230 的合入，写成 B 的编码批准。

## 计划 / 实际

| 步骤 | 计划 | 实际 | 证据 |
| --- | --- | --- | --- |
| 1 | 只写本计划和台账，开 Draft | 本回合。不写两个产品文件 | 文档检查见 PR 说明 |
| 2 | Forge 审本计划，用户再批具体实施范围 | 2026-11-22 20:17 已批。评论 7079006557。已审 head `a661e134f5d819c194917fabc5e6b6dceac57f99`。本行提交时两个产品文件还没有写 | 台账 20:17 |
| 3 | 获批后才新增门和 B3–B10 测试 | 已新增两个文件。13 条 fake：B3–B9 各一条，B10 六条。门 308 行，测试 333 行。不把 166 的旧轮廓当成额度 | `docs/evidence/231/commands.md` |
| 4 | 21:31 按审查在原两个文件里修正 R1–R4 并补行为测试 | 已改门和测试。门 427 行，测试 526 行。24 条 fake：原来的 B3–B10 十三条都在，另加请求目标、派发等待收口、销毁和 dispatch 拒绝。观察字段改为只读 | `docs/evidence/231/commands.md` |

## 决策记录（Decision Log）

| 决定 | 理由 | 日期（Asia/Shanghai） | 谁定的 |
| --- | --- | --- | --- |
| 下一项只写 B 的精确计划，不写 C，不写生命周期所有者 | 已合总计划的顺序是 A、B、C。C 依赖 B。生命周期不在 B 或 C 的白名单里 | 2026-11-22 | Forge 排序，非业主决定。路线原话在 [台账 15:08](../approvals.md) |
| 本文件不改 PRD、ARCHITECTURE、RULES、DESIGN、设计原则 | 正式约束和设计源没有新的冲突。行数规则已在已合规格里 | 2026-11-22 | 本计划 |
| 不把 16:56 的只读收口补成实施批准 | Issue #174 自 15:08 的评论到合入同步之间，官方评论只有 7076269523、7077002282、7077050649。没有一条 16:56 实施批准 | 2026-11-22 | 本计划 |
| 在同一 Draft 实施 B | 原话在 [台账 20:17](../approvals.md)。范围是两个新文件、B3–B10、计划、台账和证据。不接生产，不改界面、CI、依赖、环境，不操作真机 | 2026-11-22 | Wisdom |
| 按 21:31 在原两个文件里修正 R1–R4 | 原话在 [台账 21:31](../approvals.md)。只修正派发目标、派发等待期间的生命周期收口、异步销毁后的派发，以及 dispatch 拒绝的行为证明。不接生产 | 2026-11-22 | Wisdom |

Wisdom 2026-11-22 15:08 原话已经在台账，这里不改写。16:01、17:12 和 17:16 的原话也不改。20:17 的原话在台账，不在这里改写成更宽的范围。21:31 的原话只有「OK，就按照你的建议推进。」建议原文在台账，不在这里加宽。

## 21:31 修正边界

2026-11-22 21:31 的批准只覆盖 PR #231 审查 cbc11f8 时指出的四个缺口。范围仍是 `view-menu-gate.ts` 与 `view-menu-gate.test.ts`，加上本计划、台账和证据。本段随批准先写下。写下这段时，门的代码还没有按这四条改。

- R1：click 保留这次请求的既有事件。重建用当前已接受镜像，成功后派发请求事件。已接受镜像和请求目标不同时，仍派发请求。不复制 mirror 表。
- R2：派发等待期间到达的生命周期 none，按已经批准的有界语义收口。没有收口时不能继续标 `known`。不无限 drain，不增加第三次 replace。
- R3：后置检查或额外替换的等待期间如果销毁，不能再派发。busy 仍要释放。
- R4：用 dispatch 自己返回的 rejected Promise 证明拒绝处理。不能把 replace 的拒绝改个名字来顶替。

B3–B10 一条不删。不接生产，不改界面、CI、依赖、环境，不操作真机。不 Ready，不合入，不发版。

上面四条是批准时的边界。随后的实现按这四条改了门和测试。修前探针里，额外替换期间销毁已经不会派发；dispatch 自己的拒绝也已经被接住。这两条仍补了行为断言。派发等待期间的 none，以及重建后置检查期间的销毁，修前会留下错误结果，修后按上面的边界收口。

## 自检

- [x] 影响 arch / prd 吗？不影响。正文保持与已合规格一致，本轮不改。

## 交接

下面这一段是 20:17 批准之前写下的交接，整段保留。实施范围以台账 20:17 的原话为准。两个文件已经按该原话新增。fake 通过不是 native，也不是产品 UI。本 Draft 仍不 Ready，不合入，不发版。

B 的下一阶段仍未获实施授权。开工前完整阅读 `PRD.md`、`ARCHITECTURE.md`、`RULES.md`、`DESIGN.md`、`docs/design-principles.md`、本计划、已合 seam 的「仍然成立」「替换门」「轨迹」「验收」「分批」「将来另批才许改的文件」，以及批准台账里当时已经写下的原话。本任务受 UI 与业务核心解耦约束：ARCHITECTURE.md §2.1 与 RULES.md §8。改 UI 不得改变核心行为，也不得让核心测试失败；seam 不够用时先停下来说明缺什么。依赖只沿 ARCHITECTURE §5 允许的方向。不临时导入还不存在的模块，不预造兼容层。一个文件一种职责。优先系统原生菜单，不自造控件。本批无新 UI。生产启动保持 none，`expose` 保持 false。三份生成物、`composition-root.ts`、`index.ts`、`view-menu-epoch.ts` 零 diff。不含 handler、生产命令表、renderer、UI、存储、CSP、协议、S2c 及后续、账户或登录。不造第二份代次表或模块级单例。纯行数只打印，不因数字停工，不写理由字符串例外。PLR0915 仍是语句数量检查，不关。不删测试，不压格式。目标是纯替换门和全部 fake 证明。完整验收是 B3–B10，一条不删。形状从已合 mirror 导入。文件白名单是 `apps/desktop/src/main/view-menu-gate.ts`、`apps/desktop/test/view-menu-gate.test.ts`，以及那一支自己的计划、台账追加和证据。禁止导入 Electron。禁止改 `library-wiring.ts`、`library-menu.ts`、epoch、`index.ts`、`expose` 和生成物。不把 B10 分到别的 PR。fake 不能代替 native 或产品 UI。C 在 B 合入之后另支，只做启动 none。commit、退役、关闭和 floor 的唯一写者不在 B 或 C，须另计划。分支用 `feature/` 前缀，独立 worktree，base 是当时已合 main，PR 保持 Draft。Forge 审过本计划并且用户另批具体实施范围之前，不写这两个文件。不 Ready，不合入，不发版。

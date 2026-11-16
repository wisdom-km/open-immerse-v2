# 执行计划

S2b 实施计划。只核算预算、写本文件和批准台账。分支 `feature/view-menu-gate-s2b-implementation-plan-174`。基线是当前 main `9a1b56d1b5feb4d8188e14a713d48eecfb28b7d5`，唯一 parent `85632b3d7f7073dbbd77b3db47142f015af272f4`，tree `67de0a70fc1e5f79dfad0d0ce9e6e8ec974111f6`。`git fetch origin main` 之后，本地 main、`origin/main` 与这个 SHA 左右计数都是 0。没有漂移。

结论先写在这里：**未来完整实施按当前列明项的点估计是 828 行新增+删除，超过 600，缺口 228。613 是当前函数/用例轮廓假设下的收紧估计，仍超过，缺口 13。HOLD。** 613 不是数学保证下限，不证明任何完整实现都不能更短。本回合不写产品代码，不写测试代码，不因此压行或删断言，也不写实现去证明更短的最优值。不自动拆分，不开第二支实施 PR，不写豁免理由，不改 600。23:58 不是精确计划 PASS。

不改已合的 [S2b 计划](feature-view-menu-gate-s2b-174.md)、[seam](feature-reader-view-menu-seam-174.md)、[E2 计划](feature-reader-view-modes-e2-174.md)。不续 PR #223 的分支 `feature/view-menu-gate-s2b-174`。

Wisdom 2026-11-16 23:58 原话：「批准从当前 main 另开 S2b 实施计划 Draft，仅核全部预算、写计划与批准台账；先精确审查，超过600就报告，不删测试、不改600、不自动拆分。不批准产品或测试编码、Ready、合入、后续范围或发版。」来源是 [issue #174 评论 6921564111](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6921564111)。这是本文件唯一的新授权。

行为只沿用已合 seam 的「[仍然成立](feature-reader-view-menu-seam-174.md#仍然成立)」「[替换门](feature-reader-view-menu-seam-174.md#替换门)」「[轨迹](feature-reader-view-menu-seam-174.md#轨迹)」「[验收](feature-reader-view-menu-seam-174.md#验收)」「[分批](feature-reader-view-menu-seam-174.md#分批)」「[将来另批才许改的文件](feature-reader-view-menu-seam-174.md#将来另批才许改的文件)」。标签仍是 [DESIGN.md](../../DESIGN.md) §4.10 的 11.1：mac「显示」，其他平台「视图(&V)」。不改 DESIGN 正文。栏位切换仍是 [docs/design-principles.md](../design-principles.md) 的支持性能力，放在系统原生菜单里。不自造控件。

本任务受 UI 与业务核心解耦约束：ARCHITECTURE.md §2.1 与 RULES.md §8。改 UI 不得改变核心行为，也不得让核心测试失败；seam 不够用时先停下来说明缺什么。本回合任务类型：不适用（纯文档）。

## 现状

`library-menu.ts` 94 行。视图子菜单已有后退、前进、转到页码、原文、对照、译文、放大、缩小、实际大小、适合宽度。三个栏位事件仍是 `oi-view-original`、`oi-view-bilingual`、`oi-view-translation`。`MenuItemSpec` 没有 `type`，也没有 `checked`。`library-menu.test.ts` 100 行，锁标签和加速键。

`library-wiring.ts` 252 行。`startLibrary` 调用 `installFileMenu`。`menuEntry` 对每一项都是 `void dispatchMenu`。`dispatchMenu` 返回 `executeJavaScript` 的 Promise，调用处没有 `.catch`。不能把这句 `void` 当成已经接住拒绝。文件菜单这条路径本笔不改。

`view-menu-epoch.ts` 128 行。公开的只有 `attach` 和 `read`。没有生命周期订阅，没有 floor 写入。`index.ts` 60 行，`startDesktop` 自己 `createViewMenuEpoch()`，只传给 `createMainWindow`。`composition-root.ts` 27 行，`startLibrary` 只收到 `userData`，拿不到那个实例。`packages/contracts/src/ipc/shell.ts` 的 `expose` 仍是 `false`。`apps/desktop/package.json` 的 `electron` 是 `45.2.1`。

已合 S2b 计划里的 553 行产品与测试、36 行证据、589 这个和，是当时未入库底稿。本文件不把它当额度，也不把它当成「放得下」的承诺。已合 seam 分批表里的 344，以及 1.73 乘 481 得 832.13、乘 553 得 956.69，都只保留为历史算术。1.73 乘 481 写成 827.13 是算错的，这里不沿用错数。

仓库里没有名为 `SKILL_MAP` 的文件，正文检索也没有这个名字。本计划不称用过技能地图，也不补这个文件。

## 边界

未来实施如果获批，范围仍只是已合 seam 点名的 S2b：`view-menu-gate.ts`、`view-menu-mirror.ts`、`library-menu.ts`、`library-wiring.ts` 的菜单装配，以及 B1–B10 的测试。生产菜单仍是 none 的普通项。`expose` 保持 false。三份生成物零 diff：`apps/desktop/src/main/ipc/registry.generated.ts`、`apps/desktop/src/preload/oi.generated.ts`、`apps/desktop/src/renderer/oi-api.d.ts`。`composition-root.ts` 零 diff。

不含 handler、生产命令表、`wiredLibraryCommands`、`ipc-production-assembly.test.ts`、renderer、UI、存储、CSP、协议、S2c-prep、S2c-on、E2、S3、账户或登录。不改 `view-menu-epoch.ts`、`index.ts`、`window.ts`。不改 DESIGN、设计原则、`docs/design/**`、规格正文、CI、依赖、环境安装文件。不重开 seam。

`none` 用普通项，构造参数不写 `checked`。`original`、`contrast`、`translation` 把原文、对照、译文建成 radio，恰一项 `checked: true`。不在已经挂上的 radio 上改 `checked`。换形状就新建菜单再 `setApplicationMenu`。Electron 45.2.1 的 `MenuWillShow` 只遍历这一层：radio 全未勾时会勾第一项，普通项跳过。不自绘，不置灰，不改成 checkbox，不加「无」项。不改标签、accelerator、enabled、事件名。对照的事件名仍是 `oi-view-bilingual`。

门的状态、三种退出、同代旧 none 和换代，以 seam「替换门」和「轨迹」为准。pending 只收生命周期的 none，并记下阶段记号。被拒绝的上报不能变成 pending。S2b 没有 handler，门上不造「拒绝上报」入口。生产装配只装 none。活动形状由同一套纯函数生成，测试可以直接调用。矩阵里的换代和销毁用门的入参驱动。这不是生产已经接上换代。

Loom 对已合计划基线的四条原则结论仍然引用，不重开：栏位切换是支持性能力；仍是原生视图或显示菜单，没有新的页面控件；none 是内部状态，不是第四项；活动模板或装配测试不是生产已联动。原则 PASS 不代替精确计划 PASS，也不表示本预算已经通过。

## 还没接上的接线

这些缺口只披露，本笔不补。

`index.ts` 的 epoch 和 `startLibrary` 里的门不是同一个实例。epoch 只能 `attach` 和 `read`，不能通知门。S2b 的生产 `currentMark` 只能是装配时的常量，例如表示「尚未接代」的固定记号。生产不调用 `noteNone`。测试用假端口传入记号、销毁和后置核对。

因此，S2b 的 none 加上 fake 端口不能读成真实生产接线。窗口销毁、换代、退役、关闭，在生产路径上还不会推动这扇门。

S2c-on 之前要另批，写明四件事和准确到文件的行数：同一个 epoch 实例怎样到达门；换代、退役、关闭通知进哪一次调用；floor 的唯一写者是谁；那些文件相对当时 main 的新增+删除。不许另造第二份 epoch 表，不许用模块级可变单例，不许让 payload 自报代次。

## 验收

B1、B2 读的是子菜单 `_menuWillShow` 返回之后的真实 `MenuItem`。读构造参数不算菜单已经打开，也不算真机。B3–B8 必须看到最终镜像，以及 `known` 或 `unknown`，不能只数 `replace`。

| 编号 | 载体 | 通过 |
| --- | --- | --- |
| B1 | 真实 Electron 45.2.1 | 视图子菜单上，原文、对照、译文是 `normal`，`checked` 为 false。没有第四个栏位 |
| B2 | 真实 Electron 45.2.1 | `original`、`contrast`、`translation` 各自恰一项 radio 为勾，分别是原文、对照、译文。另两项是未勾的 radio |
| B3 | fake | 成功退出消费仍有效的 pending，最多再替换一次。最终镜像是这份 none，安装 `known` |
| B4 | fake | 抛错退出同样最多再替换一次。最终镜像不是抛错的形状，而是被消费的 pending，安装 `known` |
| B5 | fake | 后置核对失败同样最多再替换一次。最终镜像是被消费的 pending，安装 `known` |
| B6 | fake | 额外那次替换期间 pending 再更新：没有第三次 `replace`。最新 pending 留下。安装 `unknown`。已提交镜像保持进入这次之前的值 |
| B7 | fake | 合法 `contrast` 开始前清掉同记号的旧 pending。只替换 contrast。最终菜单和镜像都是 contrast，安装 `known` |
| B8 | fake | 替换期间换代写下的 none 留下。旧 submit 后置失败，不把旧形状提交为镜像。新 none 再替换一次。最终镜像是这份 none，安装 `known` |
| B9 | fake | `destroyed` 为真时，submit、生命周期 none、click 的 `replace` 都是 0，不调用 Menu。已提交镜像不变 |
| B10 | fake，只限视图事件 | 忙时派发 0，且不覆盖 pending。空闲重建最终成功才派发 1。替换失败或后置失效派发 0。click 重建期间若 pending 把镜像换成别的形状，派发 0。接住 `executeJavaScript` 返回的 Promise 拒绝。文件菜单仍是现有的 `void dispatchMenu`，本笔不改那条路径，也不用源码文本去证明它 |

B10 里「重建期间 pending 换形状则派发 0」来自 seam：上报、click、生命周期共用一个门，而且门成功才派发。它不是新行为。不把它删掉来省行。

## 载体

`apps/desktop/test/view-menu-gate.test.ts` 在 Vitest 的 Node 环境里跑，不导入 Electron。它不能证明 `_menuWillShow`。`apps/desktop/test/view-menu-native.test.ts` 用仓库里的 `electron` 45.2.1 启动 `apps/desktop/test/view-menu-native-electron.mjs`。子进程对「视图(&V)」或「显示」这一层调用 `_menuWillShow()`，父进程断言 stdout 上的 `type`、`checked`、`label`。这不是菜单仍开着的画面，不是 mac，不是物理键，也不是读屏。

子进程必须调用和产品相同的 mirror，不能在 mjs 里再写一份菜单字面量。Electron 45.2.1 自带的 Node 能否直接加载 `.ts`，本回合未知：没有启动 Electron。若实施时不能加载同一模块，停下来报告。不改成 skip，不用模板读数代替，不改 CI，不装系统库。

`.github/workflows/ci.yml` 全文没有 `Xvfb`，也没有 `DISPLAY`。本工作区的环境变量 `DISPLAY` 是 `:1`。这只说明这台机器有显示，不说明 CI 的 node 作业有显示，也不说明子进程起得来。实施时子进程若起不来，停下来报告。测试保持完整，不因环境删掉 B1 或 B2。本回合不跑这条测试。

`library-menu.test.ts` 继续锁标签和加速键，并断言静态模板不带 `checked`、栏位项数不变、三个导出的事件名仍是原来的字符串。

## 文件职责

一个文件一种变化。函数软 50、硬 80。普通文件软 400、硬 600。测试软 600、硬 800。参数硬上限 4。不写模块级 `let`。这些上限来自 [ARCHITECTURE.md](../../ARCHITECTURE.md) §6 与 [RULES.md](../../RULES.md) §1.3。本计划不改它们。

| 文件 | 现在 | 只做 |
| --- | --- | --- |
| `view-menu-mirror.ts` | 无 | 形状到三个栏位的描述。none 不写 `checked`。活动 radio 恰一勾。不调用 Menu |
| `view-menu-gate.ts` | 无 | 替换门。镜像、`known` 或 `unknown`、至多一个 pending、一次额外替换、click 派发和 Promise 拒绝 |
| `library-menu.ts` | 94 | 导出三个已有事件名，数组改用它们。不加入 `checked` |
| `library-wiring.ts` | 252 | 只改菜单装配。启动装 none。三个栏位的 click 走门。文件菜单仍是 `void dispatchMenu` |
| `view-menu-gate.test.ts` | 无 | B3–B10 和 mirror 的四种形状 |
| `view-menu-native.test.ts` | 无 | B1、B2 的父进程 |
| `view-menu-native-electron.mjs` | 无 | 只对真实子菜单调用 `_menuWillShow` |
| `library-menu.test.ts` | 100 | 无勾、项数、导出的事件名 |
| `docs/evidence/<PR号>/commands.md` | 无 | 只记实际跑过的命令和退出码。行数在跑完之前未知 |

门的函数轮廓：类型、`create`、`submit`、`noteNone`、`click`、`attempt`、`drain`、`read`。`attempt` 负责一次替换、抛错和后置核对。`drain` 负责最多再替换一次；替换期间 pending 再变就标 `unknown` 并停止。`click` 在忙、销毁、替换失败、后置失效或最终镜像不再是重建前的形状时派发 0。空闲且最终仍是该形状才派发 1，并接住拒绝。

装配的函数轮廓：`openViewMenu` 创建门并 `submit("none", 固定记号)`。`installMenu` 用模板加上 mirror 重建菜单。`menuEntry` 只把三个栏位事件交给 `gate.click`。`dispatchMenu` 的函数体不改。

零 diff：`composition-root.ts`、`view-menu-epoch.ts`、`index.ts`、`window.ts`、`commandMap`、`ipc-production-assembly.test.ts`、`packages/contracts/**`、上面三份生成物、renderer、UI、存储、CSP、协议、CI、规格正文、seam、E2、已合 S2b 计划。

## 预算

口径是相对 `origin/main` 的新增+删除，含空行和注释，与 `tools/check-pr-size/check.mjs` 一致。生成物若出现 diff 就停，不手改，也不把它们写成 0 行的实测。点估计和收紧估计都还不是格式化后的 diff。未知不写成 0。

点估计按一条行为一个 `it`。参照物是 `view-menu-epoch.test.ts`：206 行、13 条例、28 个 `expect`。表里最后一列是当前函数/用例轮廓假设下的收紧估计：函数之间不留空行，B9 合成一条，行为条例按 12 行计。不删 B1–B10 的断言。这列不是数学保证下限，不证明任何完整实现都不能更短。

| 块 | 点估计行 |
| --- | --- |
| 门测试夹具 | 63 |
| B3 | 22 |
| B4 | 22 |
| B5 | 20 |
| B6 | 24 |
| B7 | 22 |
| B8 | 24 |
| B9 submit | 14 |
| B9 生命周期 none | 12 |
| B9 click | 14 |
| B10 忙 | 16 |
| B10 空闲成功 | 14 |
| B10 替换抛错 | 14 |
| B10 后置失效 | 14 |
| B10 Promise 拒绝 | 20 |
| B10 重建期间 pending 换形状 | 18 |
| mirror 四种形状 | 24 |
| 门测试合计 | 357 |

63+22+22+20+24+22+24=197。197+14+12+14=237。237+16+14+14+14+20+18=333。333+24=357。

门实现：类型 36，`create` 18，`submit` 14，`noteNone` 12，`click` 18，`attempt` 32，`drain` 28，`read` 8。36+18+14+12+18+32+28+8=166。

mirror：导入 6，类型 14，表和 `columnItems` 16，`columnItem` 18，空行 8。6+14+16+18+8=62。

`library-menu.ts`：三行导出是新增，三行数组改写是加 3 删 3。合计新增 6、删除 3、共 9。这是按现有 25–27 行能数出来的，不是轮廓。

`library-wiring.ts`：新增导入 3、`openViewMenu` 16、新的 `menuEntry` 22、新的 `toMenuItem` 12、新的 `installMenu` 8、调用点 1，共 62。删除现有 `menuEntry` 11、`toMenuItem` 9、`installFileMenu` 5、调用点 1，共 26。合计 88。删除的 26 行对应现在的 128–154 行和 `startLibrary` 里的那一次调用。

父进程 58。子进程 40 是「能导入同一个 mirror」这一假设下的收紧估计，不是数学保证下限。已合计划里的 18 行装不下导入、建真实子菜单、调用 `_menuWillShow` 和打印。加载方式仍未知。额外加载没有计进这 40 行，留在账 2 的 X，不写成 0。若实施时不能加载同一模块，停下来报告，不改用第二份模板。

`library-menu.test.ts` 新增 18，删除 0。

证据文件在写出命令输出之前未知。30 是按「每个命令一行、退出码一行」预留的估计，不是数学保证下限。不写「实际不会比这更短」。完整、可读、真实的证据少于 30 行，不能仅因此叫凑数。也不为了贴近 600 去压行、删断言，或写实现来证明更短的最优值。不把已合计划的 36 当成实测。

| 文件 | 点估计增 | 点估计删 | 点估计合计 | 收紧估计合计 |
| --- | --- | --- | --- | --- |
| `view-menu-gate.ts` | 166 | 0 | 166 | 130 |
| `view-menu-mirror.ts` | 62 | 0 | 62 | 48 |
| `library-menu.ts` | 6 | 3 | 9 | 9 |
| `library-wiring.ts` | 62 | 26 | 88 | 80 |
| `view-menu-gate.test.ts` | 357 | 0 | 357 | 226 |
| `view-menu-native.test.ts` | 58 | 0 | 58 | 48 |
| `view-menu-native-electron.mjs` | 40 | 0 | 40 | 28 |
| `library-menu.test.ts` | 18 | 0 | 18 | 14 |
| `docs/evidence/<PR号>/commands.md` | 30 | 0 | 30 | 30 |
| 未来实施，不含本计划全文 | 799 | 29 | 828 | 613 |

点估计加法：166+62+9+88=325，这是产品。357+58+40+18=473，这是测试。325+473=798，这是产品加测试。798+30=828。删除只在菜单 3 行和装配 26 行，3+26=29。799+29=828。

收紧估计加法：130+48+9+80+226+48+28+14+30=613。其中产品加门测试加菜单测试、不含 native、不含证据，是 130+48+9+80+226+14=507。613 与 507 都是当前函数/用例轮廓假设下的收紧估计，不是数学保证下限。

## 三笔账

账 1 是本回合纯文档，相对当前 main `9a1b56d1b5feb4d8188e14a713d48eecfb28b7d5`。只有本文件和 `docs/approvals.md`。台账相对 main 是新增 4、删除 1，本笔不改它。本文件相对 main 是新增 235、删除 0。当前新增+删除是 235+4+1=240。这是 `git diff --numstat origin/main` 的实测，与 PR 说明同一套数。修订前说明把新增+删除写成 239、把账 3 写成 1067，那两个数不再当作当前实数。240 低于 600 只说明这份 Draft 的文档 diff 没有越过门禁，不表示实施放得下，也不是开工许可。

账 2 是未来另开的实施 PR。全账是当前列明项点估计再加上当时的计划变更、新台账和其他未知：828 + P + A + X。P 是那支 PR 里的计划变更行数，A 是新台账行数，X 是其他未知。native 额外加载若没有计进子进程那 40 行，就在 X 里，不写成 0。P、A、X 现在没有实测，这里不填数。点估计 828 超过 600，缺口 228。当前函数/用例轮廓假设下的收紧估计 613 超过 600，缺口 13。账 2 因此保持 HOLD。这个加法不证明全账不能短于 828，也不证明没有更短的完整实现。

账 3 是假如把实施放进本 PR、仍相对当前 main。它等于 828 加上账 1 的实测新增+删除，也就是 828+240=1068。23:58 没有批准这种做法。账 3 也是 HOLD。1068 与账 1 的 240 同步，不沿用修订前的 1067。

只看当前列明的产品、门测试和菜单测试，不含 native、不含证据：点估计 325 + 357 + 18 = 700，缺口仍是 100。HOLD 不依赖 native 和证据这两项。700 是点估计，不是数学保证下限。

收紧估计里，产品加门测试加菜单测试、不含 native、不含证据，是 507。加上 native 的 76 行和证据预留 30 行，按同一组轮廓假设加总是 613。不把证据从 30 压短去贴 600，也不把短于 30 行的完整可读真实证据叫凑数。不压行，不删断言，不写实现来证明一个更短的最优值。`check-pr-size` 大于 600 才失败。10 行余量不是门禁。

1.73 只披露风险，不是第二道门。1.73×828=1432.44。1.73×613=1060.49。1.73×700=1211。三个乘积都超过 600。它们不作为开工线，也不改 600，也不是数学保证下限。

## 供 Forge 推荐的算法

下面只是行数关系。本计划不选，也不开第二支 PR。要拆或要放宽 600，都要另有 Wisdom 的原话。Forge 不批准放宽门禁。

| 算法 | 点估计 | 相对 600 | 本计划 |
| --- | --- | --- | --- |
| 整笔实施 | 828 | 超过 228 | HOLD，不实施 |
| 去掉 native 的 98 行 | 730 | 仍超过 130 | 不构成能放下的拆法 |
| 只把门测试 357 行挪走 | 剩下 471，门测试自己 357 | 两笔各自低于 600 | 行为证明和产品分开。不自动开 |
| 产品、门测试和菜单测试留在一起，不含 native 与证据 | 700 | 仍超过 100 | 这是职责上不该拆开的一笔，仍然放不下 |
| 写豁免理由或把 600 改大 | 不计算 | 门禁变化 | 本授权不做 |

## 命令

本回合 PATH 前置 `/home/ubuntu/.nvm/versions/node/v22.23.4/bin`。只跑文档检查，以及格式和 PR 体量这两条不执行产品的现有检查。不跑 codegen、Vitest、`pnpm test`、`pnpm run check`，不启动 Electron。退出码写在「计划 / 实际」和 PR 说明。不新建 `docs/evidence/`。

下面这些命令不属于本 PR。将来的实施要先有精确计划审查和另发的实施指令。全预算现在是 HOLD，这些命令不跑：

```text
corepack pnpm run codegen
git diff --exit-code
corepack pnpm exec vitest run apps/desktop/test/view-menu-gate.test.ts apps/desktop/test/view-menu-native.test.ts apps/desktop/test/library-menu.test.ts
corepack pnpm test
GATE_BASE=origin/main corepack pnpm run check
node tools/check-docs/check.mjs
GATE_BASE=origin/main node tools/check-pr-size/check.mjs
```

`codegen` 后工作区必须干净。每个 tip 的全量 `pnpm test` 只跑一次。子进程起不来就停。

## 计划 / 实际

| 步骤 | 计划 | 实际 | 证据 |
| --- | --- | --- | --- |
| 1 | 本文件。不写产品或测试 | 第二笔不回改本文件。第三笔只改口径，见步骤 5。numstat 见账 1 | 首笔 |
| 2 | 台账只追加 22:59、23:03:14、23:58。页脚改为 219 条批准、26 条合入同步。反馈 1、决定 7 不动 | 第二笔只改 `docs/approvals.md`。本笔不改台账 | 次笔 |
| 3 | 文档检查。超过 600 就停在本 Draft | 退出码见 PR 说明。不跑 B1–B10 | 本回合命令 |
| 4 | Forge 精确审查。通过前不写 `view-menu-gate.ts` | 已审 head `610b07587963ae9bb71fa85bdc23d013beb0b032`、tree `39ce6852b08bb7ab6d2eb89648983a0f9be7ce21`、base `9a1b56d1b5feb4d8188e14a713d48eecfb28b7d5`。只要求改估算口径。产品与测试仍未写 | 审查 |
| 5 | 第三笔只改本文件的口径。不改台账，不加批准行 | 账 1、账 3 改成这次相对 main 的实测。退出码见 PR 说明 | 口径 |

## 决策记录

| 决定 | 理由 | 日期 | 谁定的 |
| --- | --- | --- | --- |
| 23:58 只写实施计划、预算和台账 | 原话见文首。不是精确计划 PASS，也不是编码批准 | 2026-11-16 | Wisdom 原话 |
| 22:59 只合入 PR #223 的计划与台账 | 原话在台账。不含产品或测试。本行不把它写成实施批准 | 2026-11-16 | Wisdom 原话 |
| 23:03:14 只同步合入结果 | API `merged_at` 是 15:03:14Z。不是新批准 | 2026-11-16 | Forge 同步，非新批准 |
| 589 不作为额度 | 它是已合计划里的未入库底稿。本文件按文件和断言重数 | 2026-11-16 | 计划核对，非新批准 |
| 点估计 828 与收紧估计 613 都 HOLD | 两数都超过 600。613 是当前函数/用例轮廓假设下的收紧估计，不是数学保证下限。不删断言，不拆，不改 600。口径修正不是新决定 | 2026-11-16 | 按 23:58 的停点核对，非新批准 |
| 不补 epoch 接线 | 同一实例、换代通知和 floor 写者还没有另批 | 2026-11-16 | 沿用已合 seam 的文件名单，非新批准 |

## 交接

从 main `9a1b56d1b5feb4d8188e14a713d48eecfb28b7d5` 审查这一支 Draft。先读本文件、seam 上列六节、台账 23:58 行。本任务受 UI 与业务核心解耦约束：ARCHITECTURE.md §2.1 与 RULES.md §8。改 UI 不得改变核心行为，也不得让核心测试失败；seam 不够用时先停下来说明缺什么。

账 2 和账 3 都是 HOLD。Ready、合入、产品或测试编码、拆分、后续范围和发版都还没有批准。在那之前不写门，不改菜单，不开 Ready。

## 自检

- [x] 影响 arch / prd 吗？不影响。
- [x] 计划这一笔只改本文件。台账是下一笔。
- [x] 不改已合 S2b 计划、seam、E2。

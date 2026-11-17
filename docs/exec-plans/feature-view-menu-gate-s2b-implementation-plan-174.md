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

账 1 是本 PR 的纯文档，相对当前 main `9a1b56d1b5feb4d8188e14a713d48eecfb28b7d5`。只有本文件和 `docs/approvals.md`。口径修正提交 `03ec8a759897feff177e998444014056b65b4b7c` 时，本文件新增 235、删除 0，台账新增 4、删除 1，新增+删除 240，账 3 是 1068。那两个数是当时的实测。本轮追加职责候选和 09:59 台账行之后，当前实测改记在这里：本文件新增 338、删除 0；台账新增 5、删除 1；新增+删除 344。与 PR 说明同一套数。344 低于 600 只说明这份 Draft 的文档 diff 没有越过门禁，不表示任何实施候选放得下，也不是开工许可。若本轮文档本身超过 600，停在这里报告，不削本节去贴线。

账 2 是未来另开的实施 PR。全账是当前列明项点估计再加上当时的计划变更、新台账和其他未知：828 + P + A + X。P 是那支 PR 里的计划变更行数，A 是新台账行数，X 是其他未知。native 额外加载若没有计进子进程那 40 行，就在 X 里，不写成 0。P、A、X 现在没有实测，这里不填数。点估计 828 超过 600，缺口 228。当前函数/用例轮廓假设下的收紧估计 613 超过 600，缺口 13。账 2 因此保持 HOLD。这个加法不证明全账不能短于 828，也不证明没有更短的完整实现。

账 3 是假如把整笔实施放进本 PR、仍相对当前 main。它等于 828 加上账 1 的当前实测新增+删除，也就是 828+344=1172。23:58 没有批准这种做法。账 3 也是 HOLD。1172 与账 1 同步。1068 只属于 `03ec8a7` 当时的文档行数。

只看当前列明的产品、门测试和菜单测试，不含 native、不含证据：点估计 325 + 357 + 18 = 700，缺口仍是 100。HOLD 不依赖 native 和证据这两项。700 是点估计，不是数学保证下限。

收紧估计里，产品加门测试加菜单测试、不含 native、不含证据，是 507。加上 native 的 76 行和证据预留 30 行，按同一组轮廓假设加总是 613。不把证据从 30 压短去贴 600，也不把短于 30 行的完整可读真实证据叫凑数。不压行，不删断言，不写实现来证明一个更短的最优值。`check-pr-size` 大于 600 才失败。10 行余量不是门禁。

1.73 只披露风险，不是第二道门。1.73×828=1432.44。1.73×613=1060.49。1.73×700=1211。三个乘积都超过 600。它们不作为开工线，也不改 600，也不是数学保证下限。

## 职责候选

Wisdom 2026-11-17 09:59 原话只有：「请你按照项目进度继续推进吧。」来源是 [issue #174 评论 6935563052](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6935563052)。Forge 在同一条登记里写的限定执行解释不是用户第二句原话：本轮只在本 PR 拟定按自然职责分批的候选，逐批核全部新增+删除、依赖和验收，精确审查后汇报。不是批准候选实施，不开产品分支或产品 PR，不编码，不 Ready，不合入，不发版。23:58 的未批边界不回写。600、完整测试、超过就停，都不变。613 和证据 30 仍只是轮廓估算，不是保证下限。

上面的 828 + P + A + X 继续是整笔 HOLD 的历史全账。本节不把它改成三笔之和，也不把它当成已经拆开的额度。211、499、88 是从那张点估计表切出来的产品加测试粗数，不是各批的整 PR 预算。211 = mirror 62 + 菜单增删 9 + 四种形状 24 + 原生父进程 58 + 子进程 40 + 菜单测试 18。499 = 门 166 +（门测试 357 − 已划到形状的 24）。88 = 装配新增 62 + 删除 26，里面没有装配行为测试。211+499+88 = 798，再加当时的证据预留 30 才是 828。

候选顺序是 A，然后 B，然后 C。这是供审查的安排，不是冻结答案，本轮不执行。A 提供形状和三个事件名。B 的测试调用已合的 mirror，不另写一套形状，也不做兼容层。C 的装配调用已合的 mirror 和 gate。不能倒序，也不能三支同时开去导入还没有的模块。每批的产品文件和它自己的行为证明在同一支未来 PR 里。不把门和门测试拆开凑 600，也不把 native 留到以后却称这一职责已经完成。

每批全账都相对它自己的预期 base，口径仍是新增+删除。全账 = 已列明的产品与测试轮廓 + 该 PR 的计划变更 P + 新台账 L + 证据 E + 其他未知 X。P、L、X 现在没有实测，不记 0。E 的 16 是按「命令一行、退出码一行」为这一批单独留的轮廓预留，不是下限；完整可读的真实证据更短，不能因此叫凑数。三批的 E 相加也不等于原来的 30，30 仍只属于整笔那一列。

Loom 对已合 S2b 计划的原则结论继续用于不改交互的职责划分：栏位切换仍是支持性能力，仍放在系统原生菜单里，none 不是第四项，活动形状的测试不是生产已联动。DESIGN §4.10 的 11.1 还列着侧栏、全屏、打开文件夹和置灰。当前 `library-menu.ts` 的视图子菜单只有现有 10 项。这些候选不补那些项，也不把不可用项改成置灰。要改菜单行为或 seam，就停下来报告，不在分批里做。

### A 形状与原生语义

预期 base 是本计划合入之后的 main。本文件全文已经在 base 里，只有那支 PR 再改计划才计入 P_A。

已列明轮廓：`view-menu-mirror.ts` 新增 62、删除 0。`library-menu.ts` 新增 6、删除 3，现在文件 94 行，三个栏位事件改成导出常量，数组改用它们，模板仍不写 `checked`。`view-menu-mirror.test.ts` 新增 24，承接原来放在门测试里的四种形状。`library-menu.test.ts` 新增 18、删除 0，锁现有标签、加速键、导出的事件字符串、栏位项数，并断言静态模板不带 `checked`。`view-menu-native.test.ts` 新增 58。`view-menu-native-electron.mjs` 新增 40，这 40 只覆盖「子进程能加载同一个 mirror」的轮廓。62+6+3+24+18+58+40 = 211。删除只有菜单那 3 行。

全账是 211 + P_A + L_A + E_A + X_A。E_A 的轮廓预留是 16。211+16 = 227。227 低于 600 的差是 373，这 373 不是给未知项的额度。X_A 是子进程加载 `.ts` 的额外代码，以及 CI 没有 `DISPLAY` 时子进程起不来所多出来的处理。两条都没有实测，不记 0。加载不了同一个模块，或子进程起不来，就停。不改成 skip，不装系统库，不改 CI，不用第二份菜单字面量代替。因此现在不能把 A 写成全账 ≤ 600。

A 不导入 gate，也不改 `library-wiring.ts`。现有 `startLibrary` 仍调用 `installFileMenu`，应用启动路径不变。Node 测试和 `tsc` 可以单独编译 mirror 与菜单。原生子进程是另一条启动，不能用 Node 里的形状断言代替 B1、B2。

A 交给后面的接口：mirror 把 `none`、`original`、`contrast`、`translation` 变成三个栏位描述。`none` 不写 `checked`。三种活动值是 radio，且恰有一项 `checked: true`。mirror 不调用 Menu。`library-menu.ts` 导出的仍是现有字符串 `oi-view-original`、`oi-view-bilingual`、`oi-view-translation`。

### B 纯替换门

预期 base 是 A 合入之后的 main。测试里的形状调用已合 mirror。不在 B 里复制一份形状表，也不加临时适配让 B 能在 A 之前编译。

已列明轮廓：`view-menu-gate.ts` 新增 166、删除 0。`view-menu-gate.test.ts` 新增 333、删除 0。333 = 357 − 24，24 已在 A。夹具 63 仍算在这 333 里；若实施时发现夹具里有一段必须随 mirror 移走，333 会变，现在不预扣，也不把 333 写成上限。166+333 = 499。B3–B8 仍要看到最终镜像和 `known` 或 `unknown`。B9 仍是把 `destroyed` 作为入参交给门。B10 的六条仍全部留在这个文件。这些断言不删。

全账是 499 + P_B + L_B + E_B + X_B。E_B 的轮廓预留是 16。499+16 = 515。515 距 600 还有 85。P_B、L_B 和轮廓没有覆盖到的差异都要占这 85，而且现在都不是 0。所以 B 的全账可能超过 600。本轮不把 B 再拆开，也不把 B10 挪到 C 去给 B 腾行。将来的实施计划若把全账算过 600，就停下来报告。

B 不导入 Electron，也不导入 `library-wiring.ts`。生产启动仍不引用这扇门，所以应用还能按 A 的菜单启动。B 自己的证明是 Vitest 的 Node 测试。它不能证明 `_menuWillShow`，也不能证明 `startLibrary` 已经装上 none。

### C 生产 none 装配

预期 base 是 A 和 B 都合入之后的 main。`library-wiring.ts` 直接导入已合的 mirror 和 gate。不造第二套形状，也不造桩模块。

已列明的产品轮廓仍是新增 62、删除 26，合计 88。`dispatchMenu` 的函数体不改。`startLibrary` 的参数仍是现在的 `dataRoot` 和可选 registrar，不接收 epoch。文件现在 252 行；按这 88 行增删，长度大约增加 36，仍低于 ARCHITECTURE §6 的建议 400。这只是文件长度核对，不是 PR 预算。

88 没有装配测试。按同一套每条行为十几到二十几行的轮廓，另估 `library-wiring` 的菜单测试新增 94、删除 0：

| 装配断言 | 轮廓 | 和谁不是同一层 |
| --- | --- | --- |
| 启动安装的是 mirror 的 none，三个栏位没有 `checked` | 22 | A 的 B1 读的是真实 `_menuWillShow`。这里只证明 wiring 把 none 交进去 |
| 三个栏位 click 进入 `gate.click`，文件菜单事件不进入 | 18 | 不改 `dispatchMenu`，也不用源码文本证明文件菜单 |
| 视图 click 的 `executeJavaScript` 拒绝被接住 | 24 | B10 证明门的六条分支。这里只证明生产 click 走到那扇门，而且拒绝不冒出这条 handler。B10 一条都不删 |
| 启动时 `submit` 的记号是常量，`noteNone` 次数是 0 | 14 | 生产仍不接代 |
| 关掉或销毁假窗口之后，`submit`、`noteNone`、`click` 仍是启动后的次数 | 16 | B9 证明门在 `destroyed` 为真时不调用 Menu。这里证明生产路径没有把销毁送进门 |

22+18+24+14+16 = 94。产品加测试轮廓是 88+94 = 182。这 94 行不在原来的 828 里。211+499+182 = 892，已经比 798 多出这 94。

全账是 182 + P_C + L_C + E_C + X_C。E_C 的轮廓预留是 16。182+16 = 198。X_C 是假 Menu、假窗口比这 94 行更长的部分，不记 0。C 不用原生子进程，也不把真实菜单画面算进这 94。现在同样不能写成全账 ≤ 600。

C 改的是启动时怎么装菜单。A、B 未合入时，这支不能靠临时导入不存在的模块来编译。合入后应用仍应能启动：生产菜单仍是 none 的普通项。`expose` 仍是 false。三份生成物、`composition-root.ts`、`index.ts`、`view-menu-epoch.ts` 都是零 diff。

窗口销毁、换代、退役、关闭推动这扇门，以及 floor 的唯一写者，仍是将来另批。那一批要写明同一个 epoch 实例怎样到达门、通知进哪一次调用、floor 谁写、相对当时 main 的新增+删除。A、B、C 的白名单都不含 `index.ts` 和 `view-menu-epoch.ts`。不借这次划分去补那条接线，也不另造第二份代次表或模块级单例。

### B1–B10 落在哪一批

| 编号 | 批 | 证明层 |
| --- | --- | --- |
| B1 | A | 真实 Electron 45.2.1，子菜单 `_menuWillShow` 之后。子进程调用和产品相同的 mirror |
| B2 | A | 同上。三种活动值各自恰一项 radio 为勾 |
| B3 | B | fake。成功退出，最终镜像是这份 none，安装 `known` |
| B4 | B | fake。抛错退出，最终镜像是被消费的 pending，安装 `known` |
| B5 | B | fake。后置核对失败，最终镜像是被消费的 pending，安装 `known` |
| B6 | B | fake。没有第三次 `replace`，安装 `unknown`，已提交镜像不变 |
| B7 | B | fake。同记号旧 pending 先清掉，最终是 contrast，安装 `known` |
| B8 | B | fake。换代写下的 none 留下，旧形状不提交为镜像 |
| B9 | B | fake。`destroyed` 为真时 `replace` 是 0。C 的第 5 条不代替这一条 |
| B10 | B | fake。忙、成功、替换失败、后置失效、重建期间换形状、Promise 拒绝。C 的第 3 条不代替这六条 |

四种形状的 Node 断言在 A，不能代替 B1、B2。静态模板断言在 A，不能代替原生菜单，也不能代替 C 的启动安装。B 的 fake 不能代替 native。组件测试不在这三批里，也不能用来证明生产菜单已经联动。

### 推荐和放不下的项

推荐审查的顺序就是 A，然后 B，然后 C。三批都还没有实施授权。代价是三次计划审查、三次测试和三次合入决定，而不是一次。三笔全账相加会高于 828：每笔自带 P、L、E，C 又补上原来没有的 94 行装配测试。1.73 仍只披露风险。1.73×211 = 365.03，1.73×499 = 863.27，1.73×182 = 314.86。863.27 超过 600，只说明 B 的产品加测试轮廓在这个系数下越过披露线，不作为第二道门，也不因此现在就拆 B。

现在就不能写成放得下的，有这些：

- 整笔实施。点估计 828，再加 P、A、X，HOLD 不变。
- 把 211、499 或 88 当成某一支 PR 的全部预算。
- B 的全账。499 加证据预留 16 之后只剩 85 行给 P_B、L_B 和 X_B。未知不记 0，所以可能超过 600。超过就停报，不删 B3–B10。
- 只做静态模板、不做 B1 和 B2，却称形状职责完成。
- 用 C 补上 epoch、生命周期通知或 floor。那会改 `index.ts` 或 epoch，超出 S2b 的文件名单。
- 按 DESIGN 11.1 增加侧栏、全屏、打开文件夹或置灰。那是产品行为变化，本轮停。

本计划不代 Wisdom 选择实施哪一批，也不打开那些分支。

### 交接指令

下面三段可以以后另获实施批准时粘给 Cursor。现在没有实施授权。不创建这些分支，不写这些文件。

A 的指令：目标是形状和原生语义。完整验收是 B1、B2，加上四种形状和静态标签、加速键、三个事件名。文件白名单是 `apps/desktop/src/main/view-menu-mirror.ts`、`apps/desktop/src/main/library-menu.ts`、`apps/desktop/test/view-menu-mirror.test.ts`、`apps/desktop/test/view-menu-native.test.ts`、`apps/desktop/test/view-menu-native-electron.mjs`、`apps/desktop/test/library-menu.test.ts`，以及那一支自己的计划、台账追加和 `docs/evidence/<PR号>/commands.md`。架构硬约束：本任务受 UI 与业务核心解耦约束：ARCHITECTURE.md §2.1 与 RULES.md §8。改 UI 不得改变核心行为，也不得让核心测试失败；seam 不够用时先停下来说明缺什么。不调用 Menu 的生产装配，不导入 gate，不改 wiring、epoch、`index.ts`、`expose`、生成物、DESIGN 和规格。子进程必须加载同一个 mirror；加载不了或没有显示就停，不 skip，不改 CI。建议分支 `feature/view-menu-mirror-s2b-a-174`，独立 worktree，PR 保持 Draft。这整段未获实施授权。

B 的指令：目标是纯替换门和全部 fake 证明。完整验收是 B3–B10，一条不删。形状从已合 mirror 导入。文件白名单是 `apps/desktop/src/main/view-menu-gate.ts`、`apps/desktop/test/view-menu-gate.test.ts`，以及那一支自己的计划、台账追加和证据。架构硬约束沿用上一节那一句。不导入 Electron，不改 `library-wiring.ts`、`library-menu.ts`、epoch、`index.ts`、`expose` 和生成物。不把 B10 分到别的 PR。全账超过 600 就停报。建议分支 `feature/view-menu-gate-s2b-b-174`，base 是 A 已合的 main，独立 worktree，PR 保持 Draft。这整段未获实施授权。

C 的指令：目标是生产 none 装配和上表五行装配断言。完整验收不含把 B9、B10 再实现一遍，那两号仍以 B 的测试为准；C 只证明启动 none、三个栏位进门、文件菜单不进门、拒绝被接住、记号是常量、销毁不会推动门。文件白名单是 `apps/desktop/src/main/library-wiring.ts` 的菜单装配、对应的新测试、那一支自己的计划、台账追加和证据。`composition-root.ts`、`index.ts`、`view-menu-epoch.ts`、三份生成物为零 diff。`expose` 保持 false。不含 handler、生产命令表、renderer、UI、存储、CSP、协议、S2c、账户或登录。架构硬约束沿用上面那一句。建议分支 `feature/view-menu-wiring-s2b-c-174`，base 是 A 和 B 已合的 main，独立 worktree，PR 保持 Draft。这整段未获实施授权。

## 供 Forge 推荐的算法

下面这张表仍是整笔行数关系，不是上一节的候选，本计划不选，也不开第二支 PR。要拆或要放宽 600，都要另有 Wisdom 的原话。09:59 只授权把候选写进本文件。Forge 不批准放宽门禁。

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
| 5 | 第三笔只改本文件的口径。不改台账，不加批准行 | 账 1、账 3 在 `03ec8a7` 时是 240 与 1068。本表以后的步骤会再改这两个当前实数 | 口径 |
| 6 | 09:59 只在本文件追加职责候选。不编码，不拆产品 PR | 第四笔只改本文件。当前 docs 账改成两笔提交后的实测 | 候选 |
| 7 | 台账只追加 09:59。页脚批准从 219 改为 220。反馈 1、决定 7、合入同步 26 不动。旧行不改 | 第五笔只改 `docs/approvals.md` | 次笔 |

## 决策记录

| 决定 | 理由 | 日期 | 谁定的 |
| --- | --- | --- | --- |
| 23:58 只写实施计划、预算和台账 | 原话见文首。不是精确计划 PASS，也不是编码批准 | 2026-11-16 | Wisdom 原话 |
| 22:59 只合入 PR #223 的计划与台账 | 原话在台账。不含产品或测试。本行不把它写成实施批准 | 2026-11-16 | Wisdom 原话 |
| 23:03:14 只同步合入结果 | API `merged_at` 是 15:03:14Z。不是新批准 | 2026-11-16 | Forge 同步，非新批准 |
| 589 不作为额度 | 它是已合计划里的未入库底稿。本文件按文件和断言重数 | 2026-11-16 | 计划核对，非新批准 |
| 点估计 828 与收紧估计 613 都 HOLD | 两数都超过 600。613 是当前函数/用例轮廓假设下的收紧估计，不是数学保证下限。不删断言，不拆，不改 600。口径修正不是新决定 | 2026-11-16 | 按 23:58 的停点核对，非新批准 |
| 不补 epoch 接线 | 同一实例、换代通知和 floor 写者还没有另批。职责候选也不把它们放进 A、B、C | 2026-11-16 | 沿用已合 seam 的文件名单，非新批准 |
| 09:59 只拟职责候选 | 用户原话只有「请你按照项目进度继续推进吧」。分批限定写在台账，是 Forge 解释，不是用户第二句。不执行拆分 | 2026-11-17 | Wisdom 原话；范围是 Forge 解释 |

## 交接

从 main `9a1b56d1b5feb4d8188e14a713d48eecfb28b7d5` 审查这一支 Draft。先读本文件、seam 上列六节、台账 23:58 行。本任务受 UI 与业务核心解耦约束：ARCHITECTURE.md §2.1 与 RULES.md §8。改 UI 不得改变核心行为，也不得让核心测试失败；seam 不够用时先停下来说明缺什么。

账 2 和账 3 都是 HOLD。A、B、C 只是候选。Ready、合入、产品或测试编码、实际拆分、后续范围和发版都还没有批准。在那之前不写门，不改菜单，不开产品分支，不开 Ready。

## 自检

- [x] 影响 arch / prd 吗？不影响。
- [x] 计划这一笔只改本文件。台账是下一笔。
- [x] 不改已合 S2b 计划、seam、E2。

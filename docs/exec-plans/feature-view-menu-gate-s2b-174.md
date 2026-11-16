# 执行计划

S2b：视图菜单的 none / 活动形状、替换门与镜像。分支 `feature/view-menu-gate-s2b-174`。基线 main `85632b3d7f7073dbbd77b3db47142f015af272f4`，parent `405c865a48902d6406a964a155823c49f4e3bff9`，tree `8f343d3c62896e40d57c495d63257621fa9a6b5f`。

行为只沿用已合 [seam](feature-reader-view-menu-seam-174.md) 的「[仍然成立](feature-reader-view-menu-seam-174.md#仍然成立)」「[替换门](feature-reader-view-menu-seam-174.md#替换门)」「[轨迹](feature-reader-view-menu-seam-174.md#轨迹)」「[验收](feature-reader-view-menu-seam-174.md#验收)」「[分批](feature-reader-view-menu-seam-174.md#分批)」「[将来另批才许改的文件](feature-reader-view-menu-seam-174.md#将来另批才许改的文件)」。不重开架构，不另写一套门算法，不改那份计划和 [E2 计划](feature-reader-view-modes-e2-174.md)。标签仍是 [DESIGN.md](../../DESIGN.md) §4.10 的 11.1：mac「显示」，其他平台「视图(&V)」。不改 DESIGN 正文。

Wisdom 2026-11-16 21:52 原话：「按照项目进度推进吧」。范围在 [docs/approvals.md](../approvals.md) 的 21:52 行，是 Forge 的限定解释，不是本计划的 PASS。20:57 与 21:03:24 只补记 PR #222。Loom 对上述 main 的只读原则复核是 PASS；Forge 读过 `/workspace/oi-qa/v2-s2b-principles/LOOM.md`，本工作区没有那份报告，这里不抄。四条结论：栏位切换仍是支持性能力，用户仍在系统原生菜单里选择；`none` 是内部状态，不是第四项；本笔没有 handler、`expose` 和 renderer 上报，生产仍是 none 的普通项，活动模板或装配测试不是生产已联动；`none` 不写 `checked`，活动构造恰一勾，pending 与换代沿已合 seam。原则 PASS 不代替精确计划 PASS，也不表示实现、原生画面或真机已验。

## 现状

`library-menu.ts` 94 行，已有原文、对照、译文和 `oi-view-original`、`oi-view-bilingual`、`oi-view-translation`。`library-wiring.ts` 252 行。`dispatchMenu` 返回 `executeJavaScript` 的 Promise，调用处是 `void dispatchMenu`，没有 `.catch`。不能假定这句 `void` 已经接住拒绝。`view-menu-epoch.ts` 128 行，公开的只有 `attach` 和 `read`。`index.ts` 的 `startDesktop` 私自 `createViewMenuEpoch()`，只传给 `createMainWindow`。`composition-root.ts` 的 `startLibrary` 拿不到这个实例。S2a 的假 `Menu` 没有 `_menuWillShow`。

## 边界

`none` 用普通项，构造参数不写 `checked`。`original`、`contrast`、`translation` 把这三项建成 radio，恰一项 `checked: true`。不在已挂上的 radio 上改 `checked`；换形状就新建菜单再 `setApplicationMenu`。Electron 45.2.1 的 `Menu::MenuWillShow` 只遍历这一层：radio 全未勾时勾第一项，普通项跳过。不自绘，不置灰，不改成 checkbox，不加「无」项。不改标签、accelerator、enabled、事件名。

门的状态、三种退出、同代旧 none 和换代，以 seam「替换门」和「轨迹」为准。pending 只收生命周期的 none，并记下阶段记号。被拒绝的上报不能变成 pending。生产装配只装 none。活动形状由同一套纯函数生成，测试可以直接调用。矩阵里的换代和销毁用门的入参驱动。这符合 seam「分批」里 S2b 仍是 none 普通项、不含 handler 的分期，不因此扩大本笔。

以后的依赖现在没有接上，本笔也不能称已经解决。`ViewMenuEpoch` 没有生命周期订阅，也没有 floor 更新入口。`startLibrary` 拿不到 `index.ts` 手里的那一个实例。已合 S2b 白名单不含这三处的接线。S2c-on 生产启用前，要另取精确范围批准，写明同一实例如何到达门、换代 / 退役 / 关闭通知进哪扇门、floor 由谁唯一更新，以及准确文件。不许另造第二份 epoch 表、模块级可变单例，或让 payload 自报代次来绕过。本笔不改 `view-menu-epoch.ts`、`index.ts`、`composition-root.ts`。

## 验收

B1、B2 读的是子菜单 `_menuWillShow` 返回之后的真实 `MenuItem`。读构造参数不算菜单已经打开，也不算真机。B3–B8 必须看到最终镜像，以及 `known` 或 `unknown`，不能只数 `replace`。

| 编号 | 载体 | 通过 |
| --- | --- | --- |
| B1 | 真实 Electron | 视图子菜单上，原文、对照、译文是 `normal`，`checked` 为 false。没有第四项 |
| B2 | 真实 Electron | `original`、`contrast`、`translation` 各自恰一项 radio 为勾，分别是原文、对照、译文。另两项是未勾的 radio |
| B3 | fake | 成功退出消费仍有效的 pending，最多再替换一次。最终镜像是这份 none，安装 `known` |
| B4 | fake | 抛错退出同样最多再替换一次。最终镜像不是抛错的形状，而是被消费的 pending，安装 `known` |
| B5 | fake | 后置核对失败同样最多再替换一次。最终镜像是被消费的 pending，安装 `known` |
| B6 | fake | 额外那次替换期间 pending 再更新：没有第三次 `replace`。最新 pending 留下。安装 `unknown`。已提交镜像保持进入这次之前的值 |
| B7 | fake | 合法 `contrast` 开始前清掉同记号的旧 pending。只替换 contrast。最终菜单和镜像都是 contrast，安装 `known` |
| B8 | fake | 替换期间换代写下的 none 留下。旧 submit 后置失败，不把旧形状提交为镜像。新 none 再替换一次。最终镜像是这份 none，安装 `known` |
| B9 | fake | `destroyed` 为真时 `replace` 为 0，不调用 Menu。已提交镜像不变 |
| B10 | fake，只限视图事件 | 忙时派发 0，且不覆盖 pending。空闲重建最终成功才派发 1。替换失败或后置失效派发 0。接住 `executeJavaScript` 返回的 Promise 拒绝。文件菜单仍是现有的 `void dispatchMenu`，不假定它已捕获，本笔也不改那条路径 |

## 载体

`apps/desktop/test/view-menu-gate.test.ts` 在 Vitest 的 Node 环境里跑，不导入 Electron，不能证明 `_menuWillShow`。`apps/desktop/test/view-menu-native.test.ts` 用仓库里的 `electron` 45.2.1 启动 `apps/desktop/test/view-menu-native-electron.mjs`。子进程对「视图(&V)」或「显示」这一层调用 `_menuWillShow()`，父进程断言 stdout 上的 `type`、`checked`、`label`。这不是菜单仍开着的画面，不是 mac，不是物理键，也不是读屏。`library-menu.test.ts` 继续锁标签和加速键，并断言静态模板与 none 形状都不带 `checked`、项数不变。

`.github/workflows/ci.yml` 的 `node` 作业没有写 Xvfb，也没有写 `DISPLAY`。实施时真实子进程若起不来，停下来报告。不改成 skip，不用模板读数代替，不改 CI，不装系统库。测试保持完整，不因环境删掉 B1 或 B2。

## 文件与预算

口径是相对 `origin/main` 的新增+删除。下表同时是实施白名单和逐文件预算。旧底稿把产品与测试估成 481，门测试 158 行只数 `replace`，没有本表 B3–B8 的镜像和安装状态，也没有 B10 的失败派发与 Promise 拒绝。按 `view-menu-epoch.test.ts` 的密度把这些断言写成未入库底稿后，门测试 213 行，原生父进程 58 行，子进程 18 行。门实现在旧 131 行上加 6 行，只捕获视图事件的 Promise。其余文件仍用旧底稿。产品与测试因此是 553，不是用 481 去限制测试。

| 文件 | 现在 | 本笔 | 增 | 删 | 合计 |
| --- | --- | --- | --- | --- | --- |
| `apps/desktop/src/main/view-menu-gate.ts` | 无 | 新建。只有替换门，并捕获视图事件的 Promise | 137 | 0 | 137 |
| `apps/desktop/src/main/view-menu-mirror.ts` | 无 | 新建。只有形状到菜单项 | 58 | 0 | 58 |
| `apps/desktop/src/main/library-menu.ts` | 94 | 导出三个已有事件名，数组改用它们 | 10 | 3 | 13 |
| `apps/desktop/src/main/library-wiring.ts` | 252 | 只改菜单装配。启动装 none。三个栏位的 click 走门 | 32 | 12 | 44 |
| `apps/desktop/test/view-menu-gate.test.ts` | 无 | B3–B10，含最终镜像、安装状态和派发次数 | 213 | 0 | 213 |
| `apps/desktop/test/view-menu-native.test.ts` | 无 | B1、B2 的父进程 | 58 | 0 | 58 |
| `apps/desktop/test/view-menu-native-electron.mjs` | 无 | 只对子菜单调用 `_menuWillShow` | 18 | 0 | 18 |
| `apps/desktop/test/library-menu.test.ts` | 100 | 无勾、无第四项 | 12 | 0 | 12 |
| 产品与测试 |  |  | 538 | 15 | 553 |
| `docs/evidence/<PR号>/commands.md` | 无 | 只记实际跑过的命令和退出码 | 36 | 0 | 36 |
| `docs/approvals.md` | 已提交 | 本回合不改 | 4 | 1 | 5 |
| 本文件 | 无 | 计划 | 113 | 0 | 113 |
| 同一 Draft |  |  |  |  | 707 |

553+36+5=594。本文件 113 行，合计 707。要在 600 内再留至少 10 行，计划得是负数。正常短稿做不到。已合 seam「分批」里的 344 是当时的估计，不是本笔额度。346 只触发重估。1.73×481=832.13；旧稿写成 827.13，那个乘积是算错的。1.73×553=956.69。两个乘积都只披露风险，不是第二门槛，也不改 600。

不改：`composition-root.ts`、`view-menu-epoch.ts`、`window.ts`、`index.ts`、`wiredLibraryCommands`、`ipc-production-assembly.test.ts`、`packages/contracts/**`、三份生成物、renderer、UI、存储、CSP、协议、DESIGN、设计原则、`docs/design/**`、环境安装文件、CI、规格正文、seam 与 E2 计划。不启用 handler。codegen 后生成物零 diff。函数软 50、硬 80。文件软 400、硬 600；测试软 600、硬 800。不写模块级 `let`。`max-params` 为 4。不写 `G12:`。

Forge 还没选载体。本回合不拆 PR，也不先合文档。两条都要另有明确决定才许动：本 Draft 停在计划和已提交台账，实施文件与证据等下一次精确范围批准；或者仍在这一支实施，由 Forge 处理 594 已经没有计划行可挤的缺口。不删断言，不把 600 改掉。

## 命令

本回合只跑 `node tools/check-docs/check.mjs`。PATH 前置 `/home/ubuntu/.nvm/versions/node/v22.23.4/bin`。不跑 codegen、Vitest、`pnpm test`、`pnpm run check`，不启动 Electron。

实施要等精确复审通过，并且另有实施指令，还要先有放得进 600 的载体。那时才跑，并且只把实际退出码写入证据：

```text
corepack pnpm run codegen
git diff --exit-code
corepack pnpm exec vitest run apps/desktop/test/view-menu-gate.test.ts apps/desktop/test/view-menu-native.test.ts apps/desktop/test/library-menu.test.ts
corepack pnpm test
GATE_BASE=origin/main corepack pnpm run check
node tools/check-docs/check.mjs
GATE_BASE=origin/main node tools/check-pr-size/check.mjs
```

`codegen` 后工作区必须干净。每个 tip 的全量 `pnpm test` 只跑一次。

## 计划 / 实际

| 步骤 | 计划 | 实际 | 证据 |
| --- | --- | --- | --- |
| 1 | 本文件。不写产品代码 | 172 行稿改成短稿，并按完整断言重估 | 本提交 |
| 2 | 台账。本回合不改 | 已在 `202047d5`。本回合未改 | `202047d5` |
| 3 | Forge 精确复审。另发实施指令前不实施 |  |  |

## 决策记录

| 决定 | 理由 | 日期 | 谁定的 |
| --- | --- | --- | --- |
| 21:52 只推进 S2b 的计划与台账 | 原话「按照项目进度推进吧」。执行范围是 Forge 的解释 | 2026-11-16 | Wisdom 原话；范围是 Forge 解释 |
| 沿用已合 seam 的上列六节 | 不重开架构。验收留在本文件 | 2026-11-16 | 计划核对，非新批准 |
| 原则复核只引用四条 | 基线是 `85632b3`。无新拍板。不代替技术 PASS | 2026-11-16 | Loom 复核，非新 Wisdom 批准 |
| 产品与测试按 553 重估 | 旧 481 的门测试没有最终镜像、安装状态、失败派发和 Promise 拒绝 | 2026-11-16 | 按审查补断言后重数，非新批准 |
| 短稿仍超 600 就停 | 594 加上任何可读的计划都留不出 10 行。不删测试，不拆 PR | 2026-11-16 | 按 21:52 的硬停点核对，非新批准 |

## 交接

从 main `85632b3d7f7073dbbd77b3db47142f015af272f4` 继续这一支 Draft。先读本文件、seam 上列六节和台账 21:52 行。本任务受 UI 与业务核心解耦约束：ARCHITECTURE.md §2.1 与 RULES.md §8。改 UI 不得改变核心行为，也不得让核心测试失败；seam 不够用时先停下来说明缺什么。本回合任务类型：不适用（纯文档）。下一笔不是实施。Forge 复审本短稿，并决定 600 的载体。在那之前不写 `view-menu-gate.ts`，不改菜单，不开 Ready。

## 自检

- [x] 影响 arch / prd 吗？不影响。
- [x] 本回合只改本文件。

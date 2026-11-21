# 执行计划

A 批形状与真实 native B1/B2 的预算、依赖、验收和加载/显示环境方案。只写本文件和批准台账。不写产品，不写测试，不启动 Electron，不下载 Electron 二进制，不试加载，不改 CI，不改系统。

分支 `feature/view-menu-shape-native-a-plan-174`。从 live `origin/main` 另开，不续已合 PR #224 的分支 `feature/view-menu-gate-s2b-implementation-plan-174`。`git fetch origin main` 之后，`origin/main` 是 `8beb515a44fa30a3e2580c9b37e0a693d34e810d`，唯一 parent `9a1b56d1b5feb4d8188e14a713d48eecfb28b7d5`，tree `fc81b2153880bfc1d60e963e69f8580fca1ba35d`。与 Forge 刚核的 main 左右计数是 0。没有漂移。

Wisdom 2026-11-17 11:00 原话：「批准从当前 main 另开纯文档 Draft，仅细化 A 批形状与真实 native B1/B2 的完整预算、依赖、验收和加载/显示环境方案，并补记批准及合入台账；先精确审查，超过600就报告，不删测试、不改600、不自动拆分。不批准产品或测试编码、运行未批准的环境试验、改CI或系统设置、Ready、合入、B/C实施、后续范围或发版。」来源是 [issue #174 评论 6936713814](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6936713814)。这不是实施批准，也不是精确计划 PASS。

本任务受 UI 与业务核心解耦约束：ARCHITECTURE.md §2.1 与 RULES.md §8。改 UI 不得改变核心行为，也不得让核心测试失败；seam 不够用时先停下来说明缺什么。本回合任务类型：不适用（纯文档）。

## G0

仓库没有 `SKILL_MAP`。本表不称用过技能。

| 项 | 状态 | 依据 |
| --- | --- | --- |
| live main `8beb515` | 已核 | `git fetch origin main` 后 `git rev-parse` 与 `git log -1`。parent、tree 与上段相同 |
| 五份规格、seam、E2、PR #223 计划、PR #224 计划、现有菜单代码与 CI | 已读 | 读的是仓库文件。没有改它们 |
| 09:59 之后的评论 | 已核 | 自 `2026-11-17T01:59:00Z` 列出的评论只有 6935563052、6936291998、6936361777、6936713814 |
| 产品、测试、Electron、加载探针、显示探针 | 未做 | 11:00 不批准 |
| 新依赖、CI、系统库、`apt`、Xvfb | 未做 | 同上。需要它们才能跑时，下面标阻塞，不改 |
| 技能地图、新规则、豁免 | 不适用 | 不新建 |

## 目的与用户可见的位置

A 只细化已合 [实施计划](feature-view-menu-gate-s2b-implementation-plan-174.md) 里的候选 A：四种形状的 Node 行为，以及真实 Electron 45.2.1 上的 B1、B2。不实施 B、C，不把 B3–B10 写进 A 的文件。

用户仍在系统原生菜单里选择栏位。这是支持性能力，不是新页面控件。原则是 [docs/design-principles.md](../design-principles.md) P4 与 §3：菜单用 Electron 原生 `Menu`。标签仍是 [DESIGN.md](../../DESIGN.md) §4.10 的 11.1：mac「显示」，其他平台「视图(&V)」。不改 DESIGN 正文。11.1 还列着侧栏、全屏、打开文件夹和置灰。当前 `library-menu.ts` 的视图子菜单只有现有 10 项。A 不补那些项，也不把不可用项改成置灰。

`none` 是内部状态，不是第四个栏位。生产启动在 A 里不改：`startLibrary` 仍调用现在的 `installFileMenu`。今天的模板没有 `type`，也没有 `checked`。这还不是「启动已经改成调用 mirror 的 none」。那一步是候选 C，本文件不实施。

## 原生行为，沿用已合 seam

行为只沿用已合 [seam](feature-reader-view-menu-seam-174.md) 的「[仍然成立](feature-reader-view-menu-seam-174.md#仍然成立)」「[验收](feature-reader-view-menu-seam-174.md#验收)」「[分批](feature-reader-view-menu-seam-174.md#分批)」。不重开 [E2 计划](feature-reader-view-modes-e2-174.md)，不重开 [S2b 计划](feature-view-menu-gate-s2b-174.md)。

`none` 的三个栏位是普通项，构造参数不写 `checked`。`original`、`contrast`、`translation` 把原文、对照、译文建成 radio，恰一项 `checked: true`。不在已经挂上的 radio 上改 `checked`。不自绘，不置灰，不改成 checkbox，不加「无」项。不改标签、accelerator、enabled、事件名。对照的事件名仍是 `oi-view-bilingual`。

B1、B2 读的是视图子菜单在原生将要显示的处理返回之后的真实 `MenuItem`。读构造参数不算菜单已经打开，也不算真机画面、物理键、mac 菜单栏或读屏。

## 代码路径与依赖

一个文件一种变化。函数建议 50、硬 80。普通文件建议 400、硬 600。测试建议 600、硬 800。参数硬上限 4。不写模块级 `let`。这些上限来自 [ARCHITECTURE.md](../../ARCHITECTURE.md) §6 与 [RULES.md](../../RULES.md) §1.3。依赖只沿 ARCHITECTURE §5：main 里的菜单描述可以互相引用，不进 core，不进 renderer。

| 文件 | 现在 | A 若获批，只做 |
| --- | --- | --- |
| `apps/desktop/src/main/view-menu-mirror.ts` | 无 | 把 `none`、`original`、`contrast`、`translation` 变成三个栏位描述。不调用 `Menu`。不导入 `electron`、gate、wiring |
| `apps/desktop/src/main/library-menu.ts` | 94 | 导出已有的 `oi-view-original`、`oi-view-bilingual`、`oi-view-translation`。数组改用它们。模板仍不写 `checked` |
| `apps/desktop/test/view-menu-mirror.test.ts` | 无 | 四种形状的 Node 断言。不导入 Electron |
| `apps/desktop/test/library-menu.test.ts` | 100 | 继续锁标签和加速键。断言静态模板不带 `checked`、栏位仍是三项、三个导出字符串不变 |
| `apps/desktop/test/view-menu-native.test.ts` | 无 | B1、B2 的父进程。负责编译、启动、清理、读 stdout |
| `apps/desktop/test/view-menu-native-electron.mjs` | 无 | 子进程。只调用已编译的同一个 mirror，再读真实子菜单 |
| `docs/evidence/<PR号>/commands.md` | 无 | 只记实际跑过的命令和退出码 |

`library-menu.ts` 现在的视图项在第 21–32 行。原文、对照、译文是第 25–27 行。`MenuItemSpec` 只有 `label`、`event`、`accelerator`。`viewMenu`、`knownEvent`、`menuScript`、`applicationMenuTemplate` 都短于 50 行。导出三个常量不会单独把某个函数推过 80。文件大约增加 3 行净长度，仍低于建议 400。这是文件长度核对，不是 PR 预算。

白名单只有上表，加上那一支自己的计划变更、台账追加和证据。禁止改 `library-wiring.ts`、`view-menu-gate.ts`、`view-menu-epoch.ts`、`index.ts`、`window.ts`、`composition-root.ts`、`packages/contracts/**`、三份生成物、renderer、UI、存储、CSP、协议、CI、依赖、环境安装文件、DESIGN、设计原则、规格正文、seam、E2、已合 S2b 两份计划。

零 diff 因此包括：`composition-root.ts`、`expose`（`packages/contracts/src/ipc/shell.ts` 现在仍是 `false`）、`apps/desktop/src/main/ipc/registry.generated.ts`、`apps/desktop/src/preload/oi.generated.ts`、`apps/desktop/src/renderer/oi-api.d.ts`。不含 handler、生产命令表、生命周期 floor、登录、S2c、E2 实施、B、C。

## 验收与失败停点

| 编号 | 载体 | 通过才算 |
| --- | --- | --- |
| 形状 | Node，不导入 Electron | `none` 的三项没有 `checked`。三种活动值是 radio，且恰一项 `checked: true`，分别勾原文、对照、译文 |
| 静态 | 现有 `library-menu.test.ts` | 标签、加速键、三个事件字符串、栏位项数不变。静态模板不带 `checked` |
| B1 | 真实 Electron 45.2.1 的 `MenuItem` | 视图子菜单上，原文、对照、译文是 `normal`，`checked` 为 false。没有第四个栏位 |
| B2 | 同上 | `original`、`contrast`、`translation` 各自恰一项 radio 为勾。另两项是未勾的 radio |

形状断言不能代替 B1、B2。静态模板不能代替原生菜单，也不能代替 C 的启动安装。B3–B10 不在本批。

将来实施时，下面任一发生就停。不改成 skip，不写第二份菜单字面量，不改 CI，不装系统库，不把构造参数的读数当成通过。

1. 编译同一个 `.ts` 失败。
2. Electron 二进制下不来，或进程起不来。
3. 运行时对象上没有可调用的 `_menuWillShow`。
4. stdout 的 `type`、`checked`、`label` 与上表不符。
5. 为了让进程起来，必须改 CI、装系统库或改显示设置。这是阻塞，待另决，不在 A 里做。

## 加载方案

这是静态候选，不是已经跑通的路径。本回合没有执行它。

### 为什么不直接加载 `.ts`

`apps/desktop/package.json` 的 `electron` 是 `45.2.1`。`pnpm-lock.yaml` 里该包的 `engines.node` 是 `>= 22.12.0`。这是安装这个 npm 包的宿主 Node 要求。本仓库的 Node 是 `.nvmrc` 的 22.23.4。它不证明 Electron 二进制内部的 Node 版本，也不证明那个 Node 会去掉类型再执行 `.ts`。

根 `tsconfig.json` 是 `noEmit: true`。Vitest 只变换 `*.test.ts`。子进程不经过 Vitest。根 `package.json` 没有 `tsx`。直接让 `.mjs` 去 `import` 一份 `.ts`，没有静态证据说 Electron 45.2.1 办得到。这条不选。不为此新增依赖。

`ELECTRON_RUN_AS_NODE` 没有写在本机这份 `electron@45.2.1` 的 `README.md` 或 `index.js` 里。公开说法常是它会变成普通 Node、不提供 `Menu`。本回合未核实那一页，也不用这个变量。B1、B2 要的是 `Menu` 和 `MenuItem`。

### 选定的候选

用仓库里已经锁定的 `typescript` 6.0.3，只编译两个源文件：`library-menu.ts` 和 `view-menu-mirror.ts`。编译选项与 `apps/desktop/tsconfig.main.json` 一致：`module` 与 `moduleResolution` 都是 `nodenext`，`target` 是 `ES2023`，`strict` 及同文件里的严格开关打开。`outDir` 放在临时目录，不写 `apps/desktop/dist`。`dist/` 已被 `.gitignore` 忽略，但 `start` 和 Windows e2e 使用 `dist/main/index.js`。A 的探针不往那里写，避免和那条启动混在一起。

不跑 `apps/desktop/package.json` 的整份 `build`。那份脚本会先编译 kernel、contracts、platform-node、library、settings、ingest，再 `tsc -p tsconfig.main.json`，然后打包 preload 和 renderer。`tsconfig.main.json` 的 `include` 是 `src/main/**/*.ts`。`library-wiring.ts` 导入 `@oi/feature-library/main`，其 `package.json` 的 `default` 指向 `./dist/adapters/library-main.js`。整份 main 编译会牵进这些产物。mirror 不需要它们。用整份 build 当探针的加载器，会把无关产物和失败面算进 A。不选。

父进程在临时目录写一份只含这两个文件的 tsconfig，调用已有的 `tsc`，退出码非 0 就停。子进程从命令参数拿到发出的 `.js` 路径，`import` 那一份。那是同一份源文件的编译结果，不是在 `.mjs` 里再写菜单字面量。临时目录在 `finally` 删除。不把发出的 `.js` 提交进仓库。

### 调用链

1. Vitest 的 Node 父进程不导入 `electron` 的 `Menu`。其他桌面测试文件各自 `vi.mock("electron")`，不会替这个文件提供真菜单。
2. 父进程按上一节编译。
3. 父进程用 Node 的 `child_process` 启动 Electron 二进制，参数是 `view-menu-native-electron.mjs` 和发出目录。不设置 `ELECTRON_RUN_AS_NODE`。
4. 子进程在应用 ready 之后，对四种形状各调用一次已编译的 mirror。其余七个视图项仍来自已编译的 `library-menu`，用来摆成现在的「视图(&V)」或「显示」子菜单。三个栏位的 `type` 与 `checked` 只来自 mirror。
5. 子进程 `Menu.buildFromTemplate`，找到这一层子菜单，调用它的 `_menuWillShow()`，然后把真实 `items` 的 `label`、`type`、`checked` 打到 stdout。父进程只断言这份 stdout。
6. 父进程等待退出码。非 0 即失败。然后删除临时目录。

`library-menu` 自己不调用 `Menu`。谁把描述交给 `Menu.buildFromTemplate`，只发生在子进程。这样 Node 形状测试仍可不导入 Electron。

### 类型声明里有什么，没有什么

本机已安装的 `electron@45.2.1` 包内有 `electron.d.ts`，没有 `dist/`，也没有 `path.txt`。类型是静态文件，二进制没有装上。

`MenuItemConstructorOptions` 有 `type` 和 `checked`。`checked` 的说明写着只应用于 checkbox 或 radio。`MenuItem` 有 `type` 和 `checked`。`Menu.buildFromTemplate`、`Menu.setApplicationMenu`、`Menu.items` 都在。`Menu` 上有公开事件 `menu-will-show`，说明文字是在调用 `popup()` 时发出。

同一份 `electron.d.ts` 没有 `_menuWillShow`。已合 seam 写的是 C++ `MenuWillShow` 会把全未勾的 radio 勾上第一项，普通项跳过。那个函数名不在本仓库。运行时对象上有没有 `_menuWillShow`，本回合未知。不把「类型里没有」写成「运行时一定没有」，也不写成「运行时一定有」。

`popup()` 会发出 `menu-will-show`，不能据此写成它走了同一段会改 radio 的 C++。实施时若 `_menuWillShow` 不存在，停在停点 3。不改用 `popup()` 充作已经通过，也不改读构造参数。

## 显示环境与现有 CI

| 事实 | 静态来源 | 能说明什么 |
| --- | --- | --- |
| `node` 作业在 `ubuntu-latest`。安装后跑 `pnpm test`。没有 `Xvfb`，没有 `DISPLAY`，没有 `apt-get` | `.github/workflows/ci.yml` 的 `node` 作业 | 将来若把 B1、B2 放进 `apps/desktop/test/**/*.test.ts`，这个必需检查会跑它。作业本身没有准备显示 |
| `desktop-e2e-windows` 在 `windows-latest`。Playwright 启动的是 `dist/main/index.js` | 同一工作流，以及 `apps/desktop/e2e/fixtures/electron-app.ts` | 它会启动完整应用。它不调用 mirror，也不调用 `_menuWillShow`。不能把它写成 B1、B2 已经有宿主 |
| 没有 Linux 或 macOS 的 Electron 作业 | `docs/ci-and-environment.md` 的门禁表 | mac 菜单栏没有 CI 宿主。Linux 也没有专门的 Electron 作业 |
| 本工作区环境变量 `DISPLAY` 是 `:1` | 本回合读取环境变量，没有启动程序 | 只说明这台机器有这个变量。不说明 CI，也不说明 Electron 窗口能画出来 |
| 本机 `electron@45.2.1` 没有 `dist/` 和 `path.txt` | 包目录列表。`install.js` 的 `isInstalled()` 读这两处，缺了就返回假 | `pnpm install --frozen-lockfile` 之后二进制仍可以不在。`package.json` 没有 `postinstall` |
| `index.js` 的 `getElectronPath()` 在二进制缺失时调用 `downloadElectron()`，再跑 `install.js` | 该文件 | 将来第一次向这个包要路径，可能下载锁定版本的二进制。那不是新 npm 依赖，也不是系统库。本回合不调用，所以没有证实下载成功 |
| `install.js` 使用 `@electron/get` 的 `downloadArtifact` | 该文件前 50 行 | 下载依赖网络和缓存。CI 能否下完，未知 |

现有 `node` 作业不能被写成已经能承载 B1、B2。缺的是三件未测的事：二进制是否能在该作业里出现、进程能否在没有 `DISPLAY` 和没有额外系统库时启动、`_menuWillShow` 是否存在。三件都不记 0，也不记通过。

若实施时进程起不来，而原因是要 `apt-get`、Xvfb 或改工作流，停。那是阻塞，待 Wisdom 另决。本计划不把测试挪到 `desktop-e2e-windows` 来绕过 `node` 作业，因为那会改测试落点和 CI 实际跑到的证明，本身就是范围变化。

原生 API 读到的 `type` 和 `checked` 只是对象字段。它不是菜单仍开着的画面，不是物理键，不是 mac，也不是读屏。

## 预算

口径是相对当时 `origin/main` 的新增+删除，含空行和注释，与 `tools/check-pr-size/check.mjs` 一致。生成物若出现 diff 就停。未知不写成 0。不写代码去证明行数。不写数学保证下限。

### 账 1，本 PR

只有本文件和 `docs/approvals.md`。相对 `8beb515a44fa30a3e2580c9b37e0a693d34e810d`：本文件新增 229、删除 0；台账新增 4、删除 2；新增+删除 235。低于 600 只说明这份 Draft 的文档没有越过门禁，不是 A 的实施额度。

### 账 2，未来独立的 A 实施

已合实施计划里的 211 是产品加测试的旧轮廓。227 是 211 加 16 行证据预留。227 不是额度，也不是本文件的全账。16 仍只是「命令一行、退出码一行」的预留，不是下限。完整可读的真实证据更短，不能因此叫凑数。

旧的子进程 40 行只覆盖「已经能加载同一个模块」的轮廓。本文件把编译、临时目录和清理算进父进程，把「方法不存在就非 0 退出」算进子进程。这两段不藏进 40，也不记 0。

| 文件 | 轮廓增 | 轮廓删 | 轮廓合计 | 区间 | 依据 |
| --- | --- | --- | --- | --- | --- |
| `view-menu-mirror.ts` | 62 | 0 | 62 | 不另放宽 | 已合实施计划的函数轮廓。本回合不重写成更短的最优值 |
| `library-menu.ts` | 6 | 3 | 9 | 9 | 三个导出是新增，三处数组改写是加 3 删 3。按第 25–27 行能数出来的形状，不是已格式化的 diff |
| `view-menu-mirror.test.ts` | 24 | 0 | 24 | 不另放宽 | 四种形状。不删断言 |
| `library-menu.test.ts` | 18 | 0 | 18 | 不另放宽 | 标签、加速键、事件名、项数、无 `checked` |
| `view-menu-native.test.ts` | 98 | 0 | 98 | 90–120 | 旧父进程 58，加上临时 tsconfig、调用已有 `tsc`、非 0 即停、`finally` 删除。40 是这段胶水的轮廓，不是下限 |
| `view-menu-native-electron.mjs` | 50 | 0 | 50 | 40–70 | 旧 40，加上方法缺失时非 0 退出。不复制模板 |
| 列明产品与测试 | 258 | 3 | 261 | 243–303 | 低位用 90 和 40，高位用 120 和 70。62+9+24+18 不变 |
| `docs/evidence/<PR号>/commands.md` | 16 | 0 | 16 | 预留 | 不是下限 |
| 列明项加预留 |  |  | 277 | 259–319 | 261+16=277。区间两端各加这 16 |

261 的加法：62+9+24+18=113，113+98+50=261。删除只有菜单那 3 行。243 = 261 − 8 − 10。303 = 261 + 22 + 20。

全账 = 261 + P + L + E + X。上表把 E 的预留 16 单独列出。P 是那支 PR 的计划变更，L 是新台账，X 是表外成本。三者现在没有实测，不填数，不记 0。

没有新的 npm 依赖。`typescript` 6.0.3 和 `electron` 45.2.1 都已经锁定。下载 Electron 二进制不是新依赖；它能不能下完，留在 X 的未知里，不记 0 行通过。不改 `package.json` 才能保持热点文件零 diff。若实施时发现必须改根 `package.json` 或锁文件，停下来报告。

P 的量级只作风险，不作数字：已合的 S2b 实施计划全文是 340 行。277+340=617，已经超过 600。那 340 不是未来 A 的 P，不能加进账里当实测。它只说明，若实施 PR 再带一份同样长度的计划，列明项还没加上 L 和 X 就会超过。RULES §2 在超过 300 行时要求执行计划。A 的列明项高位 303 已经碰到这条。计划正文计入 600。所以现在不能写全账 ≤ 600。

1.73 只披露风险，不引入新门禁，也不作为开工线。1.73×211 = 365.03，这是旧轮廓。1.73×261 = 451.53。1.73×277 = 479.21。三个乘积都低于 600。它们不证明全账放得下。1.73×(277+340) = 1067.41，只说明「列明项加一份 340 行计划」这个假设在系数下超过 600。

### 账 3，若把未来 A 放进本 PR

11:00 没有批准。277+235=512。这是列明项加证据预留，再加本 PR 的 235，不是未来 A 的全账。P、L、X 仍未计入。512 低于 600 也不批准。不自动拆分。

### 结论

本 PR 文档实测 235，低于 600。未来 A 不记 PASS。列明区间 259–319 没有超过 600，这不是全账通过。全账未闭合。现有 CI 没有被证实能承载 B1、B2。若必须改 CI 或系统才能跑，那是阻塞，待另决。不削断言，不改 600，不自动拆分，不把 227 写成额度。

## 交接

未获实施授权。本段必须整段粘贴。开工前完整阅读 `PRD.md`、`ARCHITECTURE.md`、`RULES.md`、`DESIGN.md`、`docs/design-principles.md`、本计划，已合 seam 的「仍然成立」「验收」「分批」「将来另批才许改的文件」，以及批准台账里 11:00 的原话。11:00 只批准本文件这种纯文档，不批准编码。

本任务受 UI 与业务核心解耦约束：ARCHITECTURE.md §2.1 与 RULES.md §8。改 UI 不得改变核心行为，也不得让核心测试失败；seam 不够用时先停下来说明缺什么。依赖只沿 ARCHITECTURE §5 允许的方向。不临时导入还不存在的模块，不预造兼容层。一个文件不堆多件职责。普通源文件建议 400、硬上限 600，函数建议 50、硬上限 80，测试文件建议 600、硬上限 800。优先系统原生菜单，不自造控件。从当时的 main 另开 `feature/` 分支和独立 worktree。PR 保持 Draft，直到 Forge 审查通过才可以离开 Draft。作者不自行标成 Ready。

目标是四种形状和真实 native B1、B2。完整验收是上表四行，一条不删。生产启动仍是今天的 `installFileMenu`。`expose` 保持 false。三份生成物、`composition-root.ts`、`index.ts`、`view-menu-epoch.ts`、`library-wiring.ts` 零 diff。不含 handler、renderer、UI、存储、CSP、协议、生命周期接线、B、C、S2c、E2 实施、登录。

文件白名单是「代码路径与依赖」那张表，加上那一支自己的计划、台账追加和 `docs/evidence/<PR号>/commands.md`。子进程必须加载同一个 mirror 的编译结果。编译失败、二进制或进程起不来、没有 `_menuWillShow`，都停。不 skip，不装系统库，不改 CI，不用第二份模板，不用构造参数冒充。新增+删除的全账超过 600 就停报。

## 命令

本回合 PATH 前置 `/home/ubuntu/.nvm/versions/node/v22.23.4/bin`。只跑 `node tools/check-docs/check.mjs`、Prettier `--check` 这两份文档，以及 `GATE_BASE=origin/main node tools/check-pr-size/check.mjs`。不跑 codegen、Vitest、`pnpm test`、`pnpm run check`，不启动 Electron，不手动重跑 CI。退出码写在「计划 / 实际」和 PR 说明。不新建 `docs/evidence/`。

下面这些命令不属于本 PR。将来的 A 实施要先有精确计划审查和另发的实施指令。全账现在不记 PASS。这些命令不跑：

```text
corepack pnpm exec tsc -p apps/desktop/tsconfig.main.json
corepack pnpm exec vitest run apps/desktop/test/view-menu-mirror.test.ts apps/desktop/test/view-menu-native.test.ts apps/desktop/test/library-menu.test.ts
```

## 计划 / 实际

| 步骤 | 计划 | 实际 | 证据 |
| --- | --- | --- | --- |
| 1 | 本文件。不写产品或测试 | 本笔只改本文件 | 首笔 |
| 2 | 台账只追加 10:36、10:41:20、11:00。页脚改为 222 条批准、27 条合入同步。反馈 1、决定 7 不动。旧行不改 | 次笔只改 `docs/approvals.md` | 次笔 |
| 3 | 用固定 head 的 contents API 读回这三行。不用 numstat 代替正文 | 读回结果写入次笔之后的说明。若正文缺失，先补台账再报告 | 远端文件 |
| 4 | 文档检查、格式、PR 体量。账 1 用最终 diff 回填。超过 600 就停 | 计划 229、台账 4/2，合计 235。命令退出码见 PR 说明 | 本回合命令 |
| 5 | Forge 精确审查。通过前不写 mirror，不开实施 PR | 未开始 | 审查 |

## 决策记录

| 决定 | 理由 | 日期 | 谁定的 |
| --- | --- | --- | --- |
| 11:00 只写 A 的形状、B1/B2、预算和加载/显示方案 | 原话见文首。不是编码批准 | 2026-11-17 | Wisdom 原话 |
| 10:36 只合入 PR #224 的文档 | 原话在台账。不含候选实施 | 2026-11-17 | Wisdom 原话 |
| 10:41:20 只同步合入结果 | `merged_at` 是 `2026-11-17T02:41:20Z`。不是新批准 | 2026-11-17 | Forge 同步，非新批准 |
| 加载候选是临时目录里编译同一份源文件 | 直接加载 `.ts` 没有静态证据。整份 desktop build 会牵进无关产物。不新增依赖 | 2026-11-17 | 按仓库文件核对，非新批准 |
| 现有 CI 不写成能跑 B1、B2 | `node` 作业没有显示设置。Windows e2e 跑的是完整应用。二进制本机未安装 | 2026-11-17 | 同上 |
| 227 不是额度 | 它是旧轮廓加 16 行预留。加载胶水不在那 40 行里 | 2026-11-17 | 按 11:00 重数，非新批准 |

## 自检

- [x] 影响 arch / prd 吗？不影响。
- [x] 计划这一笔只改本文件。台账是下一笔。
- [x] 不改已合 seam、E2、两份 S2b 计划、DESIGN、设计原则、CI。
- [x] 账 1 是 235。这是相对 main 的最终 diff，不是用逐笔 numstat 代替台账正文。

## 2026-11-21 补记

2026-11-21 20:31 Asia/Shanghai，Wisdom 原话只有「ok，请你按照项目进度安排继续推进吧」。来源是 Issue #174 评论 7062635369。Forge 把这句话收成：用已有临时验证补齐 A 批预算，并写明正式测试的运行环境。那是 Forge 的限定解释，不是用户的第二句，也不是产品或正式测试的实施批准。上文各节是 PR #225 当时的文本，本节省不回写。

临时结果记在 [Linux 临时原型索引](../evidence/a-linux-probe-94e6a9d.md)。它只证明 Linux、已有显示 `:1` 上那一次临时原型。正式 mirror、A 验收、CI、Windows、mac、物理键、读屏、截图都不算通过。

### 口径

作者报告写过「也没有改断言」。准确说法改为：首次实跑之后没有改断言，也没有重跑。准备阶段修订过检查器；部分准备调用没有完整结果。历史报告不改写。细节在证据索引。

### 字母

沿用上文，不改定义。261 是列明产品与测试的静态轮廓（新增 258，删除 3），不是未来 diff。P 是未来实施 PR 的计划变更。L 是该 PR 新台账。E 是证据；表里的 16 只是 E 的预留，不是下限，也不是实测。X 是表外成本。全账 = 261 + P + L + E + X。277、512 不是额度。340 行只说明「再抄一份同样长的计划会把 277 加到 617」。计划已经在 main，不再把新抄 340 行当成必须项。1.73×261=451.53，1.73×277=479.21，只是风险披露，不是开工线。

### 消掉的假设与仍在的未知

这次临时原型消掉的，只限那一台 Linux、那一次：

- 用与 `apps/desktop/tsconfig.main.json` 相同的选项，可以把基线 `library-menu.ts` 和临时 mirror 编译成 ESM，子进程加载同一份 `.js`。
- 锁定的 linux-x64 zip 与包内 `checksums.json` 一致。
- 真实 browser 进程能在那台已有显示的机器上启动，并且调用视图子菜单的 `_menuWillShow`。四种形状的字段与原型期望一致。没有第二份十项模板。

这些是可行性，不是行数。原型脚本的行数不代入 261。

| 项 | 现在能写的 | 依据与缺口 |
| --- | --- | --- |
| 261 | 仍是 258/3，区间 243–303 | 上文加法。没有为了量行去写产品或测试 |
| P | 未知，不记 0。不必再抄 340 行 | 未来实施 PR 若只在本文件上加一小段，P 会小于 340。那段还没发生，不能把某个估计数写成实测 |
| L | 未知，不记 0 | 实施批准还不存在 |
| E | 16 仍只是预留 | 临时报告比 16 行长，但它不是未来 `docs/evidence/<PR号>/commands.md` |
| X | 未知，不记 0 | CI 上能否启动、要不要显示和库，见下一节。不能用这次成功把 X 划成 0 |

列明高位 303 已经超过「300 行要有执行计划」。计划正文计入 600。P、L、超出 16 的 E、以及 X 都还没有数。因此现在不能证明全账 ≤ 600。不删测试，不改 600，不自动拆分。可以做的保守估计只有：若未来实施 PR 不夹带 CI 改动，列明高位 303 加预留 16 是 319，剩下的空间要装下当时的 P 与 L。P 与 L 未测，所以这条估计不闭合全账。

下一项最小决定：native 测试若放进 `apps/desktop/test/**/*.test.ts`，现有 `node` 作业会收集它。该作业没有显示。要不要另批显示与库，或另批改收集范围，这次不决定。在那之前 X 留在全账里。

### 正式环境

只静态看当前配置，不跑探针、xdpyinfo、Electron、下载、完整 build 或产品测试。

`vitest.config.ts` 的 `environment` 是 `node`，`include` 含 `apps/desktop/test/**/*.test.ts`。`.github/workflows/ci.yml` 的 `node` 作业在 `ubuntu-latest` 上跑 `corepack pnpm test`。该作业的步骤里没有 `Xvfb`，也没有 `DISPLAY`。`desktop-e2e-windows` 在 `windows-latest` 上跑 `vitest run apps/desktop/test`，再跑完整应用的 Playwright e2e，并上传截图。仓库没有 macOS Electron 作业。`pnpm-lock.yaml` 锁着 electron 45.2.1。仓库没有 `onlyBuiltDependencies` 或 `ignore-scripts` 的显式记录。CI 的 `pnpm install` 会不会执行 electron 的 `install.js`，这次不重跑，仍记未知。`PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD` 不代替 Electron。

| 验收 | 现有作业能覆盖的范围 | 不能互相代替 |
| --- | --- | --- |
| 四种形状与静态标签 | 文件落进上述 include 之后，`node` 作业的 `pnpm test` 会收集。文件现在不存在，所以还没有跑过 | 不能代替 B1、B2 |
| B1、B2 | 要真实 Electron，并且进程要能起来。`node` 作业没有显示设置。Windows 作业会收集 `apps/desktop/test`，但现有 e2e 不调用 mirror 或 `_menuWillShow` | 这次 Linux 不能代替 Windows 或 mac。Windows 作业不能代替无显示的 `node` 作业。物理键、读屏、截图各自独立 |
| mac | 工作流里没有这项 | 不能用这次 Linux 或 Windows e2e 代替 |

正式 mirror 与 native 若要进 CI，最小另批是下面两条之一，本文件都不实施：

- 给会跑到 native 测试的作业准备已有显示和所需库。成本未知，计入那一支的 X 或单独的 CI diff。
- 把 native 测试排除出无显示的 `node` 收集，并单独指定宿主。收集范围的改动也是另批。

当前 CI 绿不覆盖 B1、B2。失败仍停。不 skip，不用 fake，不复制十项模板。B3–B10、gate、wiring、epoch、floor 不改。生产启动仍是 `installFileMenu`。`expose` 仍是 false。三份生成物仍零 diff。

### 21:37 宿主推荐

2026-11-21 21:37 Asia/Shanghai，Wisdom 原话只有「按照你的建议执行吧」。来源是 Issue #174 评论 7063443765。承接的建议是先修正引用，再确定正式 native 的运行环境与收集安排；涉及 CI 或系统的改变仍另批。Forge 的限定解释不是用户的第二句。上一节「这次不决定」是 20:31 当时的文本，不回写。本段写下判断。判断不是实施批准，也没有跑过。

证据索引已按保留目录改正：四阶段是各自的 `.out`、`.err`、`.exit`，不是四个 `.log`。评论 7062635369 只承接复核摘要，没有报告附件。历史 `report.md` 不改。

2026-11-21 22:13 Asia/Shanghai，Wisdom 原话只有「按照你的建议执行就行。」来源是 Issue #174 评论 7063930331。承接的建议是只纠正宿主比较，公平列出各方案的条件、代价和证明范围，不新增实验。Forge 的限定解释不是用户的第二句。这句批准的是改正下面的判断。它没有选定某一宿主，也没有批准实施或改环境。`284e653` 把原样 Ubuntu 写成已经确定的第一宿主，并把事前分平台和事前显示配置写成不选。那段判断在这里改正。20:31 写过的「两条之一」仍留在上文，不回写。

静态事实，这次仍不跑测试、不安装、不下载、不启动 Electron：

- `node` 作业在 `ubuntu-latest` 上跑根 `pnpm test`。根 `package.json` 的 `test` 是 `vitest run`。`vitest.config.ts` 的 include 含 `apps/desktop/test/**/*.test.ts`，exclude 没有 native 例外。该作业没有配置 `Xvfb`，也没有配置 `DISPLAY`。
- 临时原型成功发生在已有 X.Org `:1` 的 Linux 机器上。那不是当前 Ubuntu CI 的条件。
- 新的父测试放进当前 glob，会同时被 Ubuntu 的 `node` 作业和 Windows 的 `desktop-e2e-windows` 收集。子进程是 `.mjs`，不匹配 `*.test.ts`，不会被收成另一条用例。父测试被收集，不等于子进程具备启动前提。
- 未实测无法启动，不等于已经证明启动失败，也不等于已经证明现有宿主足以承载 native。二进制是否随 `pnpm install` 出现、系统库够不够，仍未知。仓库没有 `onlyBuiltDependencies` 或 `ignore-scripts`。`PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD` 不代替 Electron。
- `desktop-e2e-windows` 的 e2e 先跑整份 desktop `build`，再启动 `dist/main/index.js`。它不加载 mirror，不算 B1、B2。`worker-health` 的 macOS 只跑 worker 与协议夹具。

下一步由用户决定职责和环境范围。下面三条都是提案，都还没选定。文件名仍是已列的 `apps/desktop/test/view-menu-native.test.ts` 与 `apps/desktop/test/view-menu-native-electron.mjs`。子进程必须加载同一个正式 mirror 的编译结果。四行验收不减。不 skip，不用 fake，不复制模板。

| 候选 | 条件 | 代价 | 证明范围 |
| --- | --- | --- | --- |
| 甲，原样 Ubuntu | 父测试留在当前 glob。不改 `ci.yml`，不改 `vitest.config.ts`。启动前提尚未建立。这是条件候选，宿主和显示问题还没有解决 | 这一笔不加 CI diff。X 仍不记 0。显示或库若以后要加，行数未知 | 只有该 `ubuntu-latest` 作业真把进程跑起来，才证明那次的 MenuItem 字段。现在没有这个证明。Windows 同时收集同一文件时，Windows 绿不能掩盖这个作业的失败 |
| 乙，事前另批分平台职责 | 用户事先批准 native 由哪个作业承担，以及无显示配置的 `node` 作业还收不收它。这是范围决定 | 收集范围若改，可能碰到 `vitest.config.ts` 和 `ci.yml`。行数未知，留在 X，不能从全账拿走 | 证明范围以当时批准的宿主为准。若不再让 `node` 作业承担 native，就失去该作业上的 Linux 字段证明。mac、物理键、读屏、截图仍缺。Windows 专门宿主只证明 Windows 进程上的字段 |
| 丙，事前规划带显示的宿主或显示/库配置 | 可以在失败发生前列出并请求另批。列出和估算不等于这些改动已经证实必要 | 候选估计：`ci.yml` 里的显示或库步骤，量级是个位数到数十行。这不是实测，也不保证原因一定是显示或库，更不保证实际改动只落在 `ci.yml` | 另批的宿主若把进程跑起来，证明的是那个宿主上的字段。未列入的平台仍缺 |

甲、乙、丙的共同缺口：mac 菜单栏、物理键、读屏、截图，以及 e2e 那条完整应用启动。一次有显示的 Linux 临时成功不能填上这些缺口。

要分开的两件事：保留 Linux 要求，再用 Windows 绿掩盖这个作业已经失败，这是错误。用户事前另批分平台职责和收集范围，是合法的待决选项。后者要写明失去的 Linux 证明和其他平台缺口。不能把乙本身定义成失败兜底或绕门禁。

要分开的另一件事：显示或库肯定必要，和可以事前规划并另批的条件方案，是两句。丙属于后一句。不必先制造一次正式测试失败，才能讨论或估算丙。

本文件仍把甲当作提案：少改配置，先看现有作业能否起来。这个倾向不是选定，也不把乙、丙排除。全账仍是 261 + P + L + E + X。P、L、X 不记 0。E 的 16 仍只是预留。不能把 CI 成本从全账拿走后声称已闭合，也不能证明全账 ≤ 600。

「若起不来，那时才另批」可以当作偏好的未来顺序，不是唯一合法路径。用户也可以在实施前就选定乙或丙。最小另批的文件范围只是当前候选估计：显示或库步骤可能在 `ci.yml`，改收集时可能碰到 `vitest.config.ts`，命令类别可能包括显示准备、系统库安装，以及是否执行 electron 的 `install.js`。这不预先保证原因，也不预先保证实际变更文件。证据仍是那一支的 `docs/evidence/<PR号>/commands.md`。本文件不写这些 diff。

### 本 PR 的文档账

与未来实施账分开。相对 base `94e6a9d847f6e5fc3c3ebbe2e089f535e31f5ed3` 的最终新增+删除：计划 111/0、证据索引 45/0、台账 11/1，合计 168。原型脚本行数不进这账，也不进 261。

### 仍要另批

- 在甲、乙、丙里选定职责和环境范围。22:13 没有选定。
- A 的产品与正式测试实施。
- 为 B1、B2 改 CI、安装库或改显示。丙是可事前规划的条件方案，还没有证实这些改动必要。
- Ready、合入、发版。
- B、C。

### 实施交接

上文「交接」是 PR #225 的原文。实施仍未授权。若以后另有精确批准，下面整段再贴给当时的 Cloud。

开工前完整阅读 `PRD.md`、`ARCHITECTURE.md`、`RULES.md`、`DESIGN.md`、`docs/design-principles.md`、本计划、[Linux 临时原型索引](../evidence/a-linux-probe-94e6a9d.md)、已合 seam 的「仍然成立」「验收」「分批」「将来另批才许改的文件」，以及台账里 11:00、11:32、11:38、20:31、21:37、22:13 的原话。20:31 只覆盖当时的纯文档补记。21:37 只覆盖引用修正和当时写下的宿主比较。22:13 只覆盖把那段比较改成条件候选，没有选定甲、乙或丙。11:38 只覆盖已经做完的那一次临时目录验证。这些原话都不批准编码，也不批准改 CI 或系统。用 Windows 绿掩盖已经要求的 Linux 失败，仍然不允许。事前另批分平台职责是待决的范围决定。未获实施授权不得开工。

本任务受 UI 与业务核心解耦约束：ARCHITECTURE.md §2.1 与 RULES.md §8。改 UI 不得改变核心行为，也不得让核心测试失败；seam 不够用时先停下来说明缺什么。依赖只沿 ARCHITECTURE §5 允许的方向。不临时导入还不存在的模块，不预造兼容层。一个文件不堆多件职责。普通源文件建议 400、硬上限 600，函数建议 50、硬上限 80，测试文件建议 600、硬上限 800。优先系统原生菜单，不自造控件。从当时的 main 另开 `feature/` 分支和独立 worktree。PR 保持 Draft。作者不自行标成 Ready。未获实施授权不得开工。

目标仍是四种形状和真实 native B1、B2。完整验收是上文四行，一条不删。子进程必须加载同一个正式 mirror 的编译结果。编译失败、二进制或进程起不来、没有 `_menuWillShow`，都停。全账超过 600 就停报。不把纯文档通过写成可实施通过。

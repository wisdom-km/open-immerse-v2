# 执行计划

分支 `feature/f08-parse-surface-test-174`。基线是远端 `main` `8c7c18e8ebea1b92f00a8f07f330ef8534ae603f`（tree `b22660212f1cfc57c8fb1c5ceecdd213dc985821`）。本文件按 [docs/exec-plans/TEMPLATE.md](TEMPLATE.md) 编写。它必须自包含。

停点：第一笔提交只有本文件。第二笔提交只有 [docs/approvals.md](../approvals.md) 的 12:04 F-08 行和文末计数。然后停。Forge 亲读这两笔确切提交并 PASS 之前，不改 `apps/desktop/test/parse-capability-surface.test.ts`。本文件不是那个 PASS。只开 Draft。不含 Ready、合入或发版。

代际表在 `feature/reading-generation-table-174`。合入顺序是代际表先合，本 PR 后合。本分支不含那条分支的文件。

本任务没有 UI。不改 [DESIGN.md](../../DESIGN.md)、[docs/design-principles.md](../design-principles.md) 或 `docs/design/**`（N-10）。

任务类型：本两笔是纯文档。实现笔只改测试断言和让 `Window["oi"]` 能被现有 UI 类型项目看见的路径名单。不是 UI 改动、seam 变更或 core 改动。

## 现状理解

- 已有行为：`apps/desktop/test/parse-capability-surface.test.ts` 是 22 行。它用 `readFileSync` 把 `oi.generated.ts`、`oi-api.d.ts`、`registry.generated.ts` 读成文本，再断言三条通道、无前缀的 `saveParseService` 与 `getParseServiceStatus`、`secretRef` 和 `"secret"` 不出现。三条契约在 `packages/contracts` 里仍是 `expose: false`：`parsing.getParseCapabilities`、`settings.saveParseService`、`settings.getParseServiceStatus`。正式 codegen 只把 `expose: true` 写进 `ipcRegistry`、`createOi` 和 `Window["oi"]`。本树这三份生成导出的公开命令是 `library.import`、`library.importDropped`、`library.list`、`library.relocate`。
- 相关的节：[docs/arch/05-02.md](../arch/05-02.md) F-08，[docs/arch/12.md](../arch/12.md)，[docs/arch/06.md](../arch/06.md)，[docs/arch/13.md](../arch/13.md) G2 与 G3，[docs/arch/02-05.md](../arch/02-05.md) 的 parsing 与 settings 行，[docs/prd/08.md](../prd/08.md)「M2 ③ 本批归属」，[RULES.md](../../RULES.md) §1.4、§2、§4、§9，[DESIGN.md](../../DESIGN.md) 与 [docs/design-principles.md](../design-principles.md) 只确认本批没有界面改动。同类写法在 [apps/desktop/test/reading-command-surface.test.ts](../../apps/desktop/test/reading-command-surface.test.ts)（68 行）：导入 `ipcRegistry` 与 `createOi`，走键路径，并用 `expectTypeOf` 看 `Window["oi"]`。
- 还没做的部分：把这份解析公开面测试从读源码文本改成导出和类型断言。不新增 handler 或 runtime。不改 `expose`。不改生成文件、contracts、library 阅读 handler、页码 command、RULES 或 CI 工作流。

## 来源核对

| 来源 | 位置 | 核对结果 |
| --- | --- | --- |
| Issue #174 评论 | [6731960395](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6731960395) | 对得上。Wisdom 2026-11-09 12:04 Asia/Shanghai 点选「按推荐：两句原句都批准，两个 Draft 并行，代际表先合」。F-08 原句全文见下方决策记录。GitHub `created_at` 是 `2026-11-09T04:05:18Z`。台账时间用评论正文里的 12:04。 |
| 同一评论的代际表原句 | 评论里的批准范围一 | 对得上，但不是本 PR 的实施范围。对方分支 tip `1defc1a00f400315c5bafdbcfcd355e5850bfaca` 已把那一句写入台账，并写明 F-08 由另一 Draft 抄录。该 tip 相对本基线只改了自己的执行计划和台账。 |
| [apps/desktop/test/parse-capability-surface.test.ts](../../apps/desktop/test/parse-capability-surface.test.ts) | 现有断言 | 对得上。仍是 `readFileSync` 加七次 `not.toContain`。 |
| [apps/desktop/test/reading-command-surface.test.ts](../../apps/desktop/test/reading-command-surface.test.ts) | 可参照的导出断言 | 对得上。导入 `ipcRegistry` 与 `createOi`。隐藏名单里已有这三条解析通道，也有四条阅读通道。本 PR 不改这个文件。 |
| `eslint.config.js` | `readFileSync` | 对得上配置文本。测试目录没有禁止 `readFileSync` 的规则。`node:fs` 的限制只在 markdown adapters 的写入 API。本两笔没有重跑 lint，退出码未核实。 |
| `tsconfig.json`、`tsconfig.ui.json` | `Window["oi"]` 所在项目 | 对得上。主项目 `lib` 只有 ES2023，并排除 renderer。`reading-command-surface.test.ts` 被主项目排除，改由带 DOM 的 `tsconfig.ui.json` 收录，同时列在 `eslint.config.js` 的 `allowDefaultProject`。本测试文件现在仍在主项目里。 |

## 计划 / 实际

计划列在开工前填。实际列在对应提交之后才填。本文件提交时，实际列保持空白。第二笔只改台账，不回填本表。Forge PASS 这两笔之前不填实现证据，也不改测试。

| 步骤 | 计划 | 实际 | 证据 |
| --- | --- | --- | --- |
| 1 | 本文件。第一笔只有它 |  |  |
| 2 | 只在 `docs/approvals.md` 追加 12:04 的 F-08 原话、原句全文和评论链接，并把文末批准计数从 117 改为 118。然后停 |  |  |
| 3 | Forge 亲读步骤 1 与步骤 2 的确切提交。PASS 之前没有步骤 4 |  |  |
| 4 | 只按「断言」改测试。规格正文不改 |  |  |

## 改哪一个文件

步骤 4 的断言只改 `apps/desktop/test/parse-capability-surface.test.ts`。

`Window["oi"]` 的类型来自 `apps/desktop/src/renderer/oi-api.d.ts` 的全局声明。主 `tsconfig.json` 排除了 renderer，也没有 DOM。测试若仍留在主项目里，`Window["oi"]` 看不到这份声明。步骤 4 因此还要把这个测试路径写成与 `reading-command-surface.test.ts` 相同的三处名单：

| 文件 | 改动 |
| --- | --- |
| `tsconfig.json` | `exclude` 加上这个测试 |
| `tsconfig.ui.json` | `include` 加上这个测试 |
| `eslint.config.js` | `allowDefaultProject` 加上这个测试 |

这三处只挪路径，不改编译选项，不新增规则，不放宽规则。`.github/workflows/` 不改。RULES 不改。若审查把这三处算作批准句里的「不改 CI」，停，不擅自改测试去绕开类型项目。

不改：contracts、`expose`、生成文件、codegen、`packages/features/library/**`、页码 command、`ipc-handlers.ts`、`composition-root.ts`、`slots.ts`、`library-main.ts`、`library-wiring.ts`、desktop UI、协议、settings 实现、密钥存储、`reading-command-surface.test.ts`、`oi-keys.test.ts`、RULES、CI 工作流、DESIGN、原则、`docs/spec-changelog.md`、`tools/compare-spec-bytes/manifest.json`。不新增 handler 或 runtime。不新增依赖。不新增测试文件，也不把键行走抽到 `utils`。

## 断言

测试继续用英文用例名，与这个文件现在的语言一致。用例名写成结果加条件。删除 `node:fs` 与 `node:path`。改为值导入 `ipcRegistry` 与 `createOi`，与阅读公开面测试相同。调用 `createOi` 时使用同一形状的空桥：`invoke` 与 `invokeDropped` 返回 `Promise.resolve(undefined)`，`subscribe` 返回空函数。不启动 Electron。

禁止名用精确相等，一共这十个：

| 名字 | 它代表什么 |
| --- | --- |
| `parsing.getParseCapabilities` | 能力查询通道 |
| `settings.saveParseService` | 写入通道 |
| `settings.getParseServiceStatus` | 状态通道 |
| `getParseCapabilities` | 能力查询若被挂到某个命名空间上时的方法名 |
| `saveParseService` | 现有文本断言里的无前缀名字 |
| `getParseServiceStatus` | 现有文本断言里的无前缀名字 |
| `parsing` | 解析命名空间 |
| `settings` | 设置命名空间 |
| `secret` | 现有 `"secret"` 文本断言要挡住的属性名 |
| `secretRef` | 现有文本断言要挡住的属性名 |

`secret` 用整个键或整个字符串相等。不用 `includes("secret")`。那样会回到对文本做子串搜索，也会把 `secretRef` 再数一次。

### registry

`ipcRegistry` 是值导出。收集两类名字：每条 `channel`；请求与响应 schema 上的对象键、`required` 里的字符串、`const` 字符串。十个禁止名在这两类里出现的次数都是 0。schema 按导出的 `IpcJsonSchema` 形状走，用类型守卫读取 `properties`、`required`、`const`、`items`、`anyOf`。不把 registry `JSON.stringify` 之后再搜索。

### createOi

对 `createOi` 的返回值做键路径。函数是叶子。对象则把键接成 `library.import` 这种路径。每条路径、以及路径上的每一段，都不等于十个禁止名。桥对象上的 `invoke` 不是公开面，不放进这条路径。

### Window["oi"]

类型断言看两份类型：`Window["oi"]`，以及 `ReturnType<typeof createOi>`。收集对象键、函数参数里的对象键、以及 `Awaited` 之后的结果键。深度限于这些公开方法自己的参数和返回值，不把 `Promise` 的 `then` 再展开。收集到的键与十个禁止名的交集是 `never`。`expectTypeOf` 已在阅读公开面测试里使用。

不把公开键锁成恰好 `import`、`importDropped`、`list`、`relocate`。那条正例属于 `reading-command-surface.test.ts` 和 `oi-keys.test.ts`。本文件只证明这三条解析契约、两个无前缀方法名、`secret` 和 `secretRef` 不在公开面上。这是本计划的写法，Forge 审查可改。不是业主决定。

函数体里的字符串不当作公开面。公开面是 `ipcRegistry` 的通道和 schema 键、`createOi` 的键路径，以及 `Window["oi"]` 与 `createOi` 返回值的类型键。测试不读生成文件，也不读 `src` 文本。

## 行数预算

物理行数，含空行与注释。口径见 [docs/arch/06.md](../arch/06.md)。

| 对象 | 现在 | 步骤 4 的预算 |
| --- | --- | --- |
| `parse-capability-surface.test.ts` | 22 行 | 建议不超过 200 行。规格建议上限 600，硬上限 800。超过 200 行时，实现 PR 写明为什么不拆。不拆到第二个文件 |
| 每个函数 | 现有回调很短 | 建议不超过 50 行，硬上限 80。schema 行走若会超过 80，拆成同文件里的具名函数 |
| 新增文件 | 无 | 无 |
| `tsconfig.json`、`tsconfig.ui.json`、`eslint.config.js` | 该测试不在 UI 名单 | 每份只加或只排除这一条路径 |
| G12 | 不适用 | 非生成 diff 按上面的预算，低于 600 行。不预写 `G12:` |

`composition-root.ts` 与 `slots.ts` 的 diff 是 0。

## 验收与未验证

没有新的产品验收编号。对得上的是 F-08 和 [docs/arch/12.md](../arch/12.md) 的「测试只断言行为」。AC-11 仍未验收。本批不把它标成通过。

| 账本 | 本两笔 | 步骤 4 | 不跑 |
| --- | --- | --- | --- |
| CI | Draft 打开后由工作流跑。结果等跑完再记。不预写通过。文档门禁若失败，只修计划或台账里的问题 | 那个新 tip 上，CI 的 node 与文档门禁会跑到这个测试。证据写进 `docs/evidence/<PR号>/commands.md`。不把 CI 全绿写成 G1–G18 都已有 | 本两笔不把尚未发生的检查写成通过 |
| Cloud 本机 | 不跑 Vitest。这两笔没有改测试 | Forge PASS 之后的实现 tip，跑 `corepack pnpm exec vitest run apps/desktop/test/parse-capability-surface.test.ts`，并跑覆盖这个文件的 typecheck 与 lint。同一个 tip 的全量只跑一次。CI 已经在该 tip 跑过全量时，Cloud 不再跑第二遍，只重跑失败项 | 没有 Electron 二进制就不得称为 Electron 实跑。不把 #183 的 lint 通过写成这一笔 |
| Box | 不跑 | 不跑 | 公开面是 registry 数组、`createOi` 的函数键和 `Window["oi"]` 的类型，Vitest 能看。本批不改运行时、不改 `expose`、不开窗口、不接生产 IPC。没跑就写「未跑」，不写 PASS |
| Windows 真机 | 不跑 | 不跑 | 没有界面改动，没有 PDF 打开路径。AC-11、3A、PRC-01–26、UIX-57 与 8 GB 录屏保持未验收。缺机标未验证。不用更高内存的机器代替 |

## 未核实

- 本两笔没有重跑 lint。配置文本里没有测试目录的 `readFileSync` 禁令。F-08 的「怎么拦」仍写着 ESLint。本批不补那条规则，也不改 CI。退出码未核实。
- 主项目收下 `Window["oi"]` 会失败，这是对照 `tsconfig.json` 与 `tsconfig.ui.json` 得出的。没有跑 `tsc`，失败信息原文未核实。
- `createOi` 函数体里若留下没有挂到键上的通道字符串，导出和类型断言看不见。写计划时读过本树三份生成文件，这三条通道、`secretRef` 和 `"secret"` 不在导出的通道、函数键和 `Window["oi"]` 字段上。没有重跑 codegen。
- 代际表实现笔还没有。他们的计划 tip 不改公开面。PASS 之后的实现是否仍不写入 registry 与 preload，要等那个 tip 再看。本测试用「不出现」，不锁四条正例。
- 代际表先合时，`docs/approvals.md` 会和本分支的第二笔冲突。对方 tip 已把计数写成 118，并留给本 Draft 抄 F-08。rebase 时保留两行，计数改为 119。本两笔不提前写成 119，因为本分支还没有他们那一行。
- Box 与真机环境是否就绪，未核实。本批本来不跑。

## 决策记录（Decision Log）

| 决定 | 理由 | 日期（Asia/Shanghai） | 谁定的 |
| --- | --- | --- | --- |
| 「按推荐：两句原句都批准，两个 Draft 并行，代际表先合」 | 点选原话。两个 Draft 并行。合入顺序是代际表先合。台账行在第二笔。链接：[6731960395](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6731960395) | 2026-11-09 12:04 | Wisdom |
| 「批准单独 Draft 整改 apps/desktop/test/parse-capability-surface.test.ts 的源码文本断言。改为 registry、createOi 与 Window["oi"] 的导出和类型断言，保留三条解析契约不出现在公开面上。不读生成文件或 src 文本。不新增 handler 或 runtime，不改 expose、RULES 或 CI。不与阅读 handler 同一 PR。第一笔只有执行计划，第二笔只抄录批准台账，Forge 亲读这两笔 PASS 之后才改测试。只开 Draft，不授权 Ready、合入或发版。」 | 本 PR 只实施这一句。同一评论里的代际表原句不在本分支实施。这句不是执行计划 PASS | 2026-11-09 12:04 | Wisdom |
| 本文件只断言十条禁止名不出现，不把公开键锁成恰好四条 library 命令 | 正例已在阅读公开面测试。Forge 审查可改。不是业主决定 | 2026-11-09 | 本计划的写法 |

## 证据链接

- `docs/evidence/<PR号>/`：本两笔无。步骤 4 再写。

## 自检

- [ ] 影响 arch / prd 吗？不影响。本两笔和步骤 4 都不改规格正文。F-08 的拦法句子保持原样。

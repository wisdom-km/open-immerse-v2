# 执行计划

收 [Issue #61](https://github.com/wisdom-km/open-immerse-v2/issues/61) 的条目 2、3、5。条目 1、6 已在 #109 合入。条目 4、7 这次不做。基线 `origin/main@762cbbd88d5775fddfdce6afa3a003fdbfd901a4`。路径按 [TEMPLATE.md](TEMPLATE.md) 用分支名 `feature/m1-contracts-codegen-p3`。第一笔提交只有本文件。Forge 审查通过之前不写实现。PR 保持 Draft，正文用 `Refs #61`，不关 issue。不 force push，不合入。

本计划同时落到 TS（`tools/check-deps`、`tools/codegen`）与 worker 的健康交换核对，所以用这份计划。不改功能切片。条目 5 在 #96 已经落成判别联合，本计划不改 `health.py`，只用现有测试证明 JSON。

## 现状理解

- 已有行为：`tools/check-deps/contracts-kernel.test.ts` 在临时目录巡航，临时 `tsconfig.paths.json` 的 `baseUrl` 已是 `"."`（#96）。仓库自己的 `tools/check-deps/tsconfig.paths.json` 仍是 `baseUrl: "../.."`，`dependency-cruiser.config.mjs` 仍指向它。现有断言只要求违规文本不含仓库 kernel 的绝对路径，打印出来的边仍是相对的 `packages/kernel/src/index.ts`。这条相对路径在临时树和仓库里长得一样，证不到读的是哪一份。`tools/codegen/schema-module.mjs` 用源文件绝对路径的 sha256 前 16 位命名临时产物（#96），不再用 basename；正则 `/(?:from\s+|import\s+)["']([^"']+)["']/g` 仍改写说明符，动态 `import(` 会抛出。`workers/parser/oi_worker/api/health.py` 的 `HealthExchange` 已是 `HealthReady | HealthOutOfRange`：`status` 分别为 `Literal[200]` 与 `Literal[426]`，正文分别为 `HealthOkBody` 与 `UnsupportedBody`。`health_route.py` 仍是 `JSONResponse(status_code=exchange.status, content=exchange.body)`。
- 相关的节：ARCHITECTURE §2.4、§4.1、§5.1、§6、§10.2–§10.4、§13 G5 / G7 / G11 / G12。RULES §1.1、§1.2、§1.4、§2、§3、§4、§9、N-08、N-09、N-10、N-11、N-15。PRD AC-66 ② 的作业数仍属后续里程碑。DESIGN 与 `docs/design-principles.md` 没有对应条目。
- 还没做的部分：没有一条独立测试证明 `@oi/kernel` 不会落到仓库路径。codegen 仍用哈希命名，也没有「输出路径已被另一个源占用就失败、不覆盖」的行为。条目 4 的 `read*` 归属、条目 7 的 jobs 夹具，这次不补。

## 要改的文件与热点声明

切片：无。`packages/features/**` 不改。G18 不涉及功能切片。

| 文件 | 做什么 | 热点 |
| --- | --- | --- |
| `tools/check-deps/contracts-kernel.test.ts` | 条目 2。保留临时 `baseUrl: "."`。另加一条测试：`@oi/kernel` 指到只存在于临时目录的 `closed-marker.ts` | 否 |
| `tools/codegen/schema-output-name.mjs` | 条目 3。按相对路径命名；输出路径已被另一个源占用时抛出，不写文件 | 否 |
| `tools/codegen/schema-output-name.test.ts` | 条目 3。同一输出路径、两个源，抛出且不覆盖 | 否 |
| `tools/codegen/schema-specifiers.mjs` | 条目 3。用已依赖的 TypeScript 语法树列出静态说明符并改写；动态 `import(` 抛出 | 否 |
| `tools/codegen/schema-module.mjs` | 条目 3。去掉哈希命名和正则。装载、转译、写入仍留在这里 | 否 |
| `tools/codegen/schema-module.test.ts` | 条目 3。同 basename 的两份都加载；`export *` 能加载 | 否 |

热点文件：不改 `ids.ts`、`composition-root.ts`、`slots.ts`、`dependency-cruiser.config.mjs`、`tools/check-deps/tsconfig.paths.json`、`tools/check-deps/check.mjs`、`apps/desktop/**`、`.github/workflows/**`、lockfile、`workers/parser/oi_worker/api/health.py`、`workers/parser/oi_worker/api/health_route.py`、`workers/parser/oi_worker/protocol/**`。

依赖：不新增。`typescript` 已是 `schema-module.mjs` 的依赖。不改 `pnpm-lock.yaml`。

## 计划 / 实际

计划列在开工前填。实际列与证据在 Forge 通过、实现完成之后填。

| 步骤 | 计划 | 实际 | 证据 |
| --- | --- | --- | --- |
| 1 | 本文件。Forge 通过后才写实现 | 提交 `c7510c5`。Forge 通过后才写实现。新测试若失败则停，不自写解析器；测试通过，未写解析器 | 本文件 |
| 2 | 条目 2：只加测试。临时 paths 指向 `packages/kernel/src/closed-marker.ts`。违规输出含这个文件名，不含仓库 `packages/kernel` 的绝对路径，也不含仓库 paths 的目标 `packages/kernel/src/index.ts`。仓库的 paths 与 cruiser 配置不动 | `ddebc8f`。仓库 paths 与 cruiser 配置未改。新用例通过 | [docs/evidence/115/commands.md](../evidence/115/commands.md) |
| 3 | 条目 3：相对路径命名，撞名抛出并不写。说明符改用 TypeScript 语法树。`export *` 仍可加载。动态 `import(` 抛出。不引入打包器 | `fa06a55`。三个文件各管一件事。同 basename、`export *`、动态 import、撞名测试通过 | 同上 |
| 4 | 条目 5：不改 Python。现有 health 测试仍断言 200 的三字段与 426 的 `{"supported": ["1.0"]}` | 不改 Python。pytest 27 passed | 同上 |
| 5 | 跑 codegen。`workers/parser/oi_worker/protocol/` 无 diff。G7 通过 | `fa06a55` 上 `pnpm run check` 退出码 0。codegen 之后协议目录无 diff | 同上 |
| 6 | 条目 1、4、6、7 不改代码。4 与 7 的不做理由和规格建议写在 PR 正文，不改 ARCHITECTURE、backlog、spec-changelog | 不改代码。规格建议留在 PR 正文 | [PR #115](https://github.com/wisdom-km/open-immerse-v2/pull/115) |

函数不超过 80 行，圈复杂度不超过 15，参数不超过 4 个。禁止顶层 `let`（F-06）。不建 `utils.ts`。不改门禁上限（N-08）。门禁不跳过。预计对 `main` 的非生成 diff 低于 600 行。若实现时超过 600，提交说明或 `PR_BODY` 加一行 `G12:`，不调上限。

## 条目 2：临时巡航只读临时目录

仓库 `tools/check-deps/tsconfig.paths.json` 的 `baseUrl: "../.."` 对仓库根是对的，不改。`dependency-cruiser.config.mjs` 继续指向它，给真实仓库巡航用。

#96 的临时夹具已经自带 `baseUrl: "."`，并从 `tools/check-deps/build-rules.mjs` 引入 `forbiddenRules()`。规则函数留在仓库里：临时目录测的是同一套 G5 规则，不把规则抄进夹具。封闭的是被巡航的 `packages/**`，不是规则源码。

新测试与现有那条分开，名字按本文件的英文用例风格写。临时 `paths` 把 `@oi/kernel` 指到 `packages/kernel/src/closed-marker.ts`。这个文件名在仓库的 kernel 里不存在；仓库 paths 的目标仍是 `packages/kernel/src/index.ts`。临时文件类型导出 `Result`，再写一条值导入。巡航仍走 `tools/check-deps/check.mjs` 和这份临时配置。

要观察的结果：退出码非 0；输出含 `contracts-kernel-type-only` 与 `closed-marker.ts`；不含 `path.resolve("packages/kernel")` 下的仓库绝对路径；不含 `packages/kernel/src/index.ts`。含 `closed-marker.ts` 同时不含 `index.ts`，才能说明边落到了临时文件，而不是仓库 kernel 印成了同一条相对路径。

若这条失败，说明临时解析仍离开临时目录。那时只改临时夹具，不改仓库配置。收紧方式用 dependency-cruiser 已经传给 enhanced-resolve 的 `enhancedResolveOptions`，限制解析结果留在临时根内。该选项以安装的 enhanced-resolve 文档为准。文档里没有能限制解析根的选项时停下来报告，不自写解析器。

## 条目 3：相对路径命名，语法树改写说明符

二选一里选更稳的实现，不选「遇到 `export *` 或动态 `import(` 就一起报错」。

理由：正则是自造的迷你语法。`typescript` 已经在这个文件里使用，`ts.createSourceFile` 能列出静态 `ImportDeclaration` 和 `ExportDeclaration`（含 `export * from`）的模块说明符。这是编译器已有的行为，不加依赖，也不引入 esbuild、rollup 或 swc。Issue 说的是正则脆弱，不是禁止 `export *`。真实入口 `packages/contracts/src/worker/schemas.ts` 只用静态 `import`。#96 已把静态 `export * from` 测成可加载。两条一起拒绝会新造一条仓库里没有的语法禁令。动态 `import(` 的说明符要执行才知道，语法树能发现它，但没有加载前可改写的系统行为，所以仍抛出 `dynamic import: <源路径>`，不改写、不继续加载。`require()` 不另写一条规则：不再用正则去改它，Node 加载失败就是它自己的结果。

命名不用哈希，也不只用 basename。先用语法树收静态图，公共根是入口和所有已解析源文件的最长公共目录。输出路径是 `<临时目录>/<相对路径去掉原扩展名>.codegen.mjs`，目录保留。相对路径含 `..`、为空、或为绝对路径时抛出 `schema output outside root`，不把文件写到临时目录外面。

同一输出路径已经登记了另一个源时，抛出 `schema output collision: <相对路径>`，不调用写入。同一源再次进入返回已有输出。写入用 `fs.writeFile` 的 `flag: "wx"`：文件已存在时由系统返回 `EEXIST`，再抛出同一条 collision 错误，不覆盖。`loadProtocolSchemas` 把错误抛出。`tools/codegen/run.mjs` 没有 catch，未处理的拒绝使进程退出码非 0。

Python 模型名仍来自 schema 的 `name` 字段。schema 字节不变，所以 `workers/parser/oi_worker/protocol/` 不应出现 diff。若出现，停下来报告，不手改生成文件（N-09）。

`schema-output-name.mjs` 只做命名和占用登记。`schema-specifiers.mjs` 只做说明符的列出和改写。`schema-module.mjs` 只做装载、转译和 `protocolSchemas` 的形状检查。不把这三件事堆回一个文件。

## 条目 5：判别联合已经在树上

`origin/main@762cbbd` 的 `health.py` 不再是 `body: dict[str, str] | dict[str, list[str]]`。`HealthReady.body` 是 `HealthOkBody`（`protocol`、`workerVersion`、`mode`），`HealthOutOfRange.body` 是 `UnsupportedBody`（`supported`）。两个变体的 `status` 是不同的 `Literal`。这就是判别联合。对外 JSON 由现有测试固定：200 为这三个字符串字段，426 为 `{"supported": ["1.0"]}`。

不改 `health.py`、`health_route.py`，也不改生成的 `protocol/health.py`。不把 TypedDict 再换成 pydantic。现有测试失败就停，不改断言。

## 条目 4、7：不做

条目 4。ARCHITECTURE §4.1 把 oi-parse/1 报文放在 `contracts/src/worker/*.ts`。`read*` 是 `Value.Check` 之后投影已知字段。不新建 `packages/worker-client`，不把它们搬进 kernel。

条目 7。AC-66 ② 的「作业数为 0」随 jobs API 再补夹具。`fixtures/protocol/versions/` 里现有的 426 交换样例不动。

条目 1、6 已在 #109，本分支不改 `ids.ts` 与 `workerVersion` 的 schema。

## 测试清单

| 项 | 要观察的结果 |
| --- | --- |
| 2 | 现有用例仍通过。新用例的违规输出含 `closed-marker.ts` 与 `contracts-kernel-type-only`，不含仓库 `packages/kernel` 的绝对路径，不含 `packages/kernel/src/index.ts` |
| 3 | `left/item.ts` 与 `right/item.ts` 都能加载，入口 schema 的 `title` 来自 `right`。`claimOutput` 对两个源、同一输出路径抛出 `schema output collision:`，目标文件不存在。`export * from` 的入口能加载 `protocolSchemas`。动态 `import(` 使 `loadProtocolSchemas` 拒绝 |
| 5 | `tests/api/test_health.py`、`tests/protocol/test_health.py`、`tests/protocol/test_versions.py` 仍通过。200 的正文键是 `protocol`、`workerVersion`、`mode`。426 的正文是 `{"supported": ["1.0"]}` |
| 7 | `git diff --stat workers/parser/oi_worker/protocol/` 为空 |

定向命令，实现提交之后跑。不跑 `pnpm test`，不跑 worker 全量 pytest。PATH 先放 `/home/ubuntu/.nvm/versions/node/v22.23.4/bin`。

- `corepack pnpm exec vitest run tools/check-deps/contracts-kernel.test.ts tools/codegen/schema-module.test.ts tools/codegen/schema-output-name.test.ts tools/codegen/versions.test.ts`
- 工作目录 `workers/parser/`：`uv run pytest tests/api/test_health.py tests/protocol/test_health.py tests/protocol/test_versions.py`
- `GATE_BASE=origin/main corepack pnpm run check`

`pnpm run check` 里的 codegen 与 `git diff --exit-code` 就是 G7。协议目录有 diff 则这一步失败，不把它改成通过。`test:core` 无脚本，写不适用。

证据写入 `docs/evidence/115/commands.md`：每条命令、退出码、结果摘要。没跑的命令不写成通过。

## 不做

- 不改 `packages/contracts/src/ids.ts`，不改 `workerVersion` 的 schema。
- 不把 `read*` 搬出 contracts，不新建包。
- 不补条目 7 的 jobs 夹具。
- 不改 `health.py` 与 `health_route.py`。
- 不改 ARCHITECTURE、PRD、DESIGN、`docs/design-principles.md`、`docs/design/**`、`docs/backlog.md`、`docs/ci-and-environment.md`、`docs/spec-changelog.md`、`tools/check-docs/**`、`.github/workflows/**`。
- 不改 `.cursor/environment.json`、`.cursor/install.sh`、lockfile、CI 行为与分支保护。
- 不手改 `workers/parser/oi_worker/protocol/`（N-09）。

## 规格建议

本 PR 不改规格文件。若 Forge 要记一笔，建议文字如下，由 Forge 安排落点：

- 条目 4：`packages/contracts/src/worker/*.ts` 的 `read*` 是 oi-parse/1 报文的运行时校验，与 schema 放在一起，不迁到 worker-client 或 kernel。
- 条目 7：主版本不符时作业数为 0 的夹具随 jobs API 落地再补。#61 仍开着。

## 证据链接

- `docs/evidence/115/commands.md`：实现提交 `fa06a55` 上的定向测试与 `GATE_BASE=origin/main pnpm run check`。

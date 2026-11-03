# 执行计划

超过 300 行的实现会跨多份工具配置，所以有这份计划。路径按 [TEMPLATE.md](TEMPLATE.md) 用分支名。第一笔提交只有本文件。Forge 审查通过之前不写三道门禁的实现。PR 保持 Draft，不离开 Draft，不合入。

本计划不改 `.github/workflows/*`（N-02）。不改 `ARCHITECTURE.md`、`docs/ci-and-environment.md`、`docs/spec-changelog.md`：这三份在未合入的 PR #108 里。#108 合入之后再把 `main` merge 进来，不 force push（N-01）。不改 `DESIGN.md`、`docs/design-principles.md`、`docs/design/**`（N-10）。

## 现状理解

- 已有行为：`pnpm check`（`package.json` 的 `check` 脚本）依次跑 ESLint、`tools/typecheck.mjs`（`tsc --noEmit --project tsconfig.json`）、`typecheck:core`、行数、dependency-cruiser、core 测试环境、许可证、一个切片、Conventional Commits、热点、PR 体量、`pnpm codegen && git diff --exit-code`。没有 Prettier。9 份 `tsconfig*.json` 都没有 `composite` 或 `references`。dependency-cruiser 的规则在 `tools/check-deps/build-rules.mjs`，没有 `ui-events-declared`。`contracts/src/ui-events.ts` 不存在。仓库里没有发布或订阅 UI 事件的调用。Python 的格式检查是 ruff format，在 `python-worker` job 里，不在 `pnpm check` 里。
- 相关的节：PRD §8 M1 延后三项，仍是 M1 交付（Issue #34），不挡住业务切片。ARCHITECTURE §5.3、§13 G1 / G3 / G5、§15.3。RULES §1.3、N-02、N-22、§9。docs/backlog.md 的 M1-DEFER-G1、M1-DEFER-G3、M1-DEFER-G5 与 E-P2-9。docs/ci-and-environment.md「还没接上」表。PRD AC-80、AC-82。
- 还没做的部分：三道门禁都还没接到 `pnpm check` 的失败路径上。本 PR 只交计划，不接。

测量基线是 `origin/main` `e6f29d28f15f476ad0458cc3a3c11ddb4c0991c9`（#109）。#108 当时仍是 OPEN。Prettier 用 3.6.2、`--no-config`（默认 `printWidth` 80）。忽略 `node_modules`、`dist`、`coverage`、`.venv` 和两份锁文件。没有把格式写回工作区。

## 三道门禁

### G1 Prettier

规格要求：ARCHITECTURE §13 G1 的工具是 Prettier 与 ruff format，内容是格式一致。Python 侧的 ruff format 已经在 CI。延后的是 JS/TS 的 Prettier（PRD §8 M1；backlog M1-DEFER-G1，仍按 E-P2-9）。Issue #34 的触发是按 E-P2 的节奏接上，并要有拒绝样例与 remediation。`tools/gate-remediation/catalog.json` 的 G1 条文写明：ruff 失败时不要为了那条去接 Prettier。

`pnpm check` 接线：现在不在 `check` 脚本里。接上的办法是在 `package.json` 加一条只跑 Prettier `--check` 的脚本，再放进 `check` 的链。CI 的 `node` job 已经跑 `pnpm check`，所以不改 `.github/workflows/ci.yml`。单独对 `.github/workflows/ci.yml` 跑了一次 Prettier `--check`，退出码 0，这份工作流已经符合默认格式。实现时仍把 `.github/**` 放进忽略，避免以后格式漂移去改工作流。

现有文件：代码 glob `**/*.{ts,tsx,mjs,js,cjs,css}` 有 89 个文件不符合，diff 是 +1402 / −381，合计 1783 行。抽样是把超过 80 列的 import 和三元表达式折行，不是改引号。JSON / YAML 另有 12 个文件、合计 28 行（其中 11 个是 `fixtures/protocol/provider-errors/*.json`，1 个是 `tools/gate-remediation/catalog.json`）；这次测量在 #109 之前的 `25762f1`，#109 没有改 json 或 yaml。Markdown 在 `25762f1` 上有 67 个文件、合计 7566 行，其中包括 `DESIGN.md`、`docs/design-principles.md`、`docs/design/md-reader.md`（N-10），以及 `ARCHITECTURE.md`（1408 行）、`docs/ci-and-environment.md`、`docs/spec-changelog.md`（#108 正在改）。`e6f29d2` 上 `docs/evidence/109/commands.md` 也不符合，所以当前基线的 Markdown 至少 68 个文件。

拆分：G1 单独一个 PR。1783 行超过 G12 的 600 行，那个 PR 的提交说明要有一行 `G12:`。格式化只覆盖 `*.ts`、`*.tsx`、`*.mjs`、`*.js`、`*.cjs`。不格式化 Markdown（会改 N-10 的文件和 #108 的三份规格），不格式化 `.github/**`，不把 12 个 JSON 卷进来。半格式化的树会让后面的 diff 不可读，所以这 89 个文件留在同一个格式 PR 里，不按目录再拆。

### G3 `tsc -b`

规格要求：ARCHITECTURE §13 G3 的工具是 `tsc -b`（strict），0 错误。Python 侧已经是 pyright strict，不在这道门里。Wisdom 2026-10-31 14:12：第一个包使用 project references 之前保持 `tsc --noEmit`（PRD §8；backlog M1-DEFER-G3）。`composite` 会写出声明文件。Issue #34 的触发是「首个 project references 包出现时」。

`pnpm check` 接线：`check` 调用 `pnpm run typecheck`，即 `node tools/typecheck.mjs`，里面是 `tsc --noEmit --pretty false --project tsconfig.json`。`typecheck:core` 是 G14，不是这道门。`tools/gate-remediation/g3.test.ts` 断言 `package.json` 与 `.github/workflows/ci.yml` 都不含字符串 `tsc -b`，并断言现行 `typecheck.mjs` 退出码为 0。因此接上 `tsc -b` 不能把这个字符串写进工作流；工作流也不必改，因为 `node` job 已经跑 `pnpm check`。

现有文件：9 份 `tsconfig*.json`（根 `tsconfig.json`、`tsconfig.core.json`、三份包的 `tsconfig.build.json`、桌面的 `tsconfig.main.json` 与 `tsconfig.preload.json`、`tools/check-deps/tsconfig.paths.json`、`tools/gate-fixtures/g3/tsconfig.json`）都没有 `composite` 或 `references`。触发条件还没出现。若现在改成 `tsc -b`，编译器改写的现有源码是 0 个（声明文件进已忽略的 `dist/`）。要改的现有文件大约是：`tools/typecheck.mjs`、`tools/gate-remediation/g3.test.ts`、`tools/gate-remediation/catalog.json`、生成表 `docs/gate-remediation.md`、最多 5 份会发射的 tsconfig，以及 `docs/backlog.md` 的那一行。状态句子在 `ARCHITECTURE.md`、`docs/ci-and-environment.md`、`docs/spec-changelog.md`，这三份等 #108 合入后再动。

拆分：G3 不放进 G1 的格式 PR。它本身不会大面积重排，也不需要改 CI 工作流。它仍然单独、并且现在不做：触发未到，而且改状态句子会碰到 #108。等真有一个包要 project references 时，那个 PR 再把 `typecheck.mjs` 换成 `tsc -b`，并改掉 g3 测试里「必需检查仍是 `--noEmit`」的断言。在那之前保持 `tsc --noEmit`。

### G5 `ui-events-declared`

规格要求：ARCHITECTURE §5.3 与 §13：每个 UI 事件在 `contracts/src/ui-events.ts` 登记名称、载荷、发布方与订阅方；载荷是 `PlainData`；未登记的切片发布或订阅则 G5 失败。PRD AC-82 还要求载荷里的函数、Promise、类实例编译失败，以及没有 ADR 编号的新事件被拒。Wisdom 2026-10-31 14:12：先在规格里定义怎样从代码认出发布和订阅，再写这条检查（backlog M1-DEFER-G5）。docs/ci-and-environment.md 写明这个认法还没有，`ui-events.ts` 也没有，没写上的行为不要另造。Issue #34 的触发是「规格定义完成后」。

`pnpm check` 接线：`check` 已经调用 `pnpm run check:deps`，即 `tools/check-deps/check.mjs` 用 `dependency-cruiser.config.mjs` 跑 `forbiddenRules()`。现在的规则名是 `feature-dependency-matrix`、`layer-direction`、`no-circular`、`no-cross-feature-internals`、`renderer-isolation`、`electron-only-in-desktop`、`contracts-is-leaf`、`contracts-kernel-type-only`、`providers-boundary`、`core-no-ui`、`ui-through-seam`、`pure-seam-stays-pure`、`markdown-parser-not-in-renderer`、`core-test-through-seam`。没有 `ui-events-declared`。dependency-cruiser 看不见「谁发布了事件」，所以这条不是再加一条 import 规则就能成立。认法要先写进规格。写上之后，检查放在已经由 `pnpm check` 调用的 `check:deps` 路径里，不改工作流。

现有文件：`contracts/src/ui-events.ts` 不存在。对 `*.ts`、`*.tsx`、`*.mjs`、`*.js` 搜索发布或订阅调用，命中 0。因此没有一堆调用点要改。检查落地时会动到的现有文件是 `tools/check-deps/build-rules.mjs`（或它旁边的一个单职责检查，不把认法塞进依赖规则里）、一条拒绝样例测试、`tools/gate-remediation/catalog.json` 里现在写着「不要手写事件名单」的 G5 条文，以及 `docs/backlog.md` 的那一行。登记文件本身是新文件。认法的规格句子在 ARCHITECTURE §5.3 / §13，等 #108 合入后再改。

拆分：G5 单独一个 PR，并且排在「认法写进规格」之后。现在写检查就是在发明认法。它不需要改 CI 工作流，也没有大面积重排；分开是因为规格还没定义，而且规格落点与 #108 冲突。

## 计划 / 实际

计划列在开工前填。实际列在 Forge 批准并实现之后填。本文件的实际列先空着。

| 步骤 | 计划 | 实际 | 证据 |
| --- | --- | --- | --- |
| 1 | 只交这份计划。不改三道门禁，不改工作流，不改 #108 正在改的三份文档 |  | `docs/evidence/<PR号>/commands.md` |
| 2 | Forge 若同意拆分：G1 用单独的 PR 接 Prettier，只格式化 89 个代码文件，提交说明含 `G12:`，忽略 Markdown 与 `.github/**` |  |  |
| 3 | G3 保持 `tsc --noEmit`，直到第一个包真的使用 project references。那个 PR 再改 `typecheck.mjs`，不改 `ci.yml` |  |  |
| 4 | G5 等认法写进规格、且 #108 已合入并 merge `main` 之后，再在 `check:deps` 的路径上加检查。不在依赖规则里发明发布/订阅的认法 |  |  |

## 证据链接

- `docs/evidence/<PR号>/`：测量命令与退出码。Prettier 没有 `--write` 进工作区。

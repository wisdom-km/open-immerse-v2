# 执行计划

M1 收尾里这一截：四个空切片、空的 `packages/providers`、ingest 九条出边与删除 `repair → quality` 的 ADR，以及 ARCHITECTURE §4.1 一句已批准的例外。基线 `origin/main@884a7a7`。路径按 [TEMPLATE.md](TEMPLATE.md) 用分支名 `feature/m1-empty-slices-adr`。第一笔提交只有本文件。

这次同时落到四个切片的 `src/`、`packages/providers` 与 ARCHITECTURE，所以用这份计划。PR 保持 Draft。正文用 `Refs #61`，不关 issue。不 force push，不合入。任务要求计划落盘后再实现，本分支按该指示继续写实现，不另等一轮审查才开工。

## 现状理解

- 已有行为：`packages/features/` 只有 `jobs`。它不在 `pnpm-workspace.yaml` 里。`package.json` 只有名字、`private`、许可证和 `type`。入口是 `src/index.ts` 与 `src/pure.ts`，占位测试在 `test/core/`。`tools/check-deps/feature-edges.mjs` 已经写了 ingest 的九条出边，`repair` 的出边是 `formula` 与 `jobs`，没有 `quality`。`build-rules.mjs` 已经有 `providers-boundary`：`packages/providers` 与 `@oi/providers` 只许被切片 adapters 和 `apps/desktop/src/main/` 导入；`providers` 自己不能导入切片、`apps`、Electron 与 UI。`packages/providers` 目录还不存在，workspace 也没有它，所以这条规则还没有一个真实的包可巡航。`docs/adr/` 只有 0001 与索引。索引写明 ingest 的九条边仍未建页。
- 相关的节：PRD §8 的 M1 行（空切片含这四个名字，以及空的 `packages/providers`、第一批 ADR）。ARCHITECTURE §3.1、§4.1、§4.3、§7.9.2、§13 G5 / G18、§16 末段。RULES §1.1、§2、§3、§4、§5 第 1 条、§7、§9、N-06、N-08、N-10、N-11。`tools/check-deps/feature-edges.mjs` 与 `build-rules.mjs`。DESIGN 与 `docs/design-principles.md` 管界面，这次不改它们（N-10）。
- 还没做的部分：没有 `formula-source`、`markdown`、`ingest`、`budget` 目录。没有 `packages/providers`。ingest 九条边和删除的 `repair → quality` 没有 ADR 页。§4.1 还没有把 `readHealthResponse`、`readProtocolHeader`、`readUnsupportedProtocol` 写成接受的例外。

## 要改的文件与热点声明

切片：`formula-source`、`markdown`、`ingest`、`budget`。四个 `src/` 在同一个 PR，靠本 PR 的 ADR 页走 G18 的例外。不改 `jobs`。

| 文件 | 做什么 | 热点 |
| --- | --- | --- |
| `packages/features/<四个>/package.json`、`README.md`、`src/index.ts`、`src/pure.ts`、`test/core/index.test.ts` | 照 `jobs` 的目录、包声明、入口和占位测试。不复制 `sameJobId`，不建 domain | 否 |
| `packages/providers/package.json`、`src/index.ts`、`README.md` | 空包。名字 `@oi/providers`。`exports` 照 `kernel`。依赖只声明 `@oi/contracts`、`@oi/kernel`、`@oi/platform-node`（`workspace:*`），对应 §7.9.2。入口不导出传输函数 | 否 |
| `pnpm-workspace.yaml` | 加上 `packages/providers` | 否。清单里的热点是 lockfile，不是这份文件 |
| `pnpm-lock.yaml` | 只为新包补 importer 链接。不改已有依赖的版本 | 是。只加这个包的链接 |
| `tools/check-deps/tsconfig.paths.json` | 加上 `@oi/providers` → `packages/providers/src/index.ts`，与已有三个包同一份解析表。不改 `dependency-cruiser.config.mjs`，不改 `build-rules.mjs` | 否。巡航配置文件本身不改 |
| `docs/adr/0002-ingest-edges.md`、`docs/adr/0003-repair-quality-removed.md`、`docs/adr/README.md` | 登记九条出边，以及删除 `repair → quality`。索引改成指向这两页。不新造边 | 否 |
| `ARCHITECTURE.md` §4.1 | 补一句：那三个 `read*` 是 oi-parse/1 报文的运行时校验，与 schema 放在一起，属于接受的例外 | 否 |
| `docs/evidence/<PR号>/commands.md` | 违规样例被拒，删掉后全量 check 的退出码 | 否 |

不改：`.github/workflows/**`、`DESIGN.md`、`docs/design-principles.md`、`docs/design/**`、`.cursor/environment.json`、`.cursor/install.sh`、`tools/check-secrets/leak.test.ts`、`docs/README.md`、`docs/backlog.md`、`docs/spec-changelog.md`、`docs/acceptance/**`、`dependency-cruiser.config.mjs`、`tools/check-deps/build-rules.mjs`、`tools/check-deps/feature-edges.mjs`。不写密钥。不改依赖版本。

`docs/spec-changelog.md` 按当时的任务不碰。§4.1 这一句因此没有 changelog 行，写在 PR 的风险里。Forge 审查在 #121 合入 main@4d83106 之后取消这一处禁改。步骤 6 补上 changelog，并按 RULES §7 改掉因此失真的 `docs/backlog.md` 与 ARCHITECTURE §4.3、§16。`docs/README.md`、`docs/acceptance/**`、`tools/check-secrets/leak.test.ts` 仍不改。

## 计划 / 实际

计划列在开工前填。实际列与证据在做完后填。

| 步骤 | 计划 | 实际 | 证据 |
| --- | --- | --- | --- |
| 1 | 本文件。然后按任务实现，不把实现推迟到另一次审查 | `630e4a7` 只有本文件。随后按任务实现，PR 保持 Draft | 本文件 |
| 2 | 四个空切片。入口 `export {}`。测试只断言两个入口没有运行时导出 | `984081b`。四个包都不在 workspace。占位测试 4 passed | [docs/evidence/122/commands.md](../evidence/122/commands.md) |
| 3 | 空的 `providers`，登记 workspace，并写入巡航用的 paths。`pnpm install` 只更新 lockfile 的 importer | `5c6649d`。lockfile 只加 `packages/providers` 的三条 workspace 链接。paths 增加 `@oi/providers`。规则文本未改 | 同上 |
| 4 | ADR 0002、0003，改索引。§4.1 补一句。不改矩阵，图上已经是这九条，`repair` 已经没有指向 `quality` | `6eba91f`。未改 `feature-edges.mjs` 与架构图 | 同上 |
| 5 | 在 `packages/providers/src/index.ts` 临时加上对 `jobs` 入口的导入，跑 `check:deps`，期望非 0 且含 `providers-boundary`。删掉这行，工作区恢复。再跑 `GATE_BASE=origin/main corepack pnpm run check`，期望 0 | 违规样例退出码 1，含 `providers-boundary`。恢复后 `6eba91f` 上 check 退出码 0。`check-one-slice: 4 feature slice(s)` | 同上 |
| 6 | 把 `origin/main` merge 进本分支。changelog 补 #122。按 RULES §7 同步失真的规格句。再跑 `GATE_BASE=origin/main corepack pnpm run check` | merge `4368b85`（main@4d83106），无冲突。规格提交 `840e291`。该提交上 check 退出码 0，`check-pr-size: 343 non-generated lines` | 同上 |

函数不超过 80 行。不建 `utils`。不改门禁上限（N-08）。预计对 `main` 的非生成 diff 低于 600 行。若超过，提交说明或 `PR_BODY` 加一行 `G12:`。

## 空切片

照 `jobs` 已有的形状，不照 §3.1 里还没落地的 `domain/`、`application/`、`adapters/`、`ui/`、`migrations/`。那些目录在 `jobs` 里也没有空文件夹。`jobs` 的 `src/domain/job-id.ts` 是门禁样例的行为，这次不复制。

四个包名：`@oi/feature-formula-source`、`@oi/feature-markdown`、`@oi/feature-ingest`、`@oi/feature-budget`。不放进 workspace。`jobs` 也不在 workspace，巡航按目录扫 `packages/`。

占位测试放在 `test/core/index.test.ts`，只 import `src/index.ts` 与 `src/pure.ts`。用例名：`exports nothing when the slice has no use cases`。

## providers

`package.json` 的 `exports` 与 `kernel` 相同：`types` 指 `./src/index.js`，`default` 指 `./dist/index.js`。现在没有 `dist/`，与 `kernel`、`platform-node` 一样。

依赖键恰好是 `@oi/contracts`、`@oi/kernel`、`@oi/platform-node`，值都是 `workspace:*`。入口文件不 import 它们，也不实现 `createChatTransport`、`createOcrTransport`、`listPresets`。

`tools/check-deps/tsconfig.paths.json` 增加 `@oi/providers`，因为巡航用这份 paths 解析包名，已有的三个包都在这里。不改规则文本。`providers-boundary` 已经同时匹配 `packages/providers/` 与 `@oi/providers`。

## ADR

只登记规格里已经写死的内容。

- 0002：ingest 可以 import 的九个 `index.ts` 是 `library`、`parsing`、`document`、`quality`、`formula`、`formula-source`、`repair`、`translation`、`jobs`。任何切片都不依赖 ingest。选项只列 §4.3 已经点名的四处：`jobs`、`document`、装配根、UI。
- 0003：删除 `repair → quality`。`repair` 的出边剩 `formula` 与 `jobs`。补救只产出候选，重新评分由 ingest 调 `quality`。

两页状态都是采纳。决定人是 Wisdom，日期用架构评审已经写明的 2026-10-30 19:57。不改 `feature-edges.mjs`，不改架构图。

## §4.1

在公共包表之后加一句，不改表里其他行：

`packages/contracts/src/worker/` 的 `readHealthResponse`、`readProtocolHeader`、`readUnsupportedProtocol` 是 oi-parse/1 报文的运行时校验，与 schema 放在一起，属于接受的例外（Wisdom 2026-11-04 05:26 批准 #61 第 4 条方案 A）。

不把这三个函数搬到别的包。不新建 ADR 页来重写这句。

## 证据链接

- `docs/evidence/122/`：[commands.md](../evidence/122/commands.md)

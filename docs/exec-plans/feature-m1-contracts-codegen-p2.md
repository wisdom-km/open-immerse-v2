# 执行计划

收 [Issue #61](https://github.com/wisdom-km/open-immerse-v2/issues/61) 的条目 1–6。条目 7 留给 jobs API 的 PR。基线 `origin/main@2f7a3286e361c9ab6c665026a3c9d7e9eac254d4`。路径按 [TEMPLATE.md](TEMPLATE.md) 用分支名 `feature/m1-contracts-codegen-p2`。第一笔提交只有本文件。Forge 已按本文通过。PR 保持 Draft，正文用 `Refs #61`。不 force push，不合入。

本计划同时落到 TS（`tools/check-deps`、`tools/codegen`）与 worker（`oi_worker/api/health.py`），所以用这份计划。不改功能切片。

## 审查结论

Forge 批准按本文实现。

- 条目 2、3、5 按下面的做法实现。
- 条目 1、4、6 不做。不给 `ids.ts` 加构造函数，不新建包，不加 `maxLength`，不改 ARCHITECTURE 与 `docs/spec-changelog.md`。
- 条目 7 不实现。PR 正文写 `Refs #61`。
- 若 pyright strict 要求 `health_route.py` 的改动超过 health.py 里一个很小的访问函数，停下来报告，不继续改路由。

## 现状理解

- 已有行为：`packages/contracts/src/ids.ts` 是六个 `unique symbol` 品牌，没有构造函数。`tools/check-deps/contracts-kernel.test.ts` 在临时目录巡航，配置却用仓库的 `dependency-cruiser.config.mjs`，`@oi/kernel` 经 `tools/check-deps/tsconfig.paths.json`（`baseUrl` 为 `../..`）落到仓库的 `packages/kernel`。`tools/codegen/schema-module.mjs` 按源文件 basename 把转译结果写进同一个临时目录；正则能改写 `export * from`，改不了动态 `import(`。`readHealthResponse`、`readProtocolHeader`、`readUnsupportedProtocol` 与 schema 同在 `packages/contracts/src/worker/*.ts`，调用方是 barrel 与 `tools/codegen/versions.test.ts`。`workers/parser/oi_worker/api/health.py` 的 `HealthExchange.body` 是 `dict[str, str] | dict[str, list[str]]`，`status` 是 `int`。`workerVersion` 的约束在 `packages/contracts/src/worker/health.ts`：`minLength: 1`、`pattern: "^\\S+$"`，没有 `maxLength`。生成的 `workers/parser/oi_worker/protocol/health.py` 与之相同。条目 7 的「作业数为 0」目前只和 426 交换夹具绑在一起。
- 相关的节：ARCHITECTURE §2.4、§4.1、§5.1、§10.2–§10.4、§13 G5 / G7 / G11。RULES §2、§3、§4、§9、N-09、N-10、N-11、N-15。PRD AC-66 ② 属于后续里程碑。DESIGN 与 `docs/design-principles.md` 没有对应条目。
- 还没做的部分：临时巡航没有封住 `@oi/kernel`。同 basename 的 schema 会互相覆盖。健康交换的状态与正文没有绑在同一个字面量上。ID 构造谓词、`read*` 的去留、`workerVersion` 的 64 上限，规格都没有另写一条可执行的规则。

## 要改的文件与热点声明

切片：无。`packages/features/**` 不改。G18 不涉及功能切片。

| 文件 | 做什么 | 热点 |
| --- | --- | --- |
| `tools/check-deps/contracts-kernel.test.ts` | 条目 2。临时目录自带 `baseUrl: "."` 的 paths、指向它的 cruiser 配置，以及 `packages/kernel/src/index.ts` | 否 |
| `tools/codegen/schema-module.mjs` | 条目 3。输出名改为源路径哈希；动态 `import(` 直接失败 | 否 |
| `tools/codegen/schema-module.test.ts` | 条目 3。同 basename 两文件都能加载；`export * from` 被改写 | 否 |
| `workers/parser/oi_worker/api/health.py` | 条目 5。`Literal[200]` 与 `Literal[426]` 两个 dataclass 组成判别联合 | 否 |
| `workers/parser/tests/api/test_health.py` | 仅在 pyright 需要收窄时改断言 | 否 |
| `workers/parser/tests/protocol/test_versions.py` | 仅在 pyright 需要收窄时改断言 | 否 |

热点文件：本计划不改 `ids.ts`、`composition-root.ts`、`slots.ts`、`dependency-cruiser.config.mjs`、`tools/check-deps/tsconfig.paths.json`、`tools/check-deps/check.mjs`、`apps/desktop/**`、`.github/workflows/**`、lockfile。`health_route.py` 仅在联合属性过不了类型检查时改为调用 health.py 里的访问函数；除此之外不改。

依赖：不新增运行时依赖，不改 `pnpm-lock.yaml`。不重新生成 `workers/parser/oi_worker/protocol/`。

## 计划 / 实际

计划列在开工前填。实际列在实现之后填。

| 步骤 | 计划 | 实际 | 证据 |
| --- | --- | --- | --- |
| 1 | 本文件。Forge 通过后才写实现 |  | 本文件 |
| 2 | 条目 2：只改 `contracts-kernel.test.ts`。临时 tsconfig 的 `baseUrl` 为 `"."`，paths 指向临时 `packages/kernel/src/index.ts`。临时 cruiser 配置复用 `forbiddenRules()`，`tsConfig.fileName` 指向该 tsconfig。临时 `index.ts` 类型导出 `Result`。仓库的 paths 与 `dependency-cruiser.config.mjs` 不动 |  |  |
| 3 | 条目 3：`schema-module.mjs` 用源文件绝对路径的 sha256 前 16 位十六进制命名输出。静态 `from` / `import` 改写保持。转译结果含动态 `import(` 时抛出。补同 basename 与 `export * from` 测试。不引入打包器。schema 字节不变，不跑协议生成 |  |  |
| 4 | 条目 5：`health.py` 用 `HealthReady`（`status: Literal[200]`，正文为 `protocol` / `workerVersion` / `mode`）与 `HealthOutOfRange`（`status: Literal[426]`，正文为 `supported`）。`dump_health` 返回 200 的 `TypedDict`。HTTP 状态码与 JSON 形状不变。`gate_header` 的返回类型保持，由 health.py 装进 426 变体 |  |  |
| 5 | 条目 1、4、6 不改代码。理由写进 PR 正文 |  | PR 正文 |
| 6 | 条目 7 不改夹具 |  | PR 正文 `Refs #61` |
| 7 | `git diff --stat workers/parser/oi_worker/protocol/` 为空 |  |  |

函数不超过 80 行，圈复杂度不超过 15，参数不超过 4 个。禁止顶层 `let`（F-06）。不建 `utils.ts`。不改门禁上限（N-08）。门禁不跳过。

## 条目 1：不做

ARCHITECTURE §4.1 写了构造校验，§2.4 只说运行时仍是字符串。空串、UUID、sha256、字符集都没有谓词。只做类型断言不算校验。写出拒绝规则是新的产品约束（N-15）。`ids.ts` 是热点，本任务不加行。`packages/kernel/src/id.ts` 仍不建。

## 条目 2：封住临时巡航

`tools/check-deps/tsconfig.paths.json` 的 `baseUrl: "../.."` 对仓库根是对的，不改。泄漏来自测试在临时目录复用仓库 cruiser 配置。

临时树写入 `packages/kernel/src/index.ts`，内容为 `export type { Result } from "./result.ts"`。临时 `tsconfig.paths.json` 的 `baseUrl` 为 `"."`，`@oi/kernel` 指向 `packages/kernel/src/index.ts`。临时 `dependency-cruiser.config.mjs` 从仓库 `tools/check-deps/build-rules.mjs` 引入 `forbiddenRules()`，`tsConfig.fileName` 用该 tsconfig 的绝对路径。`cruise` 把 `--config` 指到这份临时配置。

`tools/check-deps/real-tree.test.ts` 继续用仓库配置。

## 条目 3：输出名与动态导入

`emitFile` 的输出文件名为 `<sha256(绝对路径) 前 16 位>.codegen.mjs`。同一次加载里 `seen` 对同一源路径返回同一输出路径。非相对说明符仍用 `createRequire(sourcePath).resolve`。出现 `/import\s*\(/` 时抛出 `dynamic import: <源路径>`，不改写、不继续加载。

Python 模型名仍来自 schema 的 `name` 字段。

## 条目 4：不做

ARCHITECTURE §4.1 把 oi-parse/1 报文放在 `contracts/src/worker/*.ts`。`read*` 是 `Value.Check` 之后投影已知字段，`additionalProperties` 仍允许。`packages/worker-client` 不存在；新建工作区包会改 lockfile。kernel 新文件要 ADR。`readDiagEvent` 已留在 contracts，三份 worker 读取与它同一模式。

接受：`read*` 留在 `packages/contracts/src/worker/*.ts`，作为协议报文的运行时一半。

## 条目 5：判别联合

```python
class HealthOkBody(TypedDict):
    protocol: str
    workerVersion: str
    mode: str

class UnsupportedBody(TypedDict):
    supported: list[str]

@dataclass(frozen=True, slots=True)
class HealthReady:
    status: Literal[200]
    body: HealthOkBody

@dataclass(frozen=True, slots=True)
class HealthOutOfRange:
    status: Literal[426]
    body: UnsupportedBody

HealthExchange = HealthReady | HealthOutOfRange
```

两个变体都有 `.status` 与 `.body`。`health_route.py` 的 `JSONResponse(status_code=exchange.status, content=exchange.body)` 优先保持原样。pyright 若拒绝在联合上取属性，在 `health.py` 增加返回这两个字段的访问函数，路由只改为调用它。JSON 形状保持：200 为三个字符串字段，426 为 `{"supported": ["1.0"]}`。

## 条目 6：不做

schema 的 `minLength: 1` 与 `^\S+$` 已经是权威。仓库里没有 `workerVersion` 的 64 上限。不新增 `maxLength`，不另写字符集，不改 §10.4。

## 条目 7：延期

「主版本不符时作业数为 0」在 jobs API 的 PR 再补夹具。`docs/backlog.md` 已有 #61，不另开 issue。

## 测试清单

| 项 | 要观察的结果 |
| --- | --- |
| 2 | 临时树里类型导入 `@oi/kernel` 的巡航退出码为 0，输出不含 `contracts-kernel-type-only`。加上值导入后退出码非 0，输出含该规则名、`value-relative.ts`、`value-package.ts` 与 G5 改正说明 |
| 3 | 两个目录里同名 `item.ts`，入口 schema 的 `title` 来自另一目录的导出。`export * from` 的入口能加载被再导出的 `protocolSchemas`。动态 `import(` 使 `loadProtocolSchemas` 拒绝 |
| 5 | 现有 health 与 versions 测试仍断言 200 的三字段与 426 的 `{"supported": ["1.0"]}`。pyright strict 通过 |
| 7 | `git diff --stat workers/parser/oi_worker/protocol/` 为空 |

定向命令：

- `corepack pnpm exec vitest run tools/check-deps/contracts-kernel.test.ts tools/codegen/schema-module.test.ts tools/codegen/versions.test.ts`
- 工作目录 `workers/parser/`：`uv run ruff check oi_worker/api/health.py tests/api/test_health.py tests/protocol/test_versions.py`，`uv run ruff format --check` 同一组文件，`uv run pyright`，`uv run pytest tests/api/test_health.py tests/protocol/test_versions.py tests/protocol/test_health.py`

全量 `pnpm test` 与 `pnpm run check` 在实现提交之后按仓库门禁再跑。`test:core` 无脚本，写不适用。

## 不做

- 不改 `packages/contracts/src/ids.ts`，不建 `kernel/src/id.ts`。
- 不把 `read*` 搬出 contracts，不新建 `worker-client`。
- 不给 `workerVersion` 加 `maxLength`，不改 ARCHITECTURE、PRD、DESIGN、`docs/design-principles.md`、`docs/design/**`、`docs/spec-changelog.md`。
- 不改 `.github/workflows/**`、`apps/desktop/**`、`.cursor/environment.json`、`.cursor/install.sh`、lockfile、CI 行为与分支保护。
- 不改 `workers/parser/oi_worker/protocol/` 下的生成文件（N-09）。
- 不补条目 7 的 jobs 夹具。

## 证据链接

- `docs/evidence/<PR号>/`：

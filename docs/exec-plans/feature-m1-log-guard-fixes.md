# 执行计划

修 [Issue #81](https://github.com/wisdom-km/open-immerse-v2/issues/81)：PR #77 留下的三项日志守卫。基线 `main@ac90180`。路径按 [TEMPLATE.md](TEMPLATE.md) 用分支名 `feature/m1-log-guard-fixes`。第一笔提交只有本文件。Forge 审查通过之前不写实现。PR 保持 Draft，不离开 Draft，不合入，不 force push。

本计划跨 `packages/platform-node` 与 `apps/desktop` 装配根，所以用这份计划。不改功能切片，不改 worker。

## 审查结论

Forge 审查 `1d667de`：通过。Wisdom 2026-11-03 15:45 原文：「run_id 用 UUID（crypto.randomUUID）」。

- 第 1、3 项按本计划实现。
- 第 2 项不新增豁免。`run_id` 定为 UUID，由 Node.js `crypto.randomUUID()` 生成。下面的 ULID 提议作废。这种 UUID 已经由 `uuidPattern` 放行。
- 不改 `composition-root.ts`、`vitest.config.ts`。
- 定向检查只跑相关 vitest 与 `GATE_BASE=origin/main corepack pnpm run check`。不跑全量 `pnpm test`。

## 现状理解

- 已有行为：`packages/platform-node/src/logging/value-guard.ts` 在 `readDiagEvent` 通过后整值替换。`channel` 走 `scrubToken`，字符集是 `^[a-z0-9_.:-]*$`，长度 ≤ 64。`ingest.onProgress` 含大写 `P`，在 `ipc.oversize` 里变成 `[redacted]`。密钥识别在字符集之前：`authorization` / `bearer` / `sk-` / `oitest_`，GitHub 前缀 `ghp_`、`gho_`、`ghu_`、`ghs_`、`ghr_`、`github_pat_`，`AKIA` 或 `ASIA` 后 16 位，连续 40 位 hex，以及长度 ≥ 20 且香农熵 ≥ 4.0。UUID（`8-4-4-4-12`）与 `ts` 字符集在熵检测处豁免。`api-key-missing` 长 15，不查熵。`run_id` 与 `requestId` 走 `scrubId`：`^[A-Za-z0-9_.:-]+$`，长度 ≤ 128，仍然先过同一套密钥识别。规格示例 ULID `01ARZ3NDEKTSV4RRFFQ69G5FAV` 长 26、熵约 4.181，会被打码。`apps/desktop/src/main/index.ts` 用 `void app.whenReady().then(...)`，回调里在 `createMainWindow()` 之后调用 `startMainLogger()`。`createFileLogger` 构造时跑 `enforceDebugRetention`（同步 `unlinkSync` 等），失败就抛。`void` 只让浮空 Promise 通过 lint，没有挂上 rejection 处理，Node 会发出 `unhandledRejection`。
- 相关的节：PRD S10、US-14、AC-101。ARCHITECTURE §4.1（`id.ts` 列了，仓库里还没有这个文件）、§5.1、§6、§9 通道命名、§11、§13 G11。RULES §1.4、§2、§3、§4、§5 第 8 条、§9、N-05、N-06、N-08、N-10、N-11。DESIGN 原则 P5（只有要用户决定的事才用模态）。Issue #81。#77 的值约束在 [feature-m1-logging-impl.md](feature-m1-logging-impl.md)。#84 是 vitest 重复收集，本计划不碰。
- 还没做的部分：`channel` 不接受 §9 的 `<feature>.on<Event>` / `<feature>.<command>`。`run_id` 的字符串格式规格没写，守卫因此不能单独豁免某一种 id。`whenReady()` 那条 Promise 没有 `catch`。

2026-11-03 用 `value-guard.ts` 里同一个香农公式量过：`ingest.onProgress` 长 17、熵约 3.220；`quality.onScoringUnavailable` 长 28、熵约 3.941（距 4.0 只差 0.059）；`qa.onQm7w2e9r4t6y8u1i3o5p0a` 长 27、熵约 4.607，符合下面的 §9 模式；把规格示例 ULID 末位改成 `I` 后熵约 4.258，且 `I` 不在 Crockford 字母表里。

## 要改的文件与热点声明

切片：无。`packages/features/**` 不改。G18 不涉及功能切片。

| 文件 | 做什么 | 热点 |
| --- | --- | --- |
| `packages/platform-node/src/logging/value-guard.ts` | 第 1、2 项。现 184 行，预计停在 260 行以内（建议上限 400，硬上限 600） | 否 |
| `packages/platform-node/test/value-guard.test.ts` | 通道名用例 | 否 |
| `packages/platform-node/test/value-guard-secrets.test.ts` | 九类假 key 保持；补「像通道名 / 像 ULID 但仍是密钥」 | 否 |
| `apps/desktop/src/main/run-when-ready.ts` | 新建。`whenReady` 的 Promise 接线，不 import `electron` | 否 |
| `apps/desktop/src/main/index.ts` | 第 3 项。现 39 行，入口建议 100、硬上限 150 | 否。G11 的具名热点是 `composition-root.ts` 与 `slots.ts`，不是这个文件 |
| `apps/desktop/test/run-when-ready.test.ts` | 第 3 项。不启动 Electron | 否 |
| `ARCHITECTURE.md` §11 | 只在格式被写定之后加一句 `run_id` 的字符串形式 | 否 |
| `docs/spec-changelog.md` | 同一笔实现提交加一行 | 否 |
| `docs/evidence/88/commands.md` | 实现提交的命令与摘录 | 否 |

热点文件：本计划提交不改。实现不改 `apps/desktop/src/main/composition-root.ts`、`apps/desktop/src/renderer/slots.ts`、被两个以上切片 import 的契约、`dependency-cruiser` 配置、`tools/check-file-size/allowlist.json`、根 `package.json`、`pnpm-lock.yaml`。`composition-root.ts` 现 15 行；审查若要求把 catch 挪进去，该文件的 diff 仍 ≤ 30 行（G11）。

契约：`channel` 与 `run_id` 在 `diag-events.ts` 里已经是 `string`。这次不改形状，不单开契约 PR（RULES §3 第 3 条的触发条件是新的类型、IPC 定义或端口）。值约束留在 `value-guard`，与 #77 同一层。

依赖：不新增运行时依赖，不加 `ulid` 包。`platform-node` 继续值导入 `@oi/contracts` 的 `readDiagEvent`（Wisdom 2026-11-03 10:40）。desktop 的 main 继续依赖 `@oi/platform-node`。新文件不指向 `features`。

## 计划 / 实际

计划列在开工前填。实际列在 Forge 审查通过并实现之后填。

| 步骤 | 计划 | 实际 | 证据 |
| --- | --- | --- | --- |
| 1 | 本文件。含现状、文件与热点、三项方案、测试清单、开放问题。先停 | 提交 `1d667de`。Forge 审查通过后才写实现 | 本文件 |
| 2 | 第 1 项：`channel` 按 §9 格式放行，密钥识别不改 | `channel` 改走 `scrubChannel`：先 `hasHardSecret`，再长度 ≤ 64 与 §9 模式。合上的值不再查熵。小写字符集、九类前缀、hex 长度、熵阈值 20 / 4.0 未改 | `docs/evidence/88/commands.md` |
| 3 | 第 2 项：只豁免审查写定的 `run_id` 格式；没写定则不提交豁免 | 不新增豁免，不提交 ULID 模式。测试断言 `crypto.randomUUID()` 生成的 `run_id` 原样保留。ULID 样例不新增豁免，也不断言必须打码 | 同上 |
| 4 | 第 3 项：`whenReady()` 的 Promise 有 `catch`，测试里 `unhandledRejection` 次数为 0 | `runWhenReady` 在同一轮挂上 `catch`。失败用 `stderr.write` 写出 `error.stack ?? error.message`。desktop 的 `types` 为空、`lib` 只有 ES2023，没有 `console` 全局，所以不用上面的 `console.error`；落点仍是 stderr。不 `app.quit()`，不开对话框，不改 `composition-root.ts` | 同上 |
| 5 | 格式写定后，`ARCHITECTURE.md` §11 加一句，`docs/spec-changelog.md` 加一行。不改 `diag-events.ts`，不建 `kernel/src/id.ts` | §11 与 PRD AC-101 写明 UUID 与 `crypto.randomUUID()`。changelog 加一行。未改 `diag-events.ts`，未建 `kernel/src/id.ts` | 同上 |

函数不超过 80 行，圈复杂度不超过 15，参数不超过 4 个。禁止顶层 `let`（F-06）。不建 `utils.ts`。不改门禁上限，不往 allowlist 加行（N-08）。

## 第 1 项：通道名

`ipc.oversize` 的 `channel` 不再走小写 `scrubToken`。只这个字段换一条 §9 检查。`step`、`route`、`feature`、`level`、`error_class`、`status` 的小写字符集不动。

§9 原文：`<feature>.<command>`（invoke）与 `<feature>.on<Event>`（事件）。切片 id 是小写，段之间可以有一个连字符（`formula-source`）。命令是小写开头的驼峰（`openDocument`、`withdrawEgressConsent`）。事件是 `on` 加一个大写字母开头的名字（`onProgress`、`onBlockChanged`、`onEgressConsentRequired`、`onJobEvent`、`onFileEvent`、`onScoringUnavailable`）。不把 18 个切片名抄进守卫，避免和 §4.2 各写一份。

整值匹配：

```text
^[a-z][a-z0-9]*(-[a-z0-9]+)*\.(on[A-Z][A-Za-z0-9]*|[a-z][A-Za-z0-9]*)$
```

长度仍 ≤ 64。`settings.onEgressConsentRequired` 长 32。

顺序：

1. 先走现有的 `containsMarker`、`containsProviderToken`、`isAbsolutePath`、`containsQuerySecret`。命中则 `[redacted]`。这四条的正则、前缀和阈值不改。
2. 再看长度与上面的 §9 模式。不合则 `[redacted]`。
3. 模式合上的值保留，不再送进熵检测。`quality.onScoringUnavailable` 的熵已经到 3.941；更长的合法驼峰会过 4.0。豁免的是这一种形状，与 UUID 豁免同一种做法，不把 `entropyMinLength` 或 `entropyMinBits` 放宽。

因此 `ingest.onAKIAoitestfake123456` 这种既像 §9 事件、又含 `AKIA`+16 的值仍然打码。`ingest.on` 后面接 40 位 hex 同样打码。带 `ghp_` 的值含下划线，模式对不上，前缀检查也会打码。

## 第 2 项：run_id 格式

审查结论代替本节的 ULID 提议。实现不在 `isHighEntropy` 里加格式，不豁免 ULID。本节其余段落只保留当时的提议。

规格没写 `run_id` 长什么样。ARCHITECTURE §11 只列字段名。§4.1 的 `kernel/src/id.ts` 没有文件。日志契约计划写明不建 `id.ts`，生成留到以后。现有 UUID 豁免是误伤边界，不是「`run_id` 必须是 UUID」。

守卫不把整个 `run_id` 字段排除出熵检测。只在 `isHighEntropy` 里、紧挨现有 `uuidPattern` 的位置，对审查写定的那一种整串格式返回 false。九类假 key 的包含匹配仍在熵检测之前。

提议的格式（仍待决定，见文末）：[ULID 规范](https://github.com/ulid/spec)（2026-11-03 读 master 的 README）。128 位，规范字符串 26 字符，Crockford Base32，字母表 `0123456789ABCDEFGHJKMNPQRSTVWXYZ`（不含 I、L、O、U），大小写不敏感，无符号，因此能按字典序排序。前 10 位是毫秒时间戳，后 16 位是随机。规范示例是 `01ARZ3NDEKTSV4RRFFQ69G5FAV`。大于 `7ZZZZZZZZZZZZZZZZZZZZZZZZZ` 的 26 位串规范要求拒绝（130 位溢出 128 位）。

豁免条件按这个规范收成两条，都要满足：

- 整串匹配 `^[0-9A-HJKMNP-TV-Z]{26}$`，大小写不敏感。
- 转成大写后按字典序 ≤ `7ZZZZZZZZZZZZZZZZZZZZZZZZZ`。Crockford 字母在 ASCII 里仍按编码值升序，所以字符串比较就是规范里的溢出上界。

不引入生成库，本 PR 不分配 `run_id`。`requestId` 会跟着一起豁免，因为 UUID 今天也是在 `isHighEntropy` 里全局豁免，再由各自的字符集把关。小写 ULID 能通过 `scrubToken` 的小写字符集，所以 `step` 里的小写 ULID 会留下来；大写 ULID 过不了小写字符集，在 `step` 里仍是 `[redacted]`。`run_id` 的 `scrubId` 两种大小写都允许。这是沿用 UUID 的位置，不另做「只看 `run_id` 字段」的分支。

九类不会因此变成合法 ULID：`AKIA` 含 `I`；GitHub 前缀含 `_`；40 位 hex 比 26 长；`sk-` 含 `-`。末位是 `I` 的 26 位高熵串仍然打码。

审查结论若改成别的格式，守卫只实现那一版，并改 §11 那一句。结论没写定格式时，不提交第 2 项的豁免。

## 第 3 项：whenReady 的 catch

`startMainLogger()` 保持同步、失败继续抛。#77 的取舍不变：吞掉会让诊断静默丢失；不重试；不把这次失败再写进日志。

处理放在 `whenReady()` 返回的 Promise 上。新建 `run-when-ready.ts`：

```ts
export function runWhenReady(
  ready: Promise<void>,
  start: () => void,
  onError: (error: unknown) => void,
): void {
  void ready.then(start).catch(onError);
}
```

`index.ts` 把现有回调原样交给 `start`。`onError` 把 `Error` 的 `stack`（没有则 `message`）写到 stderr，其他值用 `String`。计划初稿写的是 `console.error`；desktop 的 `types` 为空，`console` 不是全局，实现改走 `import { stderr } from "node:process"`。不调用 file logger，不 `app.quit()`，不开对话框（窗口已经创建；P5 的模态只用于要用户决定的事，M1 没有诊断页）。

单独文件的原因：`index.ts` 一加载就 import `electron`。desktop 单测今天 import 的是不碰 Electron 的模块（`navigation.test.ts` 这一路）。助手函数不 import `electron`，也不 import `@oi/platform-node`。

`console.error` 会把 `mkdirSync` / `unlinkSync` 的 `Error` 打到 stderr，消息里带应用数据目录的绝对路径。stderr 不是 `<应用数据目录>/diagnostics/`。审查若要改成不含路径的固定句子，只改 `onError`，`catch` 保留。

## 测试清单

用例名沿用所在文件的英文，格式 `<结果> when <条件>`。对得上 AC-101 的加上编号。只断言 `guardDiagRecord` 的返回值和 `unhandledRejection` 的次数。不读源码文本（F-08）。只用已有夹具里的假 key（`oitest_`、`ghp_oitestfake` 这一组、`AKIA`/`ASIA` 加 `OITEST`/`FAKE` 的 16 位后缀、`ab` 重复 20 次）。不改 `.gitleaks.toml`。若 G9 命中，停下，按 WORKFLOW「密钥」交给 Wisdom，报告里不写密钥的值。

不改 `vitest.config.ts`（Issue #84）。新测试落在已经收集的 `packages/platform-node/test/**/*.test.ts` 与 `apps/desktop/test/**/*.test.ts`。

| 项 | 要观察的结果 |
| --- | --- |
| 1 | `ingest.onProgress`、`translation.onBlockChanged`、`settings.onEgressConsentRequired`、`jobs.onJobEvent`、`markdown.onFileEvent`、`quality.onScoringUnavailable`、`ingest.openDocument`、`formula-source.alignSource`、`settings.withdrawEgressConsent` 作为 `ipc.oversize` 的 `channel` 原样保留 |
| 1 | `qa.onQm7w2e9r4t6y8u1i3o5p0a`（长 27，熵约 4.607，符合 §9）作为 `channel` 原样保留。去掉 `qa.on` 后的 `Qm7w2e9r4t6y8u1i3o5p0a`（长 22，熵约 4.459）放在 `run_id` 上仍是 `[redacted]` |
| 1 | `Ingest.onProgress`、带空格、带 `/`、绝对路径，作为 `channel` 是 `[redacted]` |
| 1 | `ingest.on` 接 `AKIA`+16，以及 `ingest.on` 接 40 位 hex，都是 `[redacted]`，JSON 里样本出现 0 次 |
| 2 | `crypto.randomUUID()` 生成的值在 `run_id` 与 `requestId` 上原样保留。不新增 ULID 豁免，不对 ULID 样例断言必须打码 |
| 九类 | 现有 `value-guard-secrets.test.ts` 不放宽：`ghp_`、`gho_`、`ghu_`、`ghs_`、`ghr_`、`github_pat_`、`AKIA`+16、`ASIA`+16、40 位 hex（含纯数字与单字符重复），每个字符串字段含 `channel` 与 `run_id`，全部 `[redacted]`。高熵兜底、长度 19 的高熵串、`api-key-missing`、三个 UUID、`2026-11-02T00:00:00.000Z`、长低熵枚举、15 位 AWS 后缀，断言与现在相同 |
| 3 | `ready` 已 resolve、`start` 同步抛出时，`onError` 收到该值，`process` 的 `unhandledRejection` 次数为 0。监听在 `finally` 里卸下。`start` 正常返回时 `onError` 次数为 0。`ready` 本身 reject 时同样是 0 次 `unhandledRejection`。不 `sleep`，等微任务排空 |

实现提交 `bf16effb3174311857d0ff9b944346893e89fd7c` 上的命令（审查结论把全量 `pnpm test` 收成定向 vitest）：

- `corepack pnpm exec vitest run packages/platform-node/test/value-guard.test.ts packages/platform-node/test/value-guard-secrets.test.ts apps/desktop/test/run-when-ready.test.ts`
- `GATE_BASE=origin/main corepack pnpm run check`
- 全量 `corepack pnpm test` 没有跑。`test:core` 仍无脚本，写不适用。

## 仍开放的问题

无。`run_id` 格式已由 Wisdom 2026-11-03 15:45 写定，见上面的审查结论。

## 不做

- 不放宽九类假 key 的前缀、hex 长度或熵阈值（20 / 4.0）。
- 不把小写字符集改成允许任意大写。
- 不改 `packages/contracts`、`packages/kernel`，不建 `id.ts`，不生成 id。
- 不改 `composition-root.ts` 的抛出行为，不在 `createFileLogger` 里吞 IO 错误。
- 不改 `vitest.config.ts`（#84）。
- 不改 DESIGN、`docs/design-principles.md`、`docs/design/**`、`.cursor/environment.json`、`.cursor/install.sh`、`.gitleaks.toml`、worker、CI 与分支保护。
- 不做诊断页、导出、产品日志滚动（M2）。不打点解析、OCR、翻译。

## 证据链接

- `docs/evidence/88/commands.md`：实现提交 `bf16eff` 的定向 vitest 与 `pnpm run check`。

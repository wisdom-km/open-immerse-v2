# 执行计划

修 [Issue #59](https://github.com/wisdom-km/open-immerse-v2/issues/59)。分支 `feature/m3-worker-stop-signals-59`。第一笔提交只有本文件。实现在其后的提交。PR 保持 Draft，不离开 Draft，不合入，不 force push（N-01、N-03）。不改 `.github/`（N-02）。

本任务只改 worker 与规格指针，不改 TS 切片。预计改动可能接近 G12 的 600 行。交接仍要求第一笔只放这份计划，然后在同一条 Draft PR 里修。不等另一次 Forge 审查才写实现：Issue #59 已记下 Wisdom 2026-11-04 13:31 的「按推荐，我同意。」

## 现状理解

- 已有行为：`python -m oi_worker` 先在 `read_launch_token()` 里阻塞读 stdin。此时还没装停止信号处理。本机用 `uv run python -m oi_worker`、`start_new_session` 实测：进程停在 readline（`/proc/<pid>/wchan` 为 `pipe_read`）时，SIGINT 的 `Popen.wait` 是 `-2`，stderr 有 12 行 `KeyboardInterrupt` 回溯，不含令牌；SIGTERM 的 `wait` 是 `-15`，stderr 为空。shell 会把这两个状态显示成 130 和 143。导入尚未结束时发 SIGINT 也会打印回溯。uvicorn 接管之后，`server.py` 的 `_hold` 把信号吃掉，依赖 uvicorn 0.38.0 先恢复这个空处理再 `raise_signal`，进程才能以 0 退出并写出 `{"event":"exited"}`。`_install_exit_handlers` 与 `capture_signals` 之间的信号被 `_hold` 丢掉，且不设 `should_exit`。
- 相关的节：[docs/arch/10-01.md](../arch/10-01.md) §10.1、[docs/arch/10-05.md](../arch/10-05.md) §10.5；[RULES.md](../../RULES.md) §1.2、§2、§4、§9、N-02、N-10；[workers/parser/AGENTS.md](../../workers/parser/AGENTS.md)。PRD AC-80 ⑤ 是健康检查作业里已经要求的接管后退出码 0。AC-81 的监管状态机不在本 PR。
- 还没做的部分：`main()` 一进来就装 SIGINT、SIGTERM，以及平台有 SIGBREAK 时也装。接管前退出码约定为 0，不打印回溯，不输出令牌。`_hold` 记下已收到的停止信号；uvicorn 启动后或 `_wait_started` 结束时若标记已设，置 `server.should_exit = True`。规格与 backlog 的 #59 行还写着 130/143 留到 M3。

## 不改的文件

不改 `.github/workflows/**`。不改 `oi_worker/api/auth.py`、`oi_worker/api/app.py`（#60）。不改 `DESIGN.md`、`docs/design-principles.md`、`docs/design/**`（N-10）。不改 `.cursor/environment.json`、`.cursor/install.sh`（N-11）。不改 `package.json`、`pnpm-lock.yaml`、`workers/parser/pyproject.toml`、`uv.lock`。不实现桌面端 supervisor。

`worker-health-windows` 与 `worker-health-macos` 只跑 `uv run pytest tests/api/test_server.py`。Windows 的 SIGBREAK 用例必须留在这个文件里，否则不改 CI 就跑不到。`python-worker` 在 Linux 上跑全量 pytest，所以 `tests/api/test_entry_signals.py` 只保证 Linux 收集到。

## 来源核对

本机没有 `/workspace/oi-v2/scope-59-34/SCOPE.md`，也没有 Anvil 的 `/workspace/oi-qa/**/ANVIL.md`。下面用 Issue、仓库和这次实测核对。

| 来源 | 核对结果 |
| --- | --- |
| Issue #59 正文 | 对得上。PR #58 之后：接管前 SIGINT 为 130 且有 `KeyboardInterrupt` 回溯，SIGTERM 为 143 且无输出。正文把退出码约定留到 supervisor。本次实测：readline 上 SIGINT 的 `wait` 为 -2、12 行回溯；SIGTERM 的 `wait` 为 -15、无 stderr。shell 的 130/143 就是这两个信号死亡。M3 时机仍写在正文里；批准评论把修 #59 提前到现在，与 #130 并行。 |
| #59 评论（Anvil，PR #104 aff0302） | 对得上。`test_sigint_ends_the_process_outside_the_uvicorn_hold` 全量里偶发失败，单跑 3/3 通过，关联 #47。该测试现在断言 `code == -signal.SIGINT`。包装脚本先打印 `oi-worker-before-hold` 再调用 `main()`，信号可以落在 `main()` 装处理之前，退出码会在 -2 与带回溯的另一条路之间晃。 |
| #59 评论（Forge，PR #107） | 对得上。`_hold` 在 uvicorn `capture_signals` 换成 `handle_exit` 之前把 SIGINT 吃掉，不设 `should_exit`。#107 只改了测试时机。`server.py` 的 `_hold` 仍是 `return None`。 |
| #59 评论（Anvil 验 #107 @18c8cac） | 对得上。当前 SIGINT 测试用 `python -c` 包装，不是 `python -m oi_worker`。Windows 上整条 `skipif`，原因是 `Windows stop signal is SIGBREAK`。健康检查作业只收集 `tests/api/test_server.py`，所以 SIGBREAK 用例要改在这个文件里，不能只放新文件。 |
| #59 评论（Anvil，#114/#115） | 对得上。那两次全量各失败 1 次，单跑又过，且 PR 没改 `workers/`。修 #59 时让这条测试先等到处理已装上再发信号，避免再撞上导入或 `main()` 入口的空窗。不在本 PR 做 #47 的 quarantine 机制。 |
| #59 评论（批准 13:31） | 对得上。Wisdom 2026-11-04 13:31（UTC+8）原话「按推荐，我同意。」范围是开分支修本 issue，与 #130 并行，#60 稍后或另批。评论：https://github.com/wisdom-km/open-immerse-v2/issues/59#issuecomment-6623430891 。`docs/approvals.md` 还没有这一行（现有表停在 11:41）。实现提交补上这一行。 |
| `__main__.py` / `server.py` / `test_server.py` L107–131 | 对得上。`main()` 先 `read_launch_token()`。`_run_until_stop` 的注释写明依赖 uvicorn 0.38.0 的恢复再抛出。测试断言 `-signal.SIGINT`，Windows 整条跳过。 |
| Forge 调研 SCOPE.md | 文件不在本机。交接写 SIGTERM 观测与 issue 不一致、以测试为准。本次 readline 实测与 issue 的 143、无输出一致（`wait` 为 -15）。测试今天断言的是 `-signal.SIGINT`。约定码改为 0。 |

## 实现

`workers/parser/oi_worker/__main__.py`：`main()` 的第一件事调用 `arm_quiet_stop()`，然后再读令牌。入口文件只做装配。

`workers/parser/oi_worker/api/server.py`：

- `arm_quiet_stop()` 为 SIGINT、SIGTERM，以及 `signal.SIGBREAK` 存在时的那个信号，装上处理函数。处理函数 `raise SystemExit(0)`。本机小脚本已验证：readline 上 SIGINT 与 SIGTERM 都是退出码 0、stdout 与 stderr 都空。
- 环境变量 `OI_WORKER_STOP_READY` 若是一条路径，在处理装上之后、读令牌之前，把 `ready\n` 写入该文件。未设置则不写。这只给测试同步，不进 §15.4，不写日志，文件内容没有令牌。
- `_hold` 改为把「已收到停止信号」记在当次 `_serve` 传下去的对象上，不用新的模块级可变状态。
- `_run_until_stop` 在调用 `server.serve` 之前，若 `OI_WORKER_HOLD_READY` 是路径：写入 `ready\n`，然后最多等 5 秒直到标记已设。未设置则不等。标记已设时先把 `server.should_exit = True`。`_wait_started` 见到 `server.started` 时若标记仍设着，再置一次 `server.should_exit = True`。这样窗口里丢掉的信号会在服务起来后结束监听。
- 接管之后仍靠 uvicorn 自己的 `handle_exit` 置 `should_exit`。`_hold` 不抛 `SystemExit`，所以 0.38.0 的恢复再抛出不会把进程打成 130/143。测试里断言 `uvicorn.__version__ == "0.38.0"`。升级 uvicorn 时这条失败，要重跑退出码测试再改断言。不改 CI 路径过滤。

空行或 EOF 仍是退出码 1，不把缺令牌当成正常停止。

测试：

- `tests/api/test_server.py` 的 `test_sigint_ends_the_process_outside_the_uvicorn_hold` 去掉整条 `skipif`。命令改为 `python -m oi_worker`（`sys.executable -m oi_worker`），不再用包装脚本。等到 `OI_WORKER_STOP_READY` 再发信号：Windows 发 `CTRL_BREAK_EVENT`（进程仍用 `CREATE_NEW_PROCESS_GROUP`），其他平台发 SIGINT。断言退出码 0，stdout 与 stderr 都不含令牌，stderr 不含 `Traceback`。
- 同文件加窗口测试：真实入口，写入令牌，等到 `OI_WORKER_HOLD_READY` 再发同一套平台信号。`wait` 超时 15 秒。断言退出码 0，stdout 含 `{"event": "exited"}`，不含令牌，stderr 不含 `Traceback`。
- `tests/api/test_entry_signals.py`：Unix 上真实入口的 SIGTERM（接管前退出码 0、无回溯、无令牌），以及 uvicorn 版本断言。Windows 上 SIGTERM 由 `subprocess` 变成 `TerminateProcess`，捕不到；这条用 `skipif` 标原因。SIGBREAK 用例在 `test_server.py`，不跳过。
- 接管后的 `{"event":"exited"}` 与退出码 0 仍由 `test_ac_80_returns_200_without_paths_or_keys_when_the_worker_is_started` 覆盖。

规格：

- [docs/arch/10-01.md](../arch/10-01.md)：读令牌期间和尚未接受连接时，停止信号退出码 0，不打印回溯，不写令牌。接受连接之后先停听；服务循环接上信号处理之前到达的信号也要结束监听。任何阶段的正常停止都是退出码 0。缺令牌仍是非 0。
- [docs/arch/10-05.md](../arch/10-05.md)：补一条正常停止。监管进程把退出码 0 当成正常停止，不把 130 或 143 当成约定。
- `tools/compare-spec-bytes` 仍对照拆分基线 `f8d5d01`。章节正文一改，拼接字节就会对不上。在 `manifest.json` 加两条只替换一次的 amendment（旧段落必须唯一），先改基线文本再比较。链接前缀仍应是证据里的 68 条。别的正文漂移继续失败。amendment 的 `new` 与章节文件里的新段落逐字相同，这两段不加新的 Markdown 链接。
- [docs/backlog.md](../backlog.md) 的 #59 行改为：退出码约定已在本 PR 写成 0。supervisor 的重启上限仍是 M3。
- [docs/spec-changelog.md](../spec-changelog.md) 加一行。规格版本仍是 v0.6。
- [docs/approvals.md](../approvals.md) 补 13:31 那一行，条数改为 34。

## 计划 / 实际

计划列在开工前填。实际列在实现提交之后回填，证据写在 `docs/evidence/<PR号>/commands.md`。

| 步骤 | 计划 | 实际 | 证据 |
| --- | --- | --- | --- |
| 1 | 只提交本文件 |  | 本文件 |
| 2 | `arm_quiet_stop`、`_hold` 记信号、窗口里置 `should_exit`；测试改约定码并覆盖真实入口与 SIGBREAK |  | `docs/evidence/<PR号>/commands.md` |
| 3 | 更新 §10.1、§10.5、backlog、changelog、approvals，以及 compare-spec-bytes 的两条 amendment |  | 同上 |
| 4 | 针对性 pytest（含原先那条连续重复）、`vitest run tools/compare-spec-bytes/compare.test.ts`，然后一次 `GATE_BASE=origin/main corepack pnpm run check` |  | 同上 |

不跑全量 `pnpm test`。`test:core` 不适用（`package.json` 没有这个脚本）。不跑全量 pytest。Windows 用例在本环境跑不到，交给 `worker-health-windows`。

## 决策记录（Decision Log）

| 决定 | 理由 | 日期（Asia/Shanghai） | 谁定的 |
| --- | --- | --- | --- |
| 开分支修 #59，与 #130 并行，#60 稍后或另批 | Wisdom 原话「按推荐，我同意。」见 [Issue #59 评论](https://github.com/wisdom-km/open-immerse-v2/issues/59#issuecomment-6623430891)。实现提交把同一句写入 [docs/approvals.md](../approvals.md) | 2026-11-04 13:31 | Wisdom |
| 正常停止的退出码在任何阶段都是 0 | 交接写明这个约定，并要求写进 §10.1 与 §10.5。批准范围是按推荐修 #59 | 2026-11-04 | 交接；Wisdom 已同意开分支 |
| 第一笔之后同一 PR 里写实现，不等另一次审查 | 交接写明计划提交之后就修，并开 Draft。批准已经在 Issue #59 | 2026-11-04 | 交接 |
| 分支用 `feature/m3-worker-stop-signals-59` | 交接点名。RULES §2 的功能分支前缀也是 `feature/` | 2026-11-04 | 交接 |
| 测试同步用 `OI_WORKER_STOP_READY` 与 `OI_WORKER_HOLD_READY`，不用包装脚本，也不把同步写进规格 | 真实入口是 `python -m oi_worker`。包装脚本的标记打在 `main()` 之前，信号会抢在处理函数之前。就绪文件在处理装上之后才出现。这两个变量不是密钥，不进 §15.4 | 2026-11-04 | 本计划 |
| Windows 的 SIGBREAK 用例留在 `test_server.py`，不改 CI | 健康检查作业只收集这个文件。交接禁止改 `.github/` | 2026-11-04 | 交接；与仓库工作流一致 |
| 规格正文用 amendment 对准拆分基线，不改基线 commit | `compare-spec-bytes` 把章节拼回 `f8d5d01` 的 `ARCHITECTURE.md`。只允许这两次唯一替换，其他正文漂移仍失败 | 2026-11-04 | 本计划 |
| 停止标记放在当次 serve 的对象上 | RULES §5 第 4 条：不新增模块级可变状态 | 2026-11-04 | 本计划 |

## 证据链接

- `docs/evidence/<PR号>/commands.md`：实现提交之后写入。PR 号以开出的 Draft 为准。

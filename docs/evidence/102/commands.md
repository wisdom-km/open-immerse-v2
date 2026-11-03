# PR #102 命令

日期：2026-11-03（Asia/Shanghai）。工作目录是仓库根。核对的是提交 `cfb73f9578bd7ed35953118dd44cb5d93d4e1264` 上的 `.github/workflows/ci.yml`。本文件提交之后只改 `docs/spec-changelog.md` 里的 PR 号和本证据文件。工作流与 `docs/ci-and-environment.md` 不再改。

没有跑 `corepack pnpm test` 与 `corepack pnpm run check`。这次不改 TS 与 Python。`test:core`：不适用（`package.json` 没有这个脚本）。没有执行。未改日志。

## 命令

| 命令 | 退出码 | 备注 |
| --- | --- | --- |
| PyYAML 解析 `.github/workflows/ci.yml`，并与 `origin/main` 的 job id、`name`、`runs-on`、步骤名比较 | 0 | 关掉 YAML 1.1 把键 `on` 读成布尔。`COMPARE_OK` |

输出：

```
head cfb73f9578bd7ed35953118dd44cb5d93d4e1264
name CI
on ['push', 'pull_request']
permissions {'contents': 'read'}
concurrency.group ${{ github.workflow }}-${{ github.event_name }}-${{ github.ref }}
concurrency.cancel-in-progress ${{ github.event_name == 'pull_request' || github.ref != 'refs/heads/main' }}
node name=node runs-on=ubuntu-latest steps=13
python-worker name=python-worker runs-on=ubuntu-latest steps=11
worker-health name=worker-health-${{ matrix.os }} runs-on=${{ matrix.os }}-latest steps=12
desktop-e2e-windows name=desktop-e2e-windows runs-on=windows-latest steps=9
COMPARE_OK
```

`git diff origin/main -- .github/workflows/ci.yml` 只有新增的 `concurrency` 四行。`name:` 与 `on:` 没有出现在增删行里。

## 合入 origin/main 761f22c

日期仍是 2026-11-03。只解决 `docs/spec-changelog.md` 的冲突：main 的每一行都留着，#102 的一行放在表格第一行。没有改工作流，也没有改 `tools/gate-remediation/`。仓库里没有读取这份变更记录的测试。定向核对是下面这条 Python 比较。没有跑 `corepack pnpm test` 与 `corepack pnpm run check`。

| 命令 | 退出码 | 备注 |
| --- | --- | --- |
| 比较 `docs/spec-changelog.md` 与 `origin/main` 的表格行，并确认工作流里的 `concurrency` 块还在 | 0 | `CHANGELOG_OK`。main 27 行都在。多出来的只有 #102。第一行是 #102，第二行是 #101。日期非递增。没有冲突标记 |

输出：

```
conflict_markers []
main_row_count 27
resolved_row_count 28
missing_from_main 0
extra_rows 1
first_row_has_102 True
second_row_has_101 True
dates_non_increasing True
first_dates ['2026-11-03', '2026-11-03', '2026-11-03', '2026-11-03']
CHANGELOG_OK
```

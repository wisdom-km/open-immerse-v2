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

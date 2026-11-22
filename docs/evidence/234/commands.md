# PR #234 命令记录

阶段 1 只检查文档和提交说明。没有安装依赖，没有启动 Electron 或 native，没有跑产品测试。`pnpm install`、`pnpm test`、`pnpm run check`、eslint、vitest、tsc、pytest 都没有跑。行为验收 N1–N11 保持未跑，不标通过。

Node 是 v22.23.4。PATH 把 `/home/ubuntu/.nvm/versions/node/v22.23.4/bin` 放在前面。工作区是 `/home/ubuntu/worktrees/feature-view-menu-lifecycle-none-174`。

## 检查对象

commit `516e7d2e89b14afc21d89023888806915cfc4290`，tree `609b74cee74cf496b77118f891b394dbdd830370`。base `e70ec91a673cb2784491bb02924d77b96a05b147`，tree `3270b2bed76595084025fa7a697e23aa2caf841d`。

相对 base 的路径只有：

- `docs/approvals.md`
- `docs/exec-plans/feature-reader-view-menu-seam-174.md`
- `docs/exec-plans/feature-view-menu-lifecycle-none-174.md`
- `docs/exec-plans/feature-view-menu-lifecycle-ownership-plan-174.md`

`apps/`、`packages/`、`workers/`、`tools/`、`.github/`、`package.json`、`pnpm-lock.yaml` 的差分是空的。

## check-docs

命令：`node tools/check-docs/check.mjs`

退出码 0。输出：

```
check-docs: strict
links: 0
anchors: 0
status: 0
verbatim: 0
tree: 0
findings: 0
```

## check-commits

命令：`node tools/check-commits/check.mjs --base e70ec91a673cb2784491bb02924d77b96a05b147`

退出码 0。输出：

```
check-commits: subjects match Conventional Commits
```

## 本文件

上面两次跑在本文件加入之前。本文件和计划里指向 PR #234 的那一格是随后的文档提交。产品代码和测试代码仍然是 0。历史失败、意外 zip 123777540 字节、纯桩结果、旧 lint、skip 和环境 HOLD 不在这里清理。

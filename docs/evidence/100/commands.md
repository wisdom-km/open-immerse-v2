# PR #100 命令

日期：2026-11-03。工作目录是仓库根。基线是 `origin/main` 的 `d411710`（#96 已合入）。Node 是 `.nvmrc` 的 v22.23.4，`package.json` 的 `engines.node` 为 `>=22.23.4`。PATH 前置 `/home/ubuntu/.nvm/versions/node/v22.23.4/bin`。`node -v` 为 v22.23.4。未改日志。

代码提交是 `e9d44924fa385eed9e049742b02d4b7a78d9c987`。下面的命令跑在这棵树上，当时尚未提交；提交后 `tools/check-deps/check.mjs` 没有再改。本文件提交之后只改 docs。

`module.findPackageJSON`：在该 Node 上 `typeof module.findPackageJSON` 为 `function`。从 `tools/check-deps/check.mjs` 解析 `dependency-cruiser`，得到的 `bin.depcruise` 是 `bin/dependency-cruise.mjs`。因此继续实现，没有改用别的启动方式。

全量 `corepack pnpm test` 与 `corepack pnpm run check` 没有在本机跑。`test:core`：不适用（`package.json` 没有这个脚本）。没有执行。

未在 Windows 上复跑（not rerun on Windows）。

## 命令

| 命令 | 退出码 | 备注 |
| --- | --- | --- |
| `node -e` 检查 `module.findPackageJSON` | 0 | v22.23.4 上类型为 `function` |
| `node tools/check-deps/check.mjs`（改前，`d411710` 的启动方式） | 0 | stdout 76 字节，stderr 0 字节 |
| `node tools/check-deps/check.mjs`（改后） | 0 | 与改前逐字节相同 |
| `corepack pnpm exec vitest run tools/check-deps` | 0 | 3 个文件、4 条通过，失败 0，跳过 0 |
| `corepack pnpm exec eslint tools/check-deps/check.mjs --max-warnings 0` | 0 | 只查这个文件 |

## Linux 改前 / 改后

两次都在仓库根执行 `node tools/check-deps/check.mjs`。stdout 的 sha256 都是 `3ea35e096d61ab7091557ea42b7f494e7e148024f558bf0a5a151e983414ef75`。stderr 都是空文件，sha256 为 `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`。`diff -u` 的 stdout 与 stderr 结果都是 0 字节。退出码都是 0。

相同的 stdout（`cat -A`：空行、下面这一行、空行）：

```

✔ no dependency violations found (90 modules, 164 dependencies cruised)

```

（首尾各有一个空行。上面的围栏保留了结尾空行；开头空行在围栏内的第一行。）

unified diff（空）：

```diff

```

## Vitest

```
Testing types with tsc and vue-tsc is an experimental feature.
Breaking changes might not follow SemVer, please pin Vitest's version when using it.

 RUN  v5.0.5 /agent/repos/open-immerse-v2

 Test Files  3 passed (3)
      Tests  4 passed (4)
Type Errors  no errors
   Start at  15:12:20
   Duration  4.30s (tests 98%, transform 2%, import 1%)
```

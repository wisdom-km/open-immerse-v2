# PR #106 命令

日期：2026-11-03。工作目录是仓库根。基线是 `origin/main` 的 `82b1942`。Node 是 `.nvmrc` 的 v22.23.4。PATH 前置 `/home/ubuntu/.nvm/versions/node/v22.23.4/bin`。`node -v` 为 v22.23.4。未改日志。

代码提交是 `9e23a102db434171cbf2bf95a7af40030dc42d84`。下面的命令跑在这棵树上，当时尚未提交；提交后 `tools/check-deps/` 没有再改。本文件提交之后只改 docs。

`require.resolve("dependency-cruiser/package.json")` 在该 Node 上失败，错误码 `ERR_PACKAGE_PATH_NOT_EXPORTED`（包的 `exports` 没有 `./package.json`）。启动继续用 `findPackageJSON` 读 `bin.depcruise`，得到 `bin/dependency-cruise.mjs`，再用 `process.execPath` 执行，不经过 shell。

全量 `corepack pnpm test` 与 `corepack pnpm run check` 没有在本机跑。`test:core`：不适用（`package.json` 没有这个脚本）。没有执行。

未在 Windows 上复跑（not rerun on Windows）。`tools/check-deps/contracts-kernel.test.ts` 交给 Anvil 在真机验证。

## 命令

| 命令 | 退出码 | 备注 |
| --- | --- | --- |
| `node tools/check-deps/check.mjs`（抽取前，`82b1942`） | 0 | stdout 76 字节，stderr 0 字节 |
| `node tools/check-deps/check.mjs`（抽取后） | 0 | 与抽取前逐字节相同 |
| `corepack pnpm exec vitest run tools/check-deps` | 0 | 4 个文件、5 条通过，失败 0，跳过 0 |
| `corepack pnpm exec eslint tools/check-deps --max-warnings 0` | 0 | 目录方式，与 CI 的文件发现一致 |
| `corepack pnpm exec tsc --noEmit --pretty false --project tsconfig.json` | 0 | 新的 `.ts` 在这份 tsconfig 里 |

显式把 `launch-depcruise.d.mts` 传给 eslint 时，会得到 “File ignored because no matching configuration was supplied”，在 `--max-warnings 0` 下退出码 1。`eslint tools/check-deps` 与 `eslint .` 不把该声明文件算进检查范围，与仓库里已有的 `tools/codegen/schema-module.d.mts` 相同。

## Linux 抽取前 / 抽取后

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

 Test Files  4 passed (4)
      Tests  5 passed (5)
Type Errors  no errors
   Start at  17:34:17
   Duration  4.10s (tests 97%, transform 2%, import 1%)
```

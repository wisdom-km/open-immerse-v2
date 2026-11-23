# PR #237 命令记录

检查提交是 `352cf8954f4d9693328a01bc0b277993c29dc822`，tree `981d3e1ec5698fdf4306511b863a3d93e3989a0a`。基线 `6f23e38da65d10f0a54d144c7cdff06e769f355d`。本文件是其后的证据提交，没有再跑检查。下面的退出码 0 是分项，不是第二次完整 `pnpm run check`。

Node `/home/ubuntu/.nvm/versions/node/v22.23.4/bin/node`，版本 v22.23.4。uv 0.13.6。Python 3.11.18。启动前工作树干净。`GATE_BASE=6f23e38da65d10f0a54d144c7cdff06e769f355d`。

## 352cf89 上的分项

| 命令 | 退出码 | stdout SHA | stderr SHA |
| --- | --- | --- | --- |
| `corepack pnpm run lint` | 0 | `31264fc24c3d383a4c72eb607a6d74659c88f7f8cee0ab932a9f2181b7d7d57b` | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `corepack pnpm run typecheck` | 0 | `613436d9c4f810e4dcc6deb331541ec1a822f642c621db9aef37b27e392ba5c2` | 空 |
| `corepack pnpm run typecheck:core` | 0 | `d6d0de54650a31ff3f3fae939f8e3f7bc30d3b65fe49499373cab6eb3e89fbb8` | 空 |
| `corepack pnpm run check:size` | 0 | `35edd195b58d55d44526796033c1702952aa941dc9d6f3d8f0df08d3db4c02b3` | 空 |
| `corepack pnpm run check:deps` | 0 | `268d45767bc51d533a5153937cdfe1bc26789062b3b800fe119dcbb8fd910260` | 空 |
| `corepack pnpm run check:core-tests` | 0 | `7f4a999282d1821dad740561ce70164b7b112132eb7fa2ab5c56aeeb51b1f10c` | 空 |
| `corepack pnpm run check:license:npm` | 0 | `5c43e8ec97d2aea1e74342468e20e623488a000777464d760ee10b0d87e805cf` | 空 |
| `corepack pnpm run check:license:pip` | 0 | `6f92b451d4e44af037e14f4ffc6778805bb20fab0dbbd448df9f2dc7e7e57aef` | 空 |
| `corepack pnpm run check:license:models` | 0 | `7b5e862579a9a617577f1994d016d5a80006fb6e7c45190c2f60320b70da2dd5` | 空 |
| `corepack pnpm run check:one-slice` | 0 | `1ff6368b5e8c0680d951c902bc8ac66f6503c4566f6729f847ad0643cd48c3d4` | 空 |
| `corepack pnpm run check:commits` | 0 | `4562a42f3d2cef837281d275b2ae1334e9a1b57067a8b40db54b5d551c50ed67` | 空 |
| `corepack pnpm run check:hotspots` | 0 | `cb41f35cebed830971b9d175ca30325e457f43d9687fb96aa42c23a2a049c01f` | 空 |
| `corepack pnpm run check:pr-size` | 0 | `cfa1123312d1481807a41c1b52402e1edd060a9511410b969c4ee4ed369ab320` | 空 |
| `corepack pnpm run codegen` | 0 | `9463955aa98ce40aa98075f2bbef2dc781a7b0cd36de5faa454c82ccee72ef8c` | 空 |
| `node tools/gate-remediation/run.mjs --id G7 -- git diff --exit-code` | 0 | 空 | 空 |

空文件 SHA 是 `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`。exit 文件 SHA 都是 `5590571b4d985c97df7eaa6e13497f61074b86ca5ca404cfa5efe62da6242996`。

`check:size` 打印 `view-menu-gate.ts` 603 行，本次 diff 不含该文件。`check:pr-size` 打印非生成 848 行。`check:license:pip` 打印已接受，没有下载。

## 更早的失败，保留

- 七文件 vitest，`5fb5100cc423e9cf6419ee891d655887e618ed38`，退出码 1。stdout `ffd48b8c7cbae8093e6c9bcaf90d931ba50ab4cb0f1503b92eb09909d7a9f0da`。
- shell 单文件补验，`8f90c540c2614e5af192a0b4674e53fbaf278bd9`，退出码 0。stdout `d5e01bc52bee2f1c6655cc7c40d1ce1d6ea04bdc018db8b831cd0fcfdf0c00ed`。
- 完整 check，同一 `8f90c54`，退出码 1。G1 通过，G2 失败。stdout `b6167eefa02ef47c4a10884598babfa623a36a70263a4f7253e2db072a44f4c4`。
- lint，`2243996ffbae0527eda86edd769e6eb188608a6b`，退出码 1。stdout `c9b87fd6d62653e1bfd3230cb70155987fa6e6c378d5925ddf72c6a8ced1f215`。

E2-0 三文件仍是 0/1。G1 没有在 `352cf89` 上重跑。方向键、真实界面、高对比、读屏、R-E13 未验。

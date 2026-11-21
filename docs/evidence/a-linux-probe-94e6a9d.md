# Linux 临时原型索引

这是 2026-11-17 那一次临时目录原型的短索引。源是固定 main `94e6a9d847f6e5fc3c3ebbe2e089f535e31f5ed3`，tree `46baf7af4ea5b13e9a3025c4049d651115d15ce6`。只在 Linux、已有 X.Org `:1`（1920×1200）上跑过一次。它不是正式 mirror、不是 A 批验收、不是 CI、Windows、mac、物理键、读屏或截图通过。

本文不重跑探针。保留的日志在当时的证据目录 `view-menu-probe-94e6a9d`：`logs/hashes.txt`、`logs/electron-result.json`、`logs/toolchain.txt`、`logs/compile.log`、`logs/download.log`、`logs/spawn.log`、`logs/check.log`、`report.md`。Forge 的复核是 Issue #174 评论 7062635369 所附的证据审查。下面只列可核对的结果。

## 口径

作者报告「首个失败」一节写过「也没有改断言」。那句过宽，此处不改那份历史报告。准确说法是：首次实跑之后没有改断言，也没有重跑。准备阶段修订过检查器，并把真实进程判定提前；B1、B2 的字段条件没有被削弱。子进程在准备阶段补了标准输出冲洗。下载器给临时二进制加了可执行位。这些都在唯一一次核心运行之前。部分准备调用没有留下完整结果，不能说每一条准备操作都有完整日志。缺日志也不改写成失败。

失败注入没有做。清理扫描自己的命令行含有搜索词，那不是残留的 Electron。可见命令支持仓库和已查路径没有被改写，这不是全盘审计。zip 已删除，不能再算哈希；zip 记录以当时日志为准。

## 一次核心运行

Node v22.23.4。tsc 6.0.3。Electron 45.2.1。进程类型 browser，pid 6438，退出码 0，没有 `ELECTRON_RUN_AS_NODE`，没有 `--no-sandbox`。编译、下载、启动、检查的退出码都是 0。标准错误 648 字节，4 条 dbus 连接错误，没有把退出码变成非 0。启动前后两份编译结果哈希相同。

锁定 zip `electron-v45.2.1-linux-x64.zip` 的日志记录是 sha256 `616efc1ae4784af1a4f3f0e8774e73e7030e7bd1708da9d09bcf543dfa499beb`，123777540 字节，与包内 `checksums.json` 一致。二进制当时的 sha256 是 `870b5982c855df1405399efa0d51d83e6e048b3308a84cce4040bc3b052ce9f3`，文件没有保留。

十项保留文件的 sha256：

| 文件 | sha256 |
| --- | --- |
| `package.json` | `a90fc33418afa2b9cbf4768524b021135b965ecdf993457505bfae3ac44a8428` |
| `tsconfig.json` | `8473dddcd6612d79f4e1c87e93221982522441999596a1cc95f0387cc2ff3d2f` |
| `src/main/library-menu.ts` | `63f3fbb770c38064dd21910492fcc69a95ee8d4d4e5e9a802ea08f20d1da581b` |
| `src/main/view-menu-mirror.ts` | `281783566fffe24aab1be69ea98acc8dec76c069e828b6d5a0bc63809a8573ec` |
| `probe/child.mjs` | `b9bacaf6e6673f1d65fab04e072f297fa752d5a5fb538fefb87e9b46089dc452` |
| `probe/download.mjs` | `9a9ba18bdc6cbb94c1a1811163bfb07cbfc067725e9ec5e5fc88a4fa7f751432` |
| `probe/spawn-electron.mjs` | `2cde8062062c3d5cc824e098170bb5c4a45657be033dfe2e0edc9230dc9a705c` |
| `probe/check-stdout.mjs` | `a52a53afedc35487d1b575ea3dddf5967116da01c635529045944aaabdae5acc` |
| `dist/main/library-menu.js` | `b18706a7681f4571e9c1cd2031fe3ce693a6925f940bd3e52d7056545c0d774c` |
| `dist/main/view-menu-mirror.js` | `ab545081dd67278f0580f2adaf7c07c3387d5dac6b23f4bf0c54b9155f47893f` |

## 字段结果

十个标签：后退、前进、转到页码…、原文、对照、译文、放大、缩小、实际大小、适合宽度。父菜单在 Linux 上是 `视图(&V)`。

| 形状 | 原文 / 对照 / 译文 | 其余七项 |
| --- | --- | --- |
| none | 都是 normal，checked false | normal，checked false |
| original | 原文 radio 且 checked true；另两项 radio 且 checked false | normal，checked false |
| contrast | 对照 radio 且 checked true；另两项 radio 且 checked false | normal，checked false |
| translation | 译文 radio 且 checked true；另两项 radio 且 checked false | normal，checked false |

这些是 MenuItem 字段，不是画出来的菜单。原型脚本行数不是未来产品或测试的 numstat。

# 0011 阅读屏进出后标签页工作集不回落

状态：已采纳。日期：2026-11-10 18:25（Asia/Shanghai）。决定人：Wisdom。

批准时间：2026-11-10 18:25（Asia/Shanghai）。原话：「按推荐：采纳 0011，#199 不改运行时，视口绘制记作之后的单独候选（先不开工）；不 Ready/合入/发版」。来源：[Issue #174 评论 6764944106](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6764944106)。

本页不改已采纳的 [0006](0006-renderer-oi-asset-csp.md)、[0007](0007-oi-asset-fetch-scheme.md)、[0008](0008-oi-asset-fetch-cors.md)、[0009](0009-pdfjs-worker-src.md)。不改 CSP，不改协议注册，不改主进程，不改 core、contracts、`library/src`。不实现画布清零，不调用 `PDFDocumentProxy.cleanup()`，也不改成只画视口附近的页。

## 背景

Anvil 复测 PR #199 @ `0b61456`：worker、JS 堆、pageerror 和重画已过。剩下的是标签页 working set 随进出轮数上涨。真机 DESKTOP-0GI64S8 二十轮约 101→644 MB。Box（Linux xvfb，软件渲染）约 129→2268 MB。静置 60 秒不回落。critical 压力通知只降一点。同一时刻 worker 为 0，JS 堆约 7 MB，DOM 里没有 canvas。

下面是这台 Cloud Agent 上的对照，不是那两处。环境：Linux，`DISPLAY=:1`，Electron 45.2.1，Chrome 156.0.8078.75。Playwright 启动 `apps/desktop/dist/main/index.js`。样本是 PLOS ONE 的 25 页 letter PDF（612×792，约 2.7 MB）。一次打开画出 25 个 canvas，像素 48,470,400 字节。产品代码是当时已构建的阅读屏：离开时 `loadingTask.destroy()`，不把 canvas 宽高清零，不调用 `cleanup`。

测量用了主进程的 `process.getProcessMemoryInfo()` 与 `process.getBlinkMemoryInfo()`、`app.getAppMetrics()` 的 Tab `workingSetSize`、页面 `performance.memory`、`webContents.takeHeapSnapshot`、CDP `Tracing` 的 `disabled-by-default-memory-infra`，以及 Tab 进程的 `/proc/<pid>/status` 与 `smaps`。曲线在 `docs/evidence/199/commands.md` 的「标签页工作集（Cloud-local，20 轮）」一节。

二十轮之后，能对上的归属是：

- 标签页 working set：进入前 123204 KB，第 20 轮 626396 KB，`HeapProfiler.collectGarbage` 之后 509428 KB，静置 60 秒 403404 KB，critical 压力之后 239688 KB。
- 同一进程的 `RssAnon`：29260 → 第 20 轮 324596 → 回收后 206272 → 静置 130556 → 压力 130332 KB。压力之后仍比进入前高 101072 KB。静置和压力都不把这块还回去。
- `RssShmem`：2448 → 回收后 195648 → 静置 165276 → 压力 1784 KB。压力通知把共享内存清掉。`smaps` 里对应的名字是 `/memfd:shared-memory-region (deleted)`。
- 文件映射的 RSS：进入前 91496 KB，回收后 107508 KB，压力后 107572 KB。多出来的大约 16 MB 不再随轮数涨。
- JS 堆 `usedJSHeapSize`：进入前 7290634 字节，回收后 9630688，压力后 8872512。DOM canvas 数为 0。堆快照里 `HTMLCanvasElement` 11 个节点，`self_size` 合计 248 字节，`detachedness` 为 0。`ArrayBuffer` 12 个节点，`self_size` 合计 396 字节。快照里最大的节点是脚本文本（单节点 328728 字节）。没有留下一份 PDF 那么大的 `ArrayBuffer`。
- worker：创建 20，回收后存活 0、已 terminate 20。pageerror 为 0。
- 主进程 `getProcessMemoryInfo`：`private` 进入前 48584 KB，回收后 55996 KB，压力后 38252 KB。`residentSet` 压力后 178968 KB，低于进入前的 184344 KB。单调上涨的不是主进程。`getBlinkMemoryInfo` 的 `allocated` 始终低于 1 MB。

`memory-infra` 的详细转储采到了。malloc 桶上的若干标量解出来是 1e60 这一量级，不能当成驻留字节，所以没有把增长记到某一个分配器桶。能对上 `smaps` 的字段只有少数，例如 compositor tile manager 的 hard/soft limit 为 20000000 字节。归属用的是 `smaps` 和 `/proc/status`。

另外用同一份 PDF 做了两次四轮对照。对照只在测量脚本里做，没有进产品代码：

- 离开前把页面上每个 canvas 的宽高设为 0。`[anon]` 的 private dirty：进入前 22660 KB，四轮后 84148 KB，压力后 84072 KB。当前离开路径的同一项是 22536 → 86472 → 86256 KB。清零没有把匿名页降下来。共享内存这次几乎不涨（约 3 MB），压力前后也停在那里。
- 在 `loadingTask.destroy()` 之前调用 `PDFDocumentProxy.cleanup()`。private dirty：22636 → 92464 → 压力 88292 KB。匿名页没有更低。memfd 从 121600 KB 降到压力后的 3332 KB，和当前路径一样，只是可清的那一块。

## 选项

1. 在阅读屏离开时把 canvas 宽高设为 0，并在销毁前调用 `cleanup`。上面两次四轮对照里，匿名私有脏页仍大约多 60 MB。不采用。
2. 改主进程、协议缓存或 CSP，去清 Chromium 的共享图像和分配器保留。这要动本批已经停住的范围。不实现。
3. 先记录，不改运行时。压力通知能清掉的是 memfd 共享内存。静置和压力都留着的是标签页的 `[anon]` 私有脏页。
4. 只画视口附近的页，离屏页释放 canvas。Wisdom 2026-11-10 17:51 让先在测量里补这一条，不改产品代码。同机、同一份 PLOS ONE 25 页、同一套 Tab working set / `RssAnon` / `RssShmem` / `smaps` 测了当前路径和这条路径。模拟放在测量脚本里：当前页前后 2 页保留 canvas，其余页把宽高设为 0 并移出 DOM。打开后停在第 1 页，留下的是第 1–3 页，3 个 canvas、5816448 字节；当前路径是 25 个 canvas、48470400 字节。`packages/` 没有改动。

压力之后的 `[anon]` private dirty（KB）：

| 路径 | 四轮，进入前 | 四轮，压力后 | 二十轮，进入前 | 二十轮，压力后 |
| --- | --- | --- | --- | --- |
| 当前路径，25 页都画 | 19424 | 57248 | 19056 | 115600 |
| 只留当前页 ±2 | 19396 | 60512 | 19504 | 173912 |

四轮压力后，只留附近页的匿名脏页比当前路径高 3264 KB。二十轮压力后高 58312 KB。Tab working set 在二十轮压力后是 287440 KB，当前路径是 231584 KB。进出过程中的 `RssShmem` 低了：第二十轮当前路径 392872 KB，只留附近页是 14336 KB；两边在 critical 压力后都回到大约 1.5 MB。降下来的是压力本来就会清掉的共享内存，留下的匿名页没有降。

若以后真做，改动停在 `packages/features/reader/src/ui/page-column.tsx`：现在按页数把每一页都挂上并绘制。只挂当前页前后的页时，卸下的页会走这个文件里已有的 cancel。不需要改 CSP、协议注册、主进程、core、contracts、`library/src`。这次不实现。

## 决定

采纳第 3 条。Wisdom 2026-11-10 18:25 已选这项。登记在 [Issue #174 评论 6764944106](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6764944106)。

- #199 不为这个问题改运行时。不实现画布清零，不调用 `cleanup`。
- 视口绘制（只改 `packages/features/reader/src/ui/page-column.tsx`）记作 #199 之后的单独候选，暂不开工。
- 不改 CSP、协议注册、主进程、core、contracts、`library/src`。
- 本决定不是 Ready、合入或发版。

## 后果

- 进出阅读屏之后，标签页工作集里有一块匿名页不还给系统。这台机器上，二十轮再加 critical 压力，匿名页仍比进入前高 101072 KB。同日再跑的当前路径是 96544 KB。真机和 Box 的曲线仍以 Anvil 报告为准。
- memfd 共享内存在 critical 压力下会降。只画附近页能少占进出过程中的共享内存，不把压力后的匿名页降下来。
- worker、JS 堆和 DOM canvas 的释放保持现状。

## 状态

已采纳。#199 不为这个问题改运行时。视口绘制记作 #199 之后的单独候选，暂不开工。不放行禁区里的修改。

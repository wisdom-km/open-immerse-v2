# 执行计划

Markdown 解析核心的执行计划。选型与待决项已由 Wisdom 于 2026-11-04 20:33 批准（PR #155 评论 [6630710283](https://github.com/wisdom-km/open-immerse-v2/pull/155#issuecomment-6630710283)）。本文件记录这些结论。实现按 P9 另开 PR，不写进本分支的这一笔。基线 `origin/main@51243c9bb35073057d333409b1de874e3e36d133`（PR #151、#152 已在这条历史上）。分支 `feature/md-core-154`。路径按 [TEMPLATE.md](TEMPLATE.md)。

关联：[Issue #154](https://github.com/wisdom-km/open-immerse-v2/issues/154)。验收对得上 AC-30、AC-33、AC-45、AC-52、AC-53。AC-38、AC-47 只在计划里标后续。UI、文件读写、笔记库、链接解析、IPC 处理器、preload、写入实现都不在本 issue。

## 现状理解

- 已有行为：`packages/features/markdown` 是空切片。`src/index.ts` 与 `src/pure.ts` 都是 `export {}`。`test/core/index.test.ts` 断言这两个模块的导出键为空。`packages/contracts/src/markdown.ts` 只有 `MdFormulaCrop`（裁图与占位框两臂）。`packages/contracts/src/latex-policy.ts` 已有 `KATEX_SAFE_OPTIONS`、`FORMULA_MAX_CHARS`（8000）、`UNTRUSTED_LATEX_COMMANDS`。PR #152 已把 IPC 描述符落在 `packages/contracts/src/ipc/descriptor.ts`、`error-codes.ts`、`ipc/settings.ts`；描述符带 `expose`，settings 现有命令是 `expose: false`。没有 `ipc/markdown.ts`。解析库未安装。
- 相关的节：[docs/arch/04-05.md](../arch/04-05.md)、[docs/arch/04-01.md](../arch/04-01.md)、[docs/arch/06.md](../arch/06.md)、[docs/arch/05-01.md](../arch/05-01.md)、[docs/arch/08-01.md](../arch/08-01.md)、[docs/arch/09.md](../arch/09.md)、[docs/arch/11.md](../arch/11.md)、[docs/arch/12.md](../arch/12.md)、[docs/prd/06-01-01.md](../prd/06-01-01.md)、[docs/prd/06-01-10.md](../prd/06-01-10.md)、[docs/prd/08.md](../prd/08.md)、[docs/prd/08-01.md](../prd/08-01.md)、[docs/design/md-reader.md](../design/md-reader.md)、[docs/v1-review.md](../v1-review.md)、[RULES.md](../../RULES.md)、[DESIGN.md](../../DESIGN.md)、[docs/design-principles.md](../design-principles.md)。
- 还没做的部分：没有「文本 → `MdDocument`」。没有 `src`、没有 `serialize`、没有 `html_blocked`。本 PR 不补这些代码。

## 计划 / 实际

| 步骤 | 计划 | 实际 | 证据 |
| --- | --- | --- | --- |
| 1 | 第一笔只有本文件 | 本提交 | 本文件 |
| 2 | `node tools/check-docs/check.mjs` 与 `node tools/check-pr-size/check.mjs --base origin/main` | 提交后跑，退出码写在 PR 正文 | PR 正文「测试证据」 |
| 3 | Forge 审查、Wisdom 批准本计划之后才写实现、才加依赖 | 2026-11-04 20:33 已批准。实现按 P9 另开 PR | 评论 [6630710283](https://github.com/wisdom-km/open-immerse-v2/pull/155#issuecomment-6630710283) |

## 决策记录（Decision Log）

[docs/approvals.md](../approvals.md) 里还没有 20:10 与 20:15 这两行。原文在 issue 评论。本 PR 不改账本。下面仍按评论写成已定。

| 决定 | 理由 | 日期（Asia/Shanghai） | 谁定的 |
| --- | --- | --- | --- |
| 先写执行计划，对比 markdown-it 与 micromark；Forge 审查、Wisdom 批准后才写代码。契约类型现在一并纳入 | 原话「对这些都按照你推荐吧」。范围三条：新开 #154；先对比再写代码；契约纳入（#152 已合入）。评论 [6630264039](https://github.com/wisdom-km/open-immerse-v2/issues/154#issuecomment-6630264039) | 2026-11-04 20:10 | Wisdom |
| `pure.ts` 不导出解析器。`renderMarkdown` 只从 `index.ts` 给其他切片的 core。renderer 里没有解析器 | 原话「这个是符合这个架构设计的，对吧？如果是符合的话，就按照你的你的建议去做。」按 [docs/arch/04-05.md](../arch/04-05.md) §4.5.3 与 G15 `markdown-parser-not-in-renderer`。评论 [6630338450](https://github.com/wisdom-km/open-immerse-v2/issues/154#issuecomment-6630338450) | 2026-11-04 20:15 | Wisdom |
| 解析库用 micromark 的事件树，不调用它的 HTML 编译函数；不选 markdown-it。打开表格、删除线、任务列表、自动链接，以及脚注 | 许可证与字符级 `src` 两条过不了 markdown-it。原话按推荐执行，并改为现在就打开脚注。评论 [6630710283](https://github.com/wisdom-km/open-immerse-v2/pull/155#issuecomment-6630710283) | 2026-11-04 20:33 | Wisdom |
| `serialize(doc, source)` 用父区间补回块与块之间的空行。不把全文挂到要过 IPC 的对象上 | 根节点的 `offset` 盖住全文，空行在子节点之间的洞里。直接拼接子节点不等于原文。评论同上 | 2026-11-04 20:33 | Wisdom |
| 契约 PR 只加数据类型，不加 `markdown.render` 描述符 | 其他切片进程内调用 `index.ts`。描述符随以后的读文件契约再加，形状照 PR #152。评论同上 | 2026-11-04 20:33 | Wisdom |
| 脚注现在就打开：`micromark-extension-gfm-footnote` 与 `mdast-util-gfm-footnote`。契约增加脚注节点 | 评论写明该扩展为 MIT，并要求契约加上脚注节点。三种上下文都识别脚注。`oi-md/1` 排除的是 HTML、wikilink、图片，没有排除脚注 | 2026-11-04 20:33 | Wisdom |
| 识别引用块开头的 `> [!type]`，把类型词写入 `quote.callout`。显示仍是引用块。`==高亮==` 不建节点 | 评论同上。高亮没有写进规格；打磨池与 `docs/backlog.md` 留给下一个文档 PR（#153）。本系列实现 PR 不改 backlog | 2026-11-04 20:33 | Wisdom |

`docs/design/md-reader.md` 第 243 行与 `docs/arch/02-05.md` 第 21 行仍写着 `pure.ts` 导出 `renderMarkdown`。这两处留给文档 PR #153，本 PR 不动。

## 选用 micromark

已批准。直接依赖在解析 PR 加入，版本以当时锁文件为准。下面版本是 2026-11-04 的 npm 最新版，安装时若已有更新则锁更新后的版本，并在该 PR 的许可证扫描里记录：

- `mdast-util-from-markdown@2.1.0`：得到带 `position.offset` 的树，不产出 HTML。
- 语法与 mdast 各一份：`micromark-extension-gfm-table`、`micromark-extension-gfm-strikethrough`、`micromark-extension-gfm-task-list-item`、`micromark-extension-gfm-autolink-literal`、`micromark-extension-gfm-footnote`，以及 `mdast-util-gfm-table`、`mdast-util-gfm-strikethrough`、`mdast-util-gfm-task-list-item`、`mdast-util-gfm-autolink-literal`、`mdast-util-gfm-footnote`。
- 不依赖 `micromark-extension-gfm` 伞包（它带 HTML 扩展）、不依赖 `micromark-extension-math`、不把 `mdast-util-to-markdown` 当作往返实现。`micromark` 会作为传递依赖装上；业务代码不调用其默认导出（该函数返回 HTML 字符串）。

公式与 wikilink 不靠第三方扩展。规则写在 `math-syntax.ts`、`wikilink-syntax.ts`，在未改过的原文上扫描，再把命中的区间贴回树上。这样 `src` 仍是原文的 UTF-16 下标。

### P1 八个维度

测量日 2026-11-04。运行时 `node -v` 为 v22.23.4。安装在 `/tmp`，没有改本仓库的 lockfile。命令：`npm install --omit=dev --ignore-scripts`，然后 `du -sb node_modules`，并读取每个已安装包的 `package.json` 的 `license` 字段。

| 维度 | markdown-it 15.0.3 | micromark 4.0.3 与 mdast-util-from-markdown 2.1.0 | 取舍 |
| --- | --- | --- | --- |
| 许可证 | 包本身 MIT。传递依赖 `argparse@3.0.4` 的 license 字段是 `PSF-2.0` | 该次安装里每个包的 license 字段都是 `MIT`（含 `debug`、`devlop`、`@types/*`） | markdown-it 的闭包不在 [RULES.md](../../RULES.md) §1.5 白名单。PSF-2.0 只放行 `tools/check-license/dev-only.json` 里的 `typing_extensions`。不建议为 argparse 加例外 |
| 体积 | 另加 `markdown-it-footnote@4.0.0` 后，`du -sb` 为 2858558 字节，npm ls 为 8 个包 | 另加伞包 `micromark-extension-gfm@3.0.0` 与 `mdast-util-gfm@3.1.0` 后，`du -sb` 为 2120615 字节。建议的四扩展子集应更小，本计划没有单独再装一次 | 体积不构成选 markdown-it 的理由 |
| CommonMark / GFM | 包脚本有 `test:cmspec`。本计划没有重跑上游套件。实测 `new MarkdownIt({ html: true, linkify: true })`：表格有 `table_open`，删除线有 `s_open`，`https://` 经 linkify 成为链接；`- [x]` 的正文仍是文字 `[x] 做了`，没有任务列表节点 | npm 描述写 “commonmark compliant”。`mdast-util-from-markdown` 的 devDependency 有 `commonmark.json` `^0.31.0`（只说明上游用它做测试，不进我们的依赖）。实测打开 GFM 后：删除线、表格与对齐、任务列表的 checked、自动链接、脚注定义都出现 | 实现注册表格、删除线、任务列表、自动链接、脚注。不注册伞包里的 HTML 扩展 |
| 公式与脚注插件 | 核心没有公式插件。`markdown-it-footnote@4.0.0` 为 MIT。公式规则仍须自写，不能交给插件 | `micromark-extension-math@3.1.0` 为 MIT。本计划没有用它对照 v1 的列表项规则，因此不用。脚注用单独的 `micromark-extension-gfm-footnote` 与 `mdast-util-gfm-footnote`，不装伞包 | 公式扫描移植 v1，见 P5。脚注用上述两个包 |
| AST 与位置 | `Token.map` 的类型注释是行号区间 `[line_begin, line_end]`。实测行内 token 的 `map` 为 `null`（强调、行内代码、html_inline 都是） | `position.start.offset` / `end.offset` 是原文下标。`"a😀b"` 的 JS `length` 为 4，文本节点 `end.offset` 也是 4，与 UTF-16 码元一致。强调节点的切片含两侧 `*` | 选型条件是能给出源码位置。字符级区间只有 micromark 这条测到了 |
| 安全 / XSS | `html: true` 时给出 `html_block` / `html_inline`，库的用途包含把 token 渲染成 HTML | `fromMarkdown` 的 `html` 节点 `value` 与原文切片相等（实测 `<script>…</script>` 与带 `onclick` 的起止标签）。不调用 `micromark()`、不调用 `gfmHtml`、不引入 rehype | core 只保存原文切片，不返回给 renderer 的 HTML 字符串 |
| 性能与病态输入 | 30 万字符的重复短段 181.2 ms；500 层 `*` 0.8 ms；1 万个 `$` 5.8 ms | 同一输入 1509.0 ms、34.1 ms、1.3 ms | micromark 在这段短段上大约慢 8 倍。不因此改选 markdown-it。5 MB 截断是调用方的事，见 P6。一次把约 300 万字符的树留在堆里再继续分配时进程因堆耗尽退出，该次不能当作 5 MB 计时 |
| 维护与 ESM / 类型 | npm `time` 里 15.0.3 为 `2026-10-16T01:25:15.267Z`。自带 `dist/markdown-it.mjs` 与 `dist/markdown-it.d.mts`。不要加 `@types/markdown-it`（npm 上 14.2.0，落后于 15） | npm `time` 里 4.0.3 为 `2026-09-26T15:43:36.558Z`。`"type": "module"`，自带 `index.d.ts`。`fromMarkdown` 的值类型是 `Uint8Array \| string`；`Buffer` 只出现在注释里 | 两边都在近月发布过。core 的 `tsconfig` 无 DOM、无 `@types/node`，实现时只把 `string` 传进 `fromMarkdown`，并用 `typecheck:core` 确认 |

往返不能靠 `mdast-util-to-markdown`。实测它会改写原文，例如段首空格被删、引用前被插入空行、`- [x]` 被写成 `* [x]`、裸 URL 被写成尖括号自动链接。`serialize` 必须用原文切片拼接，见 P4。

## P2 切片文件

目录是 `packages/features/markdown/src/`。解析库的 import 只出现在 `domain/parse/`。下表是批准后要建的文件。

| 文件 | 唯一职责 | 本 issue |
| --- | --- | --- |
| `domain/parse/block-parse.ts` | 调用 `fromMarkdown`，把块映射成 `MdBlock[]`。每个块带 `src`。组装 GFM、脚注与我们自己的区间。不识别链接目标是否存在 | 交付 |
| `domain/parse/inline-parse.ts` | 行内 mdast 节点 → `MdInline[]`，复制 `offset` 为 `src`。含 `footnote_ref` | 交付 |
| `domain/parse/math-syntax.ts` | 在原文上识别 `$…$` / `$$…$$`，并按 v1 把紧随列表项的行间公式留在该项里。不 import 解析库 | 交付 |
| `domain/parse/wikilink-syntax.ts` | 识别 `[[x]]`、带别名、带标题、以及嵌入图片的写法。不查文件 | 交付 |
| `domain/callout-syntax.ts` | 从引用块正文开头识别 `[!type]`，返回类型词。不改原文，不决定怎么画 | 交付。20:33 新增，不在原文件表里 |
| `domain/html-policy.ts` | 把原始 HTML 收成 `html_blocked`。不产生 HTML 文档 | 交付 |
| `domain/math-policy.ts` | 读 `latex-policy`，给公式节点标 `blocked`。不 import `katex` | 交付 |
| `domain/heading-slug.ts` | 标题 ID，同名去重 | 交付 |
| `domain/source-span.ts` | `sliceSource`、`serialize`。`SourceSpan` 类型在契约里 | 交付 |
| `domain/streaming-split.ts` | 已闭合块与未闭合尾部。未闭合的 `$$` 不当公式 | 不交付。AC-47 在 M5 |
| `domain/link-resolve.ts` 及库、监视、导航、写入能力 | 见 §4.5.2 其余行 | 不交付 |
| application、adapters、ui | 用例、读文件、界面 | 不交付 |

`block-parse.ts` 若圈复杂度超过 15，再把「一种 mdast 块 → 一种 `MdBlock`」拆到同目录的单独文件。不先建一个多函数的映射大文件。

`index.ts` 导出 `renderMarkdown(text, context)`、`extractMath(text)` 与 `serialize(doc, source)`。`serialize` 放在 `index.ts` 而不是 `pure.ts`：core 测试只能经 seam 调用（G16），往返断言需要这个函数；`pure.ts` 仍只新增 `sliceSource`。`context` 为 `'note' | 'translation' | 'answer'`。`translation` 不跑 wikilink 扫描，也不把图片语法收成图片节点（`oi-md/1` 不含这两样）。三种上下文都识别脚注、公式与 HTML。比较 AC-30 的「同一段 Markdown」时，比较公式与普通块，不比较 wikilink 和图片节点。

## P3 契约类型

数据类型放在已有的 `packages/contracts/src/markdown.ts`，与 [docs/arch/04-01.md](../arch/04-01.md) 的落点一致。文件逼近 400 行再拆目录；本计划不预拆。不把数据类型放进 `contracts/src/ipc/markdown.ts`。那份文件留给以后的命令描述符。

形状如下，契约 PR 写入源码：

- `SourceSpan`：`{ start: number; end: number }`，UTF-16 下标，`end` 不含。
- `MdDocument`：`blocks`、`headings`、`links`、`truncated`，以及 md-reader 已有的 `fileId` / `title` / `revision`。解析核心不填绝对路径，`fileId` 为 `null`。`truncated` 由调用方传入，解析器不自己按 5 MB 截断。
- `MdBlock` / `MdInline`：以 md-reader §3.3 为起点。每个变体都有 `src`。块级与行内都有 `html_blocked`，字段 `raw` 等于该 `src` 的原文切片。
- 公式：块级 `math` 与行内 `math` 都有 `tex` 与可选 `blocked?: 'untrusted_command' | 'too_long'`。块级是行间公式，行内不跨行。
- 脚注：行内 `footnote_ref`（`identifier`），块级 `footnote_def`（`identifier` 与子块）。定义正文仍是块。
- 引用：`callout?` 是类型词，例如 `note`。没有这个写法时不带该字段。标记本身留在原文切片里，往返不删字符。
- `==高亮==` 不增加节点，等号留在 `text`。
- 行内链接带 `destination` 字符串，不填 `linkIndex`。本 issue 不解析目标，没有索引可填。`links` 保持空数组。`link-resolve.ts` 再决定要不要改成索引。
- wikilink：行内未解析节点，字段只有目标文本、可选别名、可选标题、是否嵌入。
- `MdFormulaCrop` 保持现在的两臂与 `type: 'formula_crop'`，不改 [packages/contracts/test/markdown.test.ts](../../packages/contracts/test/markdown.test.ts) 已经锁住的字段。文档树里用单独一臂包住它，并带 `src`。解析器产出这条臂的次数为 0。译文 `getBlocks` 以后在 `FormulaCropRef.at` 处插入，`src` 为零长度。两者不是同一个类型：`FormulaCropRef` 在 `translation.ts`，带 `at`；`MdFormulaCrop` 是插入文档后的节点。
- `MdDocumentWindow`：按 §4.5.3，`{ fileId, revision, blockCount, outline, from, blocks }`。本 issue 只定义类型。窗口切分与 `readBlocks` 不实现。预算默认值仍是「IPC 阈值的一半」，阈值本身见 [docs/arch/11.md](../arch/11.md) 的 1 MB，且 [docs/backlog.md](../backlog.md) 写明块窗口预算等 M2 实测。本计划不新写一个字节数。
- 写入类型：`MdEdit`、`WriteFileInput`、`WriteFileResult`、`MdCapabilities`、`MdFileWriter` 放在 `markdown.ts`，满足 AC-53 的「类型存在」。`MdFileWriter` 只有类型，装配根不注入。错误码含 `write_disabled`。不注册处理器，不把 `writeFile` 放进 preload。

IPC：本 issue 不加 `markdown.render` 描述符。其他切片在进程内调用 `index.ts`。renderer 不把原文送到一条解析命令。`openFile` / `readFile` / `readBlocks` 的描述符随读文件的契约 PR 再加，形状照 PR #152：`expose: false`，直到生成器真的要暴露。已由 20:33 批准。

契约测试用 `expectTypeOf`，放在 `packages/contracts/test/`。不断言源码文本。

## P4 往返

D7 在 M2，与解析核心同一批，见 [docs/prd/08-01.md](../prd/08-01.md)。

实测：根节点的 `offset` 覆盖整段输入，块与块之间的空行不在任一子节点里。`"第一段\n\n第二段\n"` 的两段分别是 `[0,3)` 与 `[5,8)`，两个换行都在洞里。把子节点切片直接相接，不等于原文。用父区间把洞补回去之后，等于原文。

`serialize` 的做法：对有 `src` 的节点，按子节点的 `src` 把父区间切成「洞 + 子树」。洞用原文在该区间的切片填上。叶子用自己的 `src`。整棵树的结果等于输入。这要求 `serialize` 能读到原文，所以 `MdDocument` 在 core 内部的往返函数收下原文参数：`serialize(doc, source)`。不要把整篇原文再挂到要过 IPC 的对象上，否则块窗口会把全文再带一遍，和 AC-79 冲突。

`sliceSource(source, span)` 是纯函数，由 `pure.ts` 导出。

属性测试：实现 PR 加入 devDependency `fast-check`（npm 许可证为 MIT；加之前用许可证门禁扫它的闭包）。用例经 `index.ts` 的 `renderMarkdown`，不断言实现文件的源码。语料至少包括 P5 的 v1 行为样例。随机字符串覆盖空串、只有 `$`、深列表、原始 HTML、emoji。

`WriteFileInput` 等类型在本 issue 的契约 PR 里定义。写入用例、适配器、preload 不在本 issue。

## P5 公式语法

规则来自只读查看的 v1 `lib/markdown-render.js` 第 148–396 行，提交 `96f1dfe263fd1138775cb84053e97dff707ae09a`。移植行为，不复制那段源码进仓库。HTML 渲染与消毒不移植。

1. 行首围栏代码（可有至多三个空格）整段跳过，其中的 `$` 不是公式。
2. 不跨行的行内反引号跳过。围栏外、反引号外的一对 `$` 可以包住中间的代码；反引号里面的 `$` 不是公式。
3. 链接目标、尖括号 URL、裸的 `http` / `https` / `mailto` 里的 `$` 保持为字符。
4. `$$` 可以跨行。内侧去掉空白后为空则不是公式。找不到闭合，或闭合落在被跳过的区间里，则这两个字符是普通文字。
5. 行内 `$…$` 不跨行，内侧为空或没有闭合则是普通文字。
6. 行间公式若只隔着空白紧跟在列表项后面，它属于该列表项，空行不因此结束列表。
7. 识别结果记在原文区间上。不先把公式替换成占位符再解析，避免下标错位。

`math-policy.ts` 在识别之后读 `latex-policy`：命中不可信命令则 `blocked: 'untrusted_command'`；`tex` 长度超过 `FORMULA_MAX_CHARS` 则 `blocked: 'too_long'`。不调用 KaTeX。

文档级「公式个数 / 公式总字符」仍待定，见 [docs/arch/04-05.md](../arch/04-05.md) §4.5.6。函数收下 `{ maxFormulas: number | null; maxTexChars: number | null }`。`null` 表示这条预算不生效。不把 v1 的 30 个 / 4000 字符写进默认值。

要改写成对 `MdDocument` 的断言、不移植 HTML 字符串断言的 v1 用例：`tests/markdown-render.test.mjs` 里的围栏与行内代码不是公式、URL 里的美元留在目标里、行间公式留在列表项、未配对的 `$$` 与 `$5` 是文字、原始 HTML 不成为可执行标签。表格对齐、删除线、有序列表的 `start`、任务列表的 checked 用 GFM 扩展覆盖。病态输入沿 `tests/helpers/render-guard.mjs`：子线程里跑，超时即失败。

## P6 安全与病态输入

- 所有 mdast `html` 节点变成 `html_blocked`，包括 `<script>`、`<iframe>`、`on*` 属性。不按标签名放行。实测一个带属性的标签会被拆成「起始 html + 文本 + 结束 html」；三块都保留，文本仍是文本。`raw` 是原文，界面以后按文字显示。
- core 不返回 HTML 字符串。禁止调用 `micromark` 的默认函数、`gfmHtml`、rehype。ESLint `react/no-danger` 已是 renderer 的规则，本 issue 不改 UI。
- 单公式上限与不可信命令只读 `latex-policy`。文档级公式预算保持空参数。
- 5 MB 截断属于以后的 `vault-limits.ts`，状态仍是待定标（QM-17）。解析函数不在内部截断。
- 超时测试只放在 `test/`，用 `node:worker_threads` 包住一次解析，到时 `terminate`。domain 不 import `node:`。用例包括深层嵌套、长串 `$`、未闭合标签。生产路径仍是同步纯函数；真要迁出 main，按 §4.5.5 放到 utility，不在本 issue 做。

## P7 pure.ts

已定，见 Decision Log 第二行。

- `pure.ts` 本 issue 只新增 `sliceSource`。不导出 `renderMarkdown`、`extractMath`、`fromMarkdown`，也不再导出解析库的任何名字。
- `index.ts` 导出 `renderMarkdown`、`extractMath` 与 `serialize`，供 `translation` / `notes` / `qa` 的 core 调用。`serialize` 见 P2。
- 现有 core 测试「导出为空」会在实现 PR 改成断言上述清单。测试仍只 import `index.ts` 与 `pure.ts`。
- `navigate` 属于 `nav-history.ts`，不在本 issue。

## P8 依赖登记

现状：`dependency-cruiser.config.mjs` 没有一份「domain 可以 import 哪些 npm 包」的白名单。`layer-direction` 禁止 domain 依赖 `node:`、`fs`、Electron、SQLite。其他 npm 包目前能进来。`tools/check-arch-graph/reduce.mjs` 把 npm 依赖当成第三方直接丢掉，所以解析库不会变成 arch-graph 的 unmapped 边。`--strict` 不需要为这个 import 改 mermaid。

ESLint 与 G15 今天只按精确包名拦住 `markdown-it`、`micromark`、`mdast`。`mdast-util-from-markdown`、`micromark-extension-gfm-table` 与 `micromark-extension-gfm-footnote` 对得上这些正则的失败方式并不存在：`node_modules/micromark-extension-gfm-footnote` 不是 `node_modules/micromark/`。解析 PR 要把禁令改成实际会安装的包名（或稳定前缀），并让 `domain/parse/` 以外的文件，包括本切片的其他 domain 文件，都不能到达它们。`domain/parse/` 里允许的第三方只限上面列出的那一组。这是 `eslint.config.js` 与 `tools/check-deps/build-rules.mjs` 的修改，不是 `.github/workflows`。放在解析 PR，不放在本 PR。

`check-arch-graph --strict` 在实现后仍须为 0。第三方边被 reduce 丢掉，不构成改图的理由。

## P9 后续 PR 与行数

G12：普通 PR 非生成行 600；只改 `packages/contracts/` 时是 200。下面是估计，用来决定要不要拆，不是实测。

| PR | 内容 | 估计 | 超过上限时 |
| --- | --- | --- | --- |
| 本 PR | 只有本计划 | 一个文档 | 提交说明或 PR 正文加一行 `G12:` |
| 契约 | `markdown.ts` 的解析与写入类型、契约测试。先合入 | 180–250 行 | 契约上限 200。超过则正文写 `G12:`：`MdBlock` 是一个联合类型，拆开会合入一个不能用的半成品 |
| 纯规则 | `source-span`、`html-policy`、`math-policy`、`heading-slug`、`callout-syntax`、`pure.ts` 的 `sliceSource`、`index.ts` 的 `serialize`、测试。不加解析库 | 约 400 行 | 保持低于 600 |
| 解析 | 锁文件与依赖（含脚注两个包）、`domain/parse/`、`index.ts` 的 `renderMarkdown` 与 `extractMath`、fast-check、子线程超时、ESLint 与 dependency-cruiser 的包名 | 可能超过 600 | 先按「公式与 wikilink 扫描」和「fromMarkdown 映射」拆成两个 PR。仍超再在该 PR 写 `G12:` |
| 以后 | `streaming-split`（M5）、`link-resolve` 与笔记库（M3）、读文件与块窗口（AC-79）、`MarkdownView` | 各自开 PR | 不塞进解析 PR |

一个 PR 只动 markdown 这一条线。契约 PR 与实现 PR 分开。热点文件（根 `package.json`、`pnpm-lock.yaml`、dependency-cruiser 配置）只在解析 PR 里改，并在描述里声明。

## 架构约束怎么满足

- 依赖方向保持 ui → application → domain。domain 只依赖 `contracts`、`kernel` 和上表允许的解析库。不碰 DOM、`fs`、Electron。
- core 的 `tsconfig` 继续无 DOM。实现 PR 跑 `typecheck:core`。
- 行数按 [docs/arch/06.md](../arch/06.md)：源文件建议 400、硬 600；测试建议 600、硬 800；圈复杂度硬 15；参数硬 4。domain 纯函数不受函数 80 行限制，仍受文件上限与圈复杂度限制。一个文件一个不变量。
- UI 不解析 Markdown。本 issue 没有 UI 文件。
- 不实现任何 `.md` 写入。N-18。
- 不改 `.github/workflows/**`、不改 `.cursor/*`、不改 `docs/design/**`、不提交 secret。
- `docs/arch/02-05.md` 与 `docs/design/md-reader.md` 的旧句子不在本 PR 改。

## 已知冲突

1. 已定。`pure.ts` 不导出解析器。md-reader 第 243 行和 arch `02-05.md` 第 21 行留给 #153。本 PR 不改这两份文件。
2. 已定。数据类型放 `contracts/src/markdown.ts`。IPC 描述符以后放 `contracts/src/ipc/markdown.ts`。本 issue 不加 `markdown.render` 描述符。
3. 公式个数与公式总字符不设默认值，只留 `null` 参数。待以后定标，不在实现里填 30 与 4000。

## 来源核对

| # | 来源 | 本计划的回应 |
| --- | --- | --- |
| S1 | Issue #154 正文：目标、验收、不在范围 | 目标收成 P2–P7 的「交付」列。验收里的选型、`src`、往返、`html_blocked`、公式、wikilink、超时、契约类型都有对应节。不在范围的 UI、适配器、`link-resolve`、IPC 处理器、preload、写入实现、§4.5.8、CI，本计划不排进实现 PR |
| S2 | 评论 6630264039，Wisdom 20:10 | Decision Log 第一行。流程是先计划后代码。契约纳入 P3 |
| S3 | `docs/arch/04-05.md` 的 D1、谁解析、解析库只在 `domain/parse` 且须能给出源码位置 | P1 用实测的 `offset` 对上这条选型条件。P7、P8 写落点与白名单 |
| S4 | 同文件 §4.5.2 的切片文件 | P2 逐文件给了职责和是否本 issue 交付。公式规则在 P5 |
| S5 | 同文件的 `markdown.render` 与 `MdDocumentWindow` | P3：窗口类型现在定义、现在不实现。`markdown.render` 的 IPC 留到读文件的契约 PR，进程内入口是 `index.ts`。20:33 已批准 |
| S6 | 同文件 §4.5.5 | P6 |
| S7 | 同文件 §4.5.7 | P4 的 `serialize` / `sliceSource` / fast-check。P8 的写入 API 禁令留到有 adapters 的 PR；本 issue 不建 adapters |
| S8 | `docs/prd/06-01-01.md` 的 AC-30、33、38、45、47、52、53 | AC-30、33、52、53 在本 issue 的实现 PR。AC-45 的解析部分随 seam 测试；链接、监视、越界、阈值不在本 issue。AC-38 随 `link-resolve`。AC-47 随 `streaming-split`，M5 |
| S9 | `docs/prd/08-01.md`：解析核心在 M2，D7 定为 M2 | P4 把往返和写入类型放进本 issue 的契约与解析 PR，不拖到 M3。P9 不把 M3 笔记库并进来 |
| S10 | `RULES.md` 解析库落点、UI 不解析、N-18 | P7、P8、上一节。不写文件 |
| S11 | md-reader 的许可证候选、D1–D7、拟议契约 | P1 从这两款 MIT 候选里选 micromark，20:33 已批准。D1 的共享组件不在本 issue。D7 见 P4。拟议契约被 P3 收下，并加上规格后来加的 `blocked`、`src`、窗口、脚注节点。`quote.callout` 沿用拟议字段，本 issue 只写入类型词。第 243 行的 `pure.ts` 导出不执行 |
| S12 | `docs/backlog.md` 的 P1-7，以及块窗口预算等 M2 实测 | P7 已按 P1-7 写成已定。P3 不新定窗口字节数 |
| S13 | 现有 `MdFormulaCrop` 与 PR #152 的描述符 | P3：不改裁图两臂；新文档臂只包住它。描述符写法留作以后 `ipc/markdown.ts` 的模板，本 issue 不新增描述符。20:33 已批准 |
| S14 | `docs/arch/06.md` 行数表 | 「架构约束」与 P9 的拆分 |

另外核对过、没有要改本计划的句子：`docs/approvals.md` 只有 2026-11-04 02:57「Markdown 像 Obsidian 那样居中」，那是界面，不属于解析核心。`docs/prd/06-01-10.md` 的 AC-79 是单路径与块窗口，单路径在 P7，窗口实现不在本 issue。

## 已决定

2026-11-04 20:33，Wisdom，评论 [6630710283](https://github.com/wisdom-km/open-immerse-v2/pull/155#issuecomment-6630710283)。批准前的四条和当次新增的两条都已定，实现按此写。

1. 采用 micromark 方案，放弃 markdown-it（含其 PSF-2.0 的 argparse）。打开表格、删除线、任务列表、自动链接。
2. `serialize(doc, source)` 用父区间补回空行。
3. 契约 PR 只加数据类型，不加 `markdown.render` 描述符。
4. 现在就打开脚注（`micromark-extension-gfm-footnote` + `mdast-util-gfm-footnote`），契约增加脚注节点。不再保持关闭。
5. 识别 `> [!type]`，写入 `quote.callout`。显示仍按引用块。`==高亮==` 不做；打磨池记录留给下一个文档 PR，不在本系列改 `docs/backlog.md`。

更早已经定的：`pure.ts` 不导出解析器。公式个数与总字符不在本计划里填数字。

## 证据链接

- 本阶段没有 `docs/evidence/<PR号>/`。检查命令的退出码写在 PR 正文。
- v1 文件只在临时目录读过，不提交。

## 自检

- [ ] 影响 arch / prd 吗？本 PR 不影响。实现若要改 `docs/arch/02-05.md` 或 md-reader，走 #153，不进解析 PR。
- [x] 第一笔只有本文件。随后一笔仍只改本文件，把 20:33 的批准写进 Decision Log。无实现、无新依赖、无 CI 改动。

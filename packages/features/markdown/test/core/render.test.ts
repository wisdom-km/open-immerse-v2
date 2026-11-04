import { expect, it } from "vitest";

import type { MdBlock, MdContext } from "@oi/contracts";

import { extractMath, renderMarkdown, serialize } from "../../src/index.js";

function render(source: string, context: MdContext = "note") {
  return renderMarkdown(source, context);
}

function roundTrip(source: string, context: MdContext = "note") {
  expect(serialize(render(source, context), source)).toBe(source);
}

function onlyBlock(source: string): MdBlock {
  const block = render(source).blocks[0];
  if (!block) {
    throw new Error("expected a block");
  }
  return block;
}

it("keeps a blank line between paragraphs", () => {
  const source = "第一段\n还在这一段\n\n第二段";
  const doc = render(source);
  expect(doc.blocks.map((block) => block.t)).toEqual([
    "paragraph",
    "paragraph",
  ]);
  roundTrip(source);
});

it("reads emphasis, strong text, and strikethrough", () => {
  const source = "**粗** *斜* ~~删~~";
  const block = onlyBlock(source);
  expect(block.t).toBe("paragraph");
  if (block.t !== "paragraph") {
    return;
  }
  expect(block.inline.map((item) => item.t)).toEqual([
    "strong",
    "text",
    "em",
    "text",
    "del",
  ]);
  roundTrip(source);
});

it("keeps an ordered list start and task checkboxes", () => {
  const ordered = onlyBlock("3. 三\n4. 四");
  expect(ordered.t).toBe("list");
  if (ordered.t === "list") {
    expect(ordered.start).toBe(3);
    expect(ordered.items).toHaveLength(2);
  }
  const tasks = onlyBlock("- [ ] 待办\n- [x] 完成");
  expect(tasks.t).toBe("list");
  if (tasks.t === "list") {
    expect(tasks.items.map((item) => item.checked)).toEqual([false, true]);
  }
  roundTrip("3. 三\n4. 四");
  roundTrip("- [ ] 待办\n- [x] 完成");
});

it("keeps table alignment and does not emit HTML for the cells", () => {
  const source = "| 左 | 右 |\n| --- | ---: |\n| 1 | 2 |";
  const table = onlyBlock(source);
  expect(table.t).toBe("table");
  if (table.t === "table") {
    expect(table.align).toEqual([null, "r"]);
  }
  roundTrip(source);
});

it("does not treat fenced or inline code as math", () => {
  const source = "行内 `$5` 与\n\n```\nconst price = $5;\n```";
  const doc = render(source);
  expect(extractMath(source)).toEqual([]);
  expect(doc.blocks.map((block) => block.t)).toEqual(["paragraph", "code"]);
  roundTrip(source);
});

it("leaves dollars in a URL and still reads math in a link label", () => {
  const url = "见 https://x.com/$a$ 与 [文档](http://example.com/$b$)";
  expect(extractMath(url)).toEqual([]);
  roundTrip(url);
  const label = "[$x$](https://example.com/a)";
  expect(extractMath(label).map((item) => item.tex)).toEqual(["x"]);
  roundTrip(label);
});

it("reads inline and display math and blocks an untrusted command", () => {
  const source = "行内 $x$ 与\n\n$$\ny\n$$";
  const found = extractMath(source);
  expect(found.map((item) => [item.tex, item.display])).toEqual([
    ["x", false],
    ["y", true],
  ]);
  expect(found.every((item) => item.blocked === undefined)).toBe(true);
  const blocked = extractMath("$\\href{x}{y}$");
  expect(blocked[0]?.blocked).toBe("untrusted_command");
  const linked = "$\\href{https://example.com}{x}$";
  const linkedMath = extractMath(linked);
  expect(linkedMath.length).toBeGreaterThan(0);
  expect(
    linkedMath.every((item) => item.blocked === "untrusted_command"),
  ).toBe(true);
  for (const context of ["note", "translation", "answer"] as const) {
    const block = render(linked, context).blocks[0];
    expect(block?.t).toBe("paragraph");
    if (block?.t !== "paragraph") {
      continue;
    }
    const math = block.inline.filter((item) => item.t === "math");
    expect(math).toHaveLength(1);
    expect(math[0]?.blocked).toBe("untrusted_command");
    roundTrip(linked, context);
  }
  roundTrip(source);
});

it("leaves unpaired dollars as text", () => {
  const unpaired = "前文 $$ 后文\n\n价格 $5 没有配对";
  expect(extractMath(unpaired)).toEqual([]);
  roundTrip(unpaired);
});

it("stores raw HTML as html_blocked", () => {
  const source = '<script>alert(1)</script> <b onclick="x">粗</b>';
  const block = onlyBlock(source);
  expect(block.t).toBe("html_blocked");
  if (block.t === "html_blocked") {
    expect(block.raw).toContain("<script>");
  }
  roundTrip(source);
});

it("resolves images and wikilinks only outside translation context", () => {
  const image = "![示意图](https://cdn.example/a.png)";
  const note = onlyBlock(image);
  expect(note.t).toBe("paragraph");
  if (note.t === "paragraph") {
    expect(note.inline[0]?.t).toBe("image");
  }
  const translated = render(image, "translation").blocks[0];
  expect(translated?.t).toBe("paragraph");
  if (translated?.t === "paragraph") {
    expect(translated.inline[0]?.t).toBe("text");
  }
  const wiki = "见 [[目标#标题|别名]] 和 ![[图.png]]";
  const linked = render(wiki).blocks[0];
  expect(linked?.t).toBe("paragraph");
  if (linked?.t === "paragraph") {
    expect(linked.inline.map((item) => item.t)).toContain("wikilink");
  }
  const plain = render(wiki, "translation").blocks[0];
  expect(plain?.t).toBe("paragraph");
  if (plain?.t === "paragraph") {
    expect(plain.inline.every((item) => item.t !== "wikilink")).toBe(true);
  }
  roundTrip(image);
  roundTrip(wiki);
  roundTrip(wiki, "translation");
});

it("reads footnotes, callouts, and leaves highlight marks as text", () => {
  const note = "文字[^1]\n\n[^1]: 注\n";
  const doc = render(note);
  expect(doc.blocks.map((block) => block.t)).toEqual([
    "paragraph",
    "footnote_def",
  ]);
  roundTrip(note);
  const quote = onlyBlock("> [!note] Title\n> body");
  expect(quote.t).toBe("quote");
  if (quote.t === "quote") {
    expect(quote.callout).toBe("note");
  }
  roundTrip("> [!note] Title\n> body");
  const highlight = onlyBlock("==高亮==");
  expect(highlight.t).toBe("paragraph");
  if (highlight.t === "paragraph") {
    expect(highlight.inline[0]?.t).toBe("text");
  }
  roundTrip("==高亮==");
});

it("numbers duplicate heading slugs and leaves links unresolved", () => {
  const source = "# Hello, 标题\n\n# Hello, 标题";
  const doc = render(source);
  expect(doc.title).toBe("Hello, 标题");
  expect(doc.headings.map((heading) => heading.id)).toEqual([
    "hello-标题",
    "hello-标题-2",
  ]);
  expect(doc.links).toEqual([]);
  expect(doc.fileId).toBeNull();
  roundTrip(source);
});

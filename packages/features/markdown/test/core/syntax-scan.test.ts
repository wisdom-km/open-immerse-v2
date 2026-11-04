import { expect, it } from "vitest";

import { listOwned, mathCuts, skipRanges, wikiCuts } from "../../src/index.js";

it("skips dollars inside fences, inline code, and bare URLs", () => {
  const fenced = "行内 `$5` 与\n\n```\nconst price = $5;\n```";
  expect(mathCuts(fenced, skipRanges(fenced))).toEqual([]);
  const url = "见 https://x.com/$a$ 与 [文档](http://example.com/$b$)";
  expect(mathCuts(url, skipRanges(url))).toEqual([]);
});

it("finds inline math and a list-owned display formula", () => {
  const source = "1. 第一\n\n$$\na\n$$\n2. 第二";
  const cuts = mathCuts(source, skipRanges(source));
  expect(cuts).toHaveLength(1);
  const display = cuts[0];
  expect(display).toBeDefined();
  expect(display?.display).toBe(true);
  expect(listOwned(source, display?.src.start ?? 0)).toBe(true);
  const inline = "行内 $x$ 与\n\n$$\ny\n$$";
  const both = mathCuts(inline, skipRanges(inline));
  expect(both.map((cut) => cut.display)).toEqual([false, true]);
  const owned = both[1];
  expect(owned).toBeDefined();
  expect(listOwned(inline, owned?.src.start ?? 0)).toBe(false);
});

it("leaves unpaired dollars and highlight marks as plain text", () => {
  const unpaired = "前文 $$ 后文\n\n价格 $5 没有配对";
  expect(mathCuts(unpaired, skipRanges(unpaired))).toEqual([]);
  expect(wikiCuts("==高亮==", [])).toEqual([]);
});

it("reads a wikilink target, heading, alias, and embed marker", () => {
  const source = "见 [[目标#标题|别名]] 和 ![[图.png]]";
  const found = wikiCuts(source, skipRanges(source));
  expect(found.map((cut) => cut.target)).toEqual(["目标", "图.png"]);
  expect(found[0]).toMatchObject({
    heading: "标题",
    alias: "别名",
    embed: false,
  });
  expect(found[1]?.embed).toBe(true);
});

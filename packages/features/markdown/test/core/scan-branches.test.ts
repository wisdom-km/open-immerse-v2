import { expect, it } from "vitest";

import { listOwned, mathCuts, skipRanges, wikiCuts } from "../../src/index.js";

function skipped(source: string): string[] {
  return skipRanges(source).map((span) => source.slice(span.start, span.end));
}

function mathTex(source: string): string[] {
  return mathCuts(source, skipRanges(source)).map((cut) =>
    source.slice(cut.src.start, cut.src.end),
  );
}

it("skips a closed backtick fence, including one indented by three spaces", () => {
  const fence = "```\n$5$\n```\n";
  expect(skipped(fence)).toEqual([fence]);
  expect(mathTex(fence)).toEqual([]);
  const indented = "   ```\n$5$\n   ```\n";
  expect(skipped(indented)).toEqual([indented]);
  expect(mathTex(indented)).toEqual([]);
});

it("skips a tilde fence and a closer that sits at the end of the file", () => {
  const tilde = "~~~\n$5$\n~~~";
  expect(skipped(tilde)).toEqual([tilde]);
  expect(mathTex(tilde)).toEqual([]);
  const eof = "```\n$5$\n```";
  expect(skipped(eof)).toEqual([eof]);
  const spaced = "```\n$5$\n``` \t\n";
  expect(skipped(spaced)).toEqual([spaced]);
});

it("does not treat four spaces or a short marker as a fence", () => {
  const indented = "    ```\n$5$\n    ```\n";
  expect(skipped(indented)).toEqual([]);
  expect(mathTex(indented)).toEqual(["$5$"]);
  const short = "``\n$5$\n``\n";
  expect(mathTex(short)).toEqual(["$5$"]);
  const midLine = "text ```\n$5$\n```\n";
  expect(mathTex(midLine)).toEqual(["$5$"]);
});

it("skips an unclosed fence through the end of the file", () => {
  const noLine = "``` $5$ still";
  expect(skipped(noLine)).toEqual([noLine]);
  expect(mathTex(noLine)).toEqual([]);
  const hanging = "```\n$5$\ncode\n";
  expect(skipped(hanging)).toEqual([hanging]);
  expect(mathTex(hanging)).toEqual([]);
  const lastLine = "```\nnot a closer";
  expect(skipped(lastLine)).toEqual([lastLine]);
  expect(mathTex(lastLine)).toEqual([]);
});

it("keeps a longer fence open until a closer of the same length", () => {
  const nested = "````\n```\n$5$\n```\n````\n";
  expect(skipped(nested)).toEqual([nested]);
  expect(mathTex(nested)).toEqual([]);
  const loose = "```\n$5$\n```x\n```\n";
  expect(skipped(loose)).toEqual(["```\n$5$\n```x\n```\n"]);
  expect(mathTex(loose)).toEqual([]);
});

it("skips paired inline code and ignores an unclosed run", () => {
  expect(skipped("a `b` c")).toEqual(["`b`"]);
  expect(skipped("a `b")).toEqual([]);
  expect(skipped("`` a`b ``")).toEqual(["`` a`b ``"]);
  expect(skipped("`` a`b `")).toEqual(["`b `"]);
  const across = "`\n$x$\n`";
  expect(skipped(across)).toEqual([]);
  expect(mathTex(across)).toEqual(["$x$"]);
});

it("does not open inline code on a backtick inside a fence", () => {
  const fenced = "```\n` $5$ `\n```\n";
  expect(skipped(fenced)).toEqual([fenced]);
  expect(mathTex(fenced)).toEqual([]);
});

it("skips link destinations, including angles, nesting, and escapes", () => {
  const plain = "[文档](http://example.com/$b$)";
  expect(skipped(plain)).toEqual(["http://example.com/$b$"]);
  expect(mathTex(plain)).toEqual([]);
  const angled = "[文档](<http://example.com/$b$>)";
  expect(skipped(angled)).toEqual(["<http://example.com/$b$>"]);
  expect(mathTex(angled)).toEqual([]);
  const nested = "[文档](foo(bar)/$b$)";
  expect(skipped(nested)).toEqual(["foo(bar)/$b$"]);
  const escaped = "[文档](foo\\)bar/$b$)";
  expect(skipped(escaped)).toEqual(["foo\\)bar/$b$"]);
  expect(mathTex(escaped)).toEqual([]);
});

it("leaves a broken link destination as ordinary text", () => {
  expect(skipped("[文档](http://example.com/$b$")).toEqual([]);
  expect(mathTex("[文档](http://example.com/$b$")).toEqual(["$b$"]);
  expect(skipped("[文档](http://example.com/\n$b$)")).toEqual([]);
  expect(mathTex("[文档](http://example.com/\n$b$)")).toEqual(["$b$"]);
  expect(skipped("[文档](<http://example.com/$b$)")).toEqual([]);
  expect(skipped("[文档](<http://example.com/\n$b$>)")).toEqual([]);
  const afterAngle = "[文档](<http://example.com/$b$>x)";
  expect(skipped(afterAngle)).toEqual([]);
  expect(mathTex(afterAngle)).toEqual(["$b$"]);
  const coded = "`[文档](http://example.com/$b$)`";
  expect(skipped(coded)).toEqual([coded]);
  expect(mathTex(coded)).toEqual([]);
});

it("skips bare and angled URLs only at a whitespace boundary", () => {
  const start = "https://x.com/$a$ tail";
  expect(skipped(start)[0]).toBe("https://x.com/$a$");
  expect(mathTex(start)).toEqual([]);
  const mailto = "见 mailto:a@b.c/$a$";
  expect(skipped(mailto)).toEqual(["mailto:a@b.c/$a$"]);
  const angled = "见 <https://x.com/$a$> 与 <mailto:a@b.c>";
  expect(skipped(angled)).toEqual(["<https://x.com/$a$>", "<mailto:a@b.c>"]);
  expect(mathTex(angled)).toEqual([]);
  const stuck = "xhttps://x.com/$a$";
  expect(skipped(stuck)).toEqual([]);
  expect(mathTex(stuck)).toEqual(["$a$"]);
  const broken = "http:$x$";
  expect(mathTex(broken)).toEqual(["$x$"]);
  const afterParen = "(https://x.com/$a$)";
  expect(mathTex(afterParen)).toEqual(["$a$"]);
});

it("does not let a dollar inside a URL close display math", () => {
  const source = "$$\nhttps://x.com/$$\n$$";
  expect(mathTex(source)).toEqual(["$$\nhttps://x.com/$$\n$$"]);
  expect(mathCuts(source, skipRanges(source))[0]?.display).toBe(true);
});

it("rejects blank, unclosed, and line-crossing math", () => {
  expect(mathTex("$$\n$$")).toEqual([]);
  expect(mathTex("$$\n \n$$")).toEqual([]);
  expect(mathTex("$$ only")).toEqual([]);
  expect(mathTex("$ $")).toEqual([]);
  expect(mathTex("$a\nb$")).toEqual([]);
  expect(mathTex("$")).toEqual([]);
  const inline = mathCuts("$x$", []);
  expect(inline).toHaveLength(1);
  expect(inline[0]?.display).toBe(false);
});

it("recognizes which display formulas belong to a list item", () => {
  expect(listOwned("$$\na\n$$", 0)).toBe(false);
  expect(listOwned("不是列表\n$$", 6)).toBe(false);
  expect(listOwned("    - 太多空格\n$$", 12)).toBe(false);
  const bullet = "- 项\n\n$$";
  expect(listOwned(bullet, bullet.lastIndexOf("$$"))).toBe(true);
  const plus = "+ 项\n$$";
  expect(listOwned(plus, plus.indexOf("$$"))).toBe(true);
  const star = "* 项\r$$";
  expect(listOwned(star, star.indexOf("$$"))).toBe(true);
  const ordered = "2) 第二\n\t$$";
  expect(listOwned(ordered, ordered.indexOf("$$"))).toBe(true);
});

it("reads wikilinks and rejects broken ones", () => {
  const plain = wikiCuts("[[只有目标]]", []);
  expect(plain).toHaveLength(1);
  expect(plain[0]).toEqual({
    kind: "wiki",
    src: { start: 0, end: "[[只有目标]]".length },
    target: "只有目标",
    embed: false,
  });
  const embed = wikiCuts("![[图#节|名]]", []);
  expect(embed[0]).toMatchObject({
    embed: true,
    target: "图",
    heading: "节",
    alias: "名",
  });
  expect(wikiCuts("[[#只有标题]]", [])[0]?.target).toBe("");
  expect(wikiCuts("[[目标|]]", [])[0]?.alias).toBe("");
  expect(wikiCuts("[[未闭合", [])).toEqual([]);
  expect(wikiCuts("[[]]", [])).toEqual([]);
  expect(wikiCuts("[[  ]]", [])).toEqual([]);
  expect(wikiCuts("[[a\nb]]", [])).toEqual([]);
  const coded = "`[[目标]]`";
  expect(wikiCuts(coded, skipRanges(coded))).toEqual([]);
});

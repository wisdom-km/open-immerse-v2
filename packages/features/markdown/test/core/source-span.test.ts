import { expect, it } from "vitest";

import type { MdBlock, MdDocument, MdInline, SourceSpan } from "@oi/contracts";

import { serialize } from "../../src/index.js";
import { sliceSource } from "../../src/pure.js";

function span(start: number, end: number): SourceSpan {
  return { start, end };
}

function text(v: string, start: number): MdInline {
  return { t: "text", v, src: span(start, start + v.length) };
}

function paragraph(
  inline: readonly MdInline[],
  start: number,
  end: number,
): MdBlock {
  return { t: "paragraph", inline, src: span(start, end) };
}

function document(blocks: readonly MdBlock[]): MdDocument {
  return {
    fileId: null,
    title: "",
    revision: "",
    blocks,
    headings: [],
    links: [],
    truncated: false,
  };
}

it("fills the blank line between two paragraphs from the parent span", () => {
  const source = "第一段\n\n第二段\n";
  const blocks = [
    paragraph([text("第一段", 0)], 0, 3),
    paragraph([text("第二段", 5)], 5, 8),
  ];
  expect(serialize(document(blocks), source)).toBe(source);
});

it("keeps emphasis markers that sit outside the inner text span", () => {
  const source = "*斜*";
  const em: MdInline = {
    t: "em",
    c: [text("斜", 1)],
    src: span(0, 3),
  };
  expect(serialize(document([paragraph([em], 0, 3)]), source)).toBe(source);
});

it("slices by UTF-16 offsets, including an emoji", () => {
  const source = "a😀b";
  expect(sliceSource(source, span(1, 3))).toBe("😀");
  expect(
    serialize(document([paragraph([text("a😀b", 0)], 0, 4)]), source),
  ).toBe(source);
});

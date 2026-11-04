import type {
  MdBlock,
  MdInline,
  MdListItem,
  MdTableAlign,
  SourceSpan,
} from "@oi/contracts";

import { calloutType } from "../callout-syntax.js";
import { headingSlug } from "../heading-slug.js";
import { toHtmlBlocked } from "../html-policy.js";
import type { LiftMath, Piece } from "./cut-text.js";
import { asInline, inlineText, mapPhrasingSequence } from "./map-inline.js";
import type { MdastNode } from "./mdast-node.js";
import { nodeSpan } from "./node-span.js";
import type { ReadState } from "./read-state.js";

const headingLevels = [1, 2, 3, 4, 5, 6] as const;

export function mapFlow(node: MdastNode, state: ReadState): readonly MdBlock[] {
  switch (node.type) {
    case "paragraph":
      return mapParagraph(node, state);
    case "heading":
      return mapHeading(node, state);
    case "blockquote":
      return [mapQuote(node, state)];
    case "list":
      return [mapList(node, state)];
    case "code":
      return [mapCode(node, state)];
    case "table":
      return [mapTable(node, state)];
    case "thematicBreak":
      return [{ t: "hr", src: nodeSpan(node, state.base) }];
    case "html":
      return [mapHtml(node, state)];
    case "footnoteDefinition":
      return [mapFootnote(node, state)];
    default:
      return [];
  }
}

function mapParagraph(node: MdastNode, state: ReadState): MdBlock[] {
  return splitPieces(mapPhrasingSequence(node.children ?? [], state));
}

function splitPieces(pieces: readonly Piece[]): MdBlock[] {
  const blocks: MdBlock[] = [];
  let group: MdInline[] = [];
  for (const piece of pieces) {
    if (piece.t === "lift_math") {
      pushGroup(blocks, group);
      group = [];
      blocks.push(mathBlock(piece));
      continue;
    }
    group.push(piece);
  }
  pushGroup(blocks, group);
  return blocks;
}

function pushGroup(blocks: MdBlock[], group: readonly MdInline[]): void {
  const first = group[0];
  const last = group[group.length - 1];
  if (!first || !last) {
    return;
  }
  blocks.push({
    t: "paragraph",
    inline: group,
    src: { start: first.src.start, end: last.src.end },
  });
}

function mathBlock(piece: LiftMath): MdBlock {
  if (piece.blocked === undefined) {
    return { t: "math", tex: piece.tex, src: piece.src };
  }
  return { t: "math", tex: piece.tex, src: piece.src, blocked: piece.blocked };
}

function mapHeading(node: MdastNode, state: ReadState): MdBlock[] {
  const level = headingLevels.find((item) => item === node.depth);
  if (level === undefined) {
    return mapParagraph(node, state);
  }
  const inline = mapPhrasingSequence(node.children ?? [], state).map(asInline);
  const text = inline.map((item) => inlineText(item)).join("");
  const id = headingSlug(text, state.used);
  state.used.add(id);
  const src = nodeSpan(node, state.base);
  state.headings.push({ id, level, text, src });
  return [{ t: "heading", level, id, inline, src }];
}

function mapQuote(node: MdastNode, state: ReadState): MdBlock {
  const blocks = (node.children ?? []).flatMap((child) =>
    mapFlow(child, state),
  );
  const src = nodeSpan(node, state.base);
  const callout = quoteCallout(blocks);
  if (callout === null) {
    return { t: "quote", blocks, src };
  }
  return { t: "quote", blocks, src, callout };
}

function quoteCallout(blocks: readonly MdBlock[]): string | null {
  const first = blocks[0];
  if (!first || first.t !== "paragraph") {
    return null;
  }
  return calloutType(first.inline.map((item) => inlineText(item)).join(""));
}

function mapList(node: MdastNode, state: ReadState): MdBlock {
  const ordered = node.ordered === true;
  const items = (node.children ?? []).map((child) => mapItem(child, state));
  const src = nodeSpan(node, state.base);
  const start =
    ordered && typeof node.start === "number" && node.start !== 1
      ? node.start
      : undefined;
  if (start === undefined) {
    return { t: "list", ordered, items, src };
  }
  return { t: "list", ordered, items, src, start };
}

function mapItem(node: MdastNode, state: ReadState): MdListItem {
  const blocks = (node.children ?? []).flatMap((child) =>
    mapFlow(child, state),
  );
  const src = nodeSpan(node, state.base);
  if (node.checked === true || node.checked === false) {
    return { blocks, src, checked: node.checked };
  }
  return { blocks, src };
}

function mapCode(node: MdastNode, state: ReadState): MdBlock {
  return {
    t: "code",
    lang: node.lang ?? null,
    code: node.value ?? "",
    src: nodeSpan(node, state.base),
  };
}

function mapTable(node: MdastNode, state: ReadState): MdBlock {
  const rows = (node.children ?? []).map((row) =>
    (row.children ?? []).map((cell) => mapCell(cell, state)),
  );
  const [head, ...body] = rows;
  return {
    t: "table",
    align: (node.align ?? []).map(alignOf),
    head: head ?? [],
    rows: body,
    src: nodeSpan(node, state.base),
  };
}

function mapCell(node: MdastNode, state: ReadState): readonly MdInline[] {
  return mapPhrasingSequence(node.children ?? [], state).map(asInline);
}

function alignOf(value: "left" | "right" | "center" | null): MdTableAlign {
  if (value === "left") {
    return "l";
  }
  if (value === "right") {
    return "r";
  }
  if (value === "center") {
    return "c";
  }
  return null;
}

function mapHtml(node: MdastNode, state: ReadState): MdBlock {
  const src = nodeSpan(node, state.base);
  return toHtmlBlocked(state.source.slice(src.start, src.end), src);
}

function mapFootnote(node: MdastNode, state: ReadState): MdBlock {
  return {
    t: "footnote_def",
    identifier: node.identifier ?? "",
    blocks: (node.children ?? []).flatMap((child) => mapFlow(child, state)),
    src: nodeSpan(node, state.base),
  };
}

export function blockEnd(src: SourceSpan, end: number): SourceSpan {
  return { start: src.start, end: Math.max(src.end, end) };
}

import type { MdContext, MdInline, SourceSpan } from "@oi/contracts";

import { toHtmlBlocked } from "../html-policy.js";
import { cutText, type Piece, type SyntaxCut } from "./cut-text.js";
import type { MdastNode } from "./mdast-node.js";
import { nodeSpan } from "./node-span.js";
import { preferMath } from "./prefer-math.js";

type InlineState = Readonly<{
  source: string;
  context: MdContext;
  base: number;
  cuts: readonly SyntaxCut[];
}>;

export function mapPhrasing(
  node: MdastNode,
  state: InlineState,
): readonly Piece[] {
  switch (node.type) {
    case "text":
      return cutText(
        state.source,
        node.value ?? "",
        nodeSpan(node, state.base),
        state.cuts,
      );
    case "emphasis":
      return [wrap("em", node, state)];
    case "strong":
      return [wrap("strong", node, state)];
    case "delete":
      return [wrap("del", node, state)];
    case "inlineCode":
      return [codePiece(node, state)];
    case "link":
      return [linkPiece(node, state)];
    case "image":
      return [imagePiece(node, state)];
    case "break":
      return [{ t: "br", src: nodeSpan(node, state.base) }];
    case "footnoteReference":
      return [footnotePiece(node, state)];
    case "html":
      return [htmlPiece(node, state)];
    default:
      return [];
  }
}

export function mapPhrasingSequence(
  nodes: readonly MdastNode[],
  state: InlineState,
): readonly Piece[] {
  const pieces = nodes.flatMap((child) => mapPhrasing(child, state));
  return preferMath(pieces, state.source, state.cuts);
}

function childrenOf(node: MdastNode, state: InlineState): readonly MdInline[] {
  return mapPhrasingSequence(node.children ?? [], state).map(asInline);
}

export function asInline(piece: Piece): MdInline {
  if (piece.t !== "lift_math") {
    return piece;
  }
  if (piece.blocked === undefined) {
    return { t: "math", tex: piece.tex, src: piece.src };
  }
  return { t: "math", tex: piece.tex, src: piece.src, blocked: piece.blocked };
}

function wrap(
  tag: "em" | "strong" | "del",
  node: MdastNode,
  state: InlineState,
): MdInline {
  return {
    t: tag,
    c: childrenOf(node, state),
    src: nodeSpan(node, state.base),
  };
}

function codePiece(node: MdastNode, state: InlineState): MdInline {
  return { t: "code", v: node.value ?? "", src: nodeSpan(node, state.base) };
}

function linkPiece(node: MdastNode, state: InlineState): MdInline {
  return {
    t: "link",
    destination: node.url ?? "",
    c: childrenOf(node, state),
    src: nodeSpan(node, state.base),
  };
}

function imagePiece(node: MdastNode, state: InlineState): Piece {
  const src = nodeSpan(node, state.base);
  if (state.context === "translation") {
    return { t: "text", v: state.source.slice(src.start, src.end), src };
  }
  return {
    t: "image",
    image: { alt: node.alt ?? "", destination: node.url ?? "", assetId: null },
    src,
  };
}

function footnotePiece(node: MdastNode, state: InlineState): MdInline {
  return {
    t: "footnote_ref",
    identifier: node.identifier ?? "",
    src: nodeSpan(node, state.base),
  };
}

function htmlPiece(node: MdastNode, state: InlineState): MdInline {
  const src = nodeSpan(node, state.base);
  const raw = state.source.slice(src.start, src.end);
  return toHtmlBlocked(raw, src);
}

export function inlineText(inline: MdInline): string {
  switch (inline.t) {
    case "text":
    case "code":
      return inline.v;
    case "math":
      return inline.tex;
    case "em":
    case "strong":
    case "del":
    case "link":
      return inline.c.map((child) => inlineText(child)).join("");
    default:
      return "";
  }
}

export function pieceSpan(piece: Piece): SourceSpan {
  return piece.src;
}

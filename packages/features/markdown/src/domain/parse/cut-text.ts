import type { MdInline, MdMathBlocked, SourceSpan } from "@oi/contracts";

import { formulaBlocked } from "../math-policy.js";
import type { MathCut } from "./math-syntax.js";
import type { WikiCut } from "./wikilink-syntax.js";

export type SyntaxCut = MathCut | WikiCut;

export type LiftMath = Readonly<{
  t: "lift_math";
  tex: string;
  src: SourceSpan;
  blocked?: MdMathBlocked;
}>;

export type Piece = MdInline | LiftMath;

function texOf(source: string, src: SourceSpan): string {
  const raw = source.slice(src.start, src.end);
  const marker = raw.startsWith("$$") ? 2 : 1;
  return raw.slice(marker, raw.length - marker).trim();
}

function mathPiece(source: string, src: SourceSpan, display: boolean): Piece {
  const tex = texOf(source, src);
  const blocked = formulaBlocked(tex);
  if (display) {
    return blocked === null
      ? { t: "lift_math", tex, src }
      : { t: "lift_math", tex, src, blocked };
  }
  return blocked === null
    ? { t: "math", tex, src }
    : { t: "math", tex, src, blocked };
}

function wikiPiece(cut: WikiCut): MdInline {
  return {
    t: "wikilink",
    target: cut.target,
    embed: cut.embed,
    src: cut.src,
    ...(cut.alias === undefined ? {} : { alias: cut.alias }),
    ...(cut.heading === undefined ? {} : { heading: cut.heading }),
  };
}

function pieceFor(source: string, cut: SyntaxCut): Piece {
  if (cut.kind === "wiki") {
    return wikiPiece(cut);
  }
  return mathPiece(source, cut.src, cut.display);
}

export function cutText(
  source: string,
  value: string,
  src: SourceSpan,
  cuts: readonly SyntaxCut[],
): readonly Piece[] {
  const inside = cuts
    .filter((cut) => cut.src.start >= src.start && cut.src.end <= src.end)
    .sort((left, right) => left.src.start - right.src.start);
  if (inside.length === 0) {
    return [{ t: "text", v: value, src }];
  }
  return splitText(source, src, inside);
}

function splitText(
  source: string,
  src: SourceSpan,
  cuts: readonly SyntaxCut[],
): Piece[] {
  const pieces: Piece[] = [];
  let cursor = src.start;
  for (const cut of cuts) {
    if (cut.src.start < cursor) {
      continue;
    }
    pushText(source, pieces, cursor, cut.src.start);
    pieces.push(pieceFor(source, cut));
    cursor = cut.src.end;
  }
  pushText(source, pieces, cursor, src.end);
  return pieces;
}

function pushText(
  source: string,
  pieces: Piece[],
  start: number,
  end: number,
): void {
  if (end <= start) {
    return;
  }
  pieces.push({
    t: "text",
    v: source.slice(start, end),
    src: { start, end },
  });
}

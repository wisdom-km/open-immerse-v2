import type { SourceSpan } from "@oi/contracts";

import { cutPiece, type Piece, type SyntaxCut } from "./cut-text.js";

function covers(span: SourceSpan, cut: SourceSpan): boolean {
  return span.start <= cut.start && span.end >= cut.end;
}

function overlaps(span: SourceSpan, cut: SourceSpan): boolean {
  return span.start < cut.end && span.end > cut.start;
}

function lastOverlap(
  pieces: readonly Piece[],
  cut: SourceSpan,
  first: number,
): number {
  let last = first;
  while (last + 1 < pieces.length) {
    const next = pieces[last + 1];
    if (!next || !overlaps(next.src, cut)) {
      break;
    }
    last += 1;
  }
  return last;
}

function textGap(source: string, start: number, end: number): readonly Piece[] {
  if (end <= start) {
    return [];
  }
  return [{ t: "text", v: source.slice(start, end), src: { start, end } }];
}

function spliceMath(
  pieces: readonly Piece[],
  source: string,
  cut: Extract<SyntaxCut, { kind: "math" }>,
): readonly Piece[] {
  if (pieces.some((piece) => covers(piece.src, cut.src))) {
    return pieces;
  }
  const first = pieces.findIndex((piece) => overlaps(piece.src, cut.src));
  if (first < 0) {
    return pieces;
  }
  const last = lastOverlap(pieces, cut.src, first);
  const lead = pieces[first];
  const tail = pieces[last];
  if (!lead || !tail) {
    return pieces;
  }
  return [
    ...pieces.slice(0, first),
    ...textGap(source, lead.src.start, cut.src.start),
    cutPiece(source, cut),
    ...textGap(source, cut.src.end, tail.src.end),
    ...pieces.slice(last + 1),
  ];
}

export function preferMath(
  pieces: readonly Piece[],
  source: string,
  cuts: readonly SyntaxCut[],
): readonly Piece[] {
  let current: readonly Piece[] = pieces;
  for (const cut of cuts) {
    if (cut.kind === "math") {
      current = spliceMath(current, source, cut);
    }
  }
  return current;
}

import type { SourceSpan } from "@oi/contracts";

import { rangeCovers } from "./skip-ranges.js";

export type MathCut = Readonly<{
  kind: "math";
  display: boolean;
  src: SourceSpan;
}>;

function isSpace(char: string | undefined): boolean {
  return char === " " || char === "\t" || char === "\n" || char === "\r";
}

function blankInner(source: string, start: number, end: number): boolean {
  return source.slice(start, end).trim().length === 0;
}

function displayClose(
  source: string,
  from: number,
  skipped: readonly SourceSpan[],
): number | null {
  let index = from;
  while (index < source.length - 1) {
    const opener =
      source[index] === "$" &&
      source[index + 1] === "$" &&
      !rangeCovers(index, skipped);
    if (opener) {
      return index;
    }
    index += 1;
  }
  return null;
}

function inlineClose(
  source: string,
  from: number,
  skipped: readonly SourceSpan[],
): number | null {
  const lineEnd = source.indexOf("\n", from);
  const limit = lineEnd === -1 ? source.length : lineEnd;
  let index = from;
  while (index < limit) {
    const closer =
      source[index] === "$" &&
      source[index + 1] !== "$" &&
      !rangeCovers(index, skipped);
    if (closer) {
      return index;
    }
    index += 1;
  }
  return null;
}

export function mathCuts(
  source: string,
  skipped: readonly SourceSpan[],
): readonly MathCut[] {
  const cuts: MathCut[] = [];
  let index = 0;
  while (index < source.length) {
    const next = takeMath(source, index, skipped);
    if (next === null) {
      index += 1;
      continue;
    }
    cuts.push(next.cut);
    index = next.next;
  }
  return cuts;
}

function takeMath(
  source: string,
  index: number,
  skipped: readonly SourceSpan[],
): { cut: MathCut; next: number } | null {
  if (source[index] !== "$" || rangeCovers(index, skipped)) {
    return null;
  }
  if (source[index + 1] === "$") {
    return takeDisplay(source, index, skipped);
  }
  return takeInline(source, index, skipped);
}

function takeDisplay(
  source: string,
  index: number,
  skipped: readonly SourceSpan[],
): { cut: MathCut; next: number } | null {
  const close = displayClose(source, index + 2, skipped);
  if (close === null || blankInner(source, index + 2, close)) {
    return null;
  }
  return {
    cut: {
      kind: "math",
      display: true,
      src: { start: index, end: close + 2 },
    },
    next: close + 2,
  };
}

function takeInline(
  source: string,
  index: number,
  skipped: readonly SourceSpan[],
): { cut: MathCut; next: number } | null {
  const close = inlineClose(source, index + 1, skipped);
  if (close === null || blankInner(source, index + 1, close)) {
    return null;
  }
  return {
    cut: {
      kind: "math",
      display: false,
      src: { start: index, end: close + 1 },
    },
    next: close + 1,
  };
}

export function listOwned(source: string, start: number): boolean {
  let index = start - 1;
  while (index >= 0 && isSpace(source[index])) {
    index -= 1;
  }
  if (index < 0) {
    return false;
  }
  let line = index;
  while (line > 0 && source[line - 1] !== "\n") {
    line -= 1;
  }
  return /^ {0,3}(?:[-+*]|\d+[.)])\s+\S/.test(source.slice(line, index + 1));
}

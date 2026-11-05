import type { SourceSpan } from "@oi/contracts";

function lineStart(source: string, index: number): boolean {
  return index === 0 || source[index - 1] === "\n";
}

function covered(index: number, ranges: readonly SourceSpan[]): boolean {
  return ranges.some((range) => index >= range.start && index < range.end);
}

function fenceOpener(
  source: string,
  index: number,
): { marker: string; count: number } | null {
  let cursor = index;
  let spaces = 0;
  while (source[cursor] === " " && spaces < 3) {
    spaces += 1;
    cursor += 1;
  }
  const marker = source[cursor];
  if (marker !== "`" && marker !== "~") {
    return null;
  }
  let count = 0;
  while (source[cursor + count] === marker) {
    count += 1;
  }
  if (count < 3) {
    return null;
  }
  return { marker, count };
}

function fenceRanges(source: string): SourceSpan[] {
  const ranges: SourceSpan[] = [];
  let index = 0;
  while (index < source.length) {
    const opener = lineStart(source, index) ? fenceOpener(source, index) : null;
    if (opener === null) {
      index += 1;
      continue;
    }
    const close = findFenceClose(source, index, opener.marker, opener.count);
    const end = close ?? source.length;
    ranges.push({ start: index, end });
    index = Math.max(end, index + 1);
  }
  return ranges;
}

function findFenceClose(
  source: string,
  openerIndex: number,
  marker: string,
  count: number,
): number | null {
  let line = source.indexOf("\n", openerIndex);
  if (line === -1) {
    return null;
  }
  line += 1;
  while (line < source.length) {
    if (closesFence(source, line, marker, count)) {
      const next = source.indexOf("\n", line);
      return next === -1 ? source.length : next + 1;
    }
    const next = source.indexOf("\n", line);
    if (next === -1) {
      return null;
    }
    line = next + 1;
  }
  return null;
}

function closesFence(
  source: string,
  line: number,
  marker: string,
  count: number,
): boolean {
  let cursor = line;
  let spaces = 0;
  while (source[cursor] === " " && spaces < 3) {
    spaces += 1;
    cursor += 1;
  }
  let seen = 0;
  while (source[cursor + seen] === marker) {
    seen += 1;
  }
  if (seen < count) {
    return false;
  }
  let end = cursor + seen;
  while (source[end] === " " || source[end] === "\t") {
    end += 1;
  }
  return source[end] === "\n" || end === source.length;
}

function inlineCodeRanges(
  source: string,
  blocked: readonly SourceSpan[],
): SourceSpan[] {
  const ranges: SourceSpan[] = [];
  let index = 0;
  while (index < source.length) {
    if (source[index] !== "`" || covered(index, blocked)) {
      index += 1;
      continue;
    }
    let count = 0;
    while (source[index + count] === "`") {
      count += 1;
    }
    const close = matchingRun(source, index + count, count);
    if (close === null) {
      index += count;
      continue;
    }
    ranges.push({ start: index, end: close + count });
    index = close + count;
  }
  return ranges;
}

function matchingRun(
  source: string,
  from: number,
  count: number,
): number | null {
  const lineEnd = source.indexOf("\n", from);
  const limit = lineEnd === -1 ? source.length : lineEnd;
  let index = from;
  while (index < limit) {
    if (source[index] !== "`") {
      index += 1;
      continue;
    }
    let seen = 0;
    while (source[index + seen] === "`") {
      seen += 1;
    }
    if (seen === count) {
      return index;
    }
    index += seen;
  }
  return null;
}

function destinationEnd(source: string, openParen: number): number | null {
  const next = source[openParen + 1];
  if (next === "<") {
    const close = source.indexOf(">", openParen + 2);
    if (close === -1 || source.slice(openParen + 1, close).includes("\n")) {
      return null;
    }
    return source[close + 1] === ")" ? close + 2 : null;
  }
  let depth = 1;
  let index = openParen + 1;
  while (index < source.length) {
    const char = source[index];
    if (char === "\n") {
      return null;
    }
    if (char === "\\") {
      index += 2;
      continue;
    }
    if (char === "(") {
      depth += 1;
    }
    if (char === ")") {
      depth -= 1;
      if (depth === 0) {
        return index + 1;
      }
    }
    index += 1;
  }
  return null;
}

function destinationRanges(
  source: string,
  blocked: readonly SourceSpan[],
): SourceSpan[] {
  const ranges: SourceSpan[] = [];
  let index = 0;
  while (index < source.length - 1) {
    const opener =
      source[index] === "]" &&
      source[index + 1] === "(" &&
      !covered(index, blocked);
    if (!opener) {
      index += 1;
      continue;
    }
    const end = destinationEnd(source, index + 1);
    if (end === null) {
      index += 2;
      continue;
    }
    ranges.push({ start: index + 2, end: end - 1 });
    index = end;
  }
  return ranges;
}

function urlRanges(
  source: string,
  blocked: readonly SourceSpan[],
): SourceSpan[] {
  const ranges: SourceSpan[] = [];
  let index = 0;
  while (index < source.length) {
    if (covered(index, blocked) || !urlBoundary(source, index)) {
      index += 1;
      continue;
    }
    const end = urlEnd(source, index);
    if (end === null) {
      index += 1;
      continue;
    }
    ranges.push({ start: index, end });
    index = end;
  }
  return ranges;
}

function urlBoundary(source: string, index: number): boolean {
  if (index === 0) {
    return true;
  }
  const prev = source[index - 1] ?? "";
  return /\s/.test(prev);
}

function urlEnd(source: string, index: number): number | null {
  const rest = source.slice(index);
  const angled = /^<(?:https?:\/\/|mailto:)[^\s>]+>/.exec(rest);
  if (angled) {
    return index + angled[0].length;
  }
  const bare = /^(?:https?:\/\/|mailto:)[^\s<]+/.exec(rest);
  if (!bare) {
    return null;
  }
  return index + bare[0].length;
}

export function skipRanges(source: string): readonly SourceSpan[] {
  const fences = fenceRanges(source);
  const code = inlineCodeRanges(source, fences);
  const destinations = destinationRanges(source, [...fences, ...code]);
  const urls = urlRanges(source, [...fences, ...code, ...destinations]);
  return [...fences, ...code, ...destinations, ...urls];
}

export function rangeCovers(
  index: number,
  ranges: readonly SourceSpan[],
): boolean {
  return covered(index, ranges);
}

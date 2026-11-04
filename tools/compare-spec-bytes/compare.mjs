import { spawnSync } from "node:child_process";
import { Buffer } from "node:buffer";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

// #125（dd0630bd）的父提交。拆分前的三份规格在这一笔。
// be998cc 是再上一笔（#122），不是 #125 的父提交；三份文件字节相同。
// Issue #128 在 be998cc 上记过 13/13。默认不再跟 origin/main。
export const splitBaseline = "f8d5d01dc8af81b73689c7229c983192551fa6fe";

export function stripSplitHeader(bytes, startMark, endMark) {
  const start = Buffer.from(`${startMark}\n`, "utf8");
  if (
    bytes.length < start.length ||
    !bytes.subarray(0, start.length).equals(start)
  ) {
    return bytes;
  }
  const end = Buffer.from(`${endMark}\n`, "utf8");
  const at = bytes.indexOf(end);
  if (at < start.length) {
    throw new Error("split header end marker missing");
  }
  return bytes.subarray(at + end.length);
}

export function joinParts(parts, startMark, endMark) {
  return Buffer.concat(
    parts.map((part) => stripSplitHeader(part, startMark, endMark)),
  );
}

export function firstMismatch(actual, expected) {
  const n = Math.min(actual.length, expected.length);
  for (let i = 0; i < n; i += 1) {
    if (actual[i] !== expected[i]) {
      return i;
    }
  }
  return actual.length === expected.length ? -1 : n;
}

function once(bytes, needle, label) {
  const first = bytes.indexOf(needle);
  if (first < 0) {
    throw new Error(`${label} missing`);
  }
  if (bytes.indexOf(needle, first + needle.length) >= 0) {
    throw new Error(`${label} is not unique`);
  }
  return first;
}

export function sliceOnce(bytes, startText, endText) {
  const start = Buffer.from(startText, "utf8");
  const end = Buffer.from(endText, "utf8");
  const at = once(bytes, start, "span start");
  const stop = once(bytes, end, "span end");
  if (stop < at) {
    throw new Error("span end is before start");
  }
  return bytes.subarray(at, stop + end.length);
}

export function markedBody(bytes, startMark, endMark, bodyEnd) {
  const open = Buffer.from(`${startMark}\n`, "utf8");
  const opened = once(bytes, open, "split header start marker");
  const headerEnd = Buffer.from(`${endMark}\n`, "utf8");
  const at = bytes.indexOf(headerEnd, opened + open.length);
  if (at < 0) {
    throw new Error("split header end marker missing");
  }
  const from = at + headerEnd.length;
  const closer = Buffer.from(bodyEnd, "utf8");
  const end = once(bytes.subarray(from), closer, "split body end marker");
  return bytes.subarray(from, from + end);
}

function assertSafe(rel) {
  const pieces = rel.split("/");
  if (rel.startsWith("/") || rel.includes("\\") || pieces.includes("..")) {
    throw new Error(`refusing path ${rel}`);
  }
}

function readManifest(text) {
  const data = JSON.parse(text);
  if (
    typeof data.headerStart !== "string" ||
    typeof data.headerEnd !== "string" ||
    data.headerStart.includes("\n") ||
    data.headerEnd.includes("\n") ||
    !Array.isArray(data.sources) ||
    data.sources.length === 0
  ) {
    throw new Error("manifest is incomplete");
  }
  return data;
}

function sourceParts(source) {
  if (typeof source?.path !== "string" || !Array.isArray(source.parts)) {
    throw new Error("manifest source is incomplete");
  }
  assertSafe(source.path);
  if (source.parts.length === 0) {
    throw new Error(`manifest has no parts for ${source.path}`);
  }
  for (const part of source.parts) {
    if (typeof part !== "string") {
      throw new Error("part path is not a string");
    }
    assertSafe(part);
  }
  return source;
}

function gitBytes(root, spec) {
  const result = spawnSync("git", ["-C", root, "show", spec], {
    maxBuffer: 32 * 1024 * 1024,
  });
  if (result.status !== 0) {
    const err = result.stderr?.toString("utf8") ?? "";
    throw new Error(err.trim() || `git show failed for ${spec}`);
  }
  return result.stdout;
}

function option(argv, name, fallback) {
  const index = argv.indexOf(name);
  if (index === -1) {
    return fallback;
  }
  const value = argv[index + 1];
  if (!value || value.startsWith("--")) {
    throw new Error(`missing value for ${name}`);
  }
  return value;
}

function spanList(manifest) {
  if (manifest.spans === undefined) {
    return [];
  }
  if (!Array.isArray(manifest.spans)) {
    throw new Error("manifest spans are incomplete");
  }
  return manifest.spans;
}

function spanEntry(span) {
  if (
    typeof span?.path !== "string" ||
    typeof span?.file !== "string" ||
    typeof span?.start !== "string" ||
    typeof span?.end !== "string" ||
    typeof span?.bodyEnd !== "string" ||
    span.bodyEnd.includes("\n")
  ) {
    throw new Error("manifest span is incomplete");
  }
  assertSafe(span.path);
  assertSafe(span.file);
  return span;
}

function fenceMark(line) {
  const match = /^( {0,3})(`{3,}|~{3,})(.*)$/.exec(line);
  if (!match) {
    return null;
  }
  return { char: match[2][0], size: match[2].length, info: match[3] };
}

function fenceRanges(text) {
  const ranges = [];
  let offset = 0;
  let open = null;
  let openAt = 0;
  for (const line of text.split("\n")) {
    const mark = fenceMark(line);
    const lineEnd = offset + line.length;
    if (open && mark && mark.char === open.char && mark.size >= open.size) {
      if (mark.info.trim() === "") {
        ranges.push([openAt, lineEnd]);
        open = null;
      }
    } else if (!open && mark) {
      open = mark;
      openAt = offset;
    }
    offset = lineEnd + 1;
  }
  if (open) {
    ranges.push([openAt, text.length]);
  }
  return ranges;
}

function inRange(index, ranges) {
  return ranges.some(([start, end]) => index >= start && index < end);
}

function codeRanges(text) {
  const fences = fenceRanges(text);
  const ranges = [...fences];
  for (const match of text.matchAll(/`+[^`\n]*`+/g)) {
    if (!inRange(match.index, fences)) {
      ranges.push([match.index, match.index + match[0].length]);
    }
  }
  return ranges;
}

function readDestSpan(text, openParen) {
  if (text[openParen + 1] === "<") {
    return bracketDest(text, openParen);
  }
  let depth = 1;
  let i = openParen + 1;
  while (i < text.length && depth > 0) {
    if (text[i] === "(") {
      depth += 1;
    } else if (text[i] === ")") {
      depth -= 1;
    }
    if (depth > 0) {
      i += 1;
    }
  }
  if (depth !== 0) {
    return null;
  }
  return plainDest(text, openParen + 1, i);
}

function bracketDest(text, openParen) {
  const close = text.indexOf(">", openParen + 2);
  const end = close < 0 ? -1 : text.indexOf(")", close + 1);
  if (end < 0) {
    return null;
  }
  return {
    destStart: openParen + 2,
    destEnd: close,
    dest: text.slice(openParen + 2, close).trim(),
    next: end + 1,
  };
}

function plainDest(text, rawStart, rawEnd) {
  const raw = text.slice(rawStart, rawEnd);
  const title = raw.search(/\s+["']/);
  const dest = (title >= 0 ? raw.slice(0, title) : raw).trim();
  if (dest.length === 0 || dest.includes("\n")) {
    return { destStart: rawStart, destEnd: rawEnd, dest: "", next: rawEnd + 1 };
  }
  const lead = raw.indexOf(dest);
  return {
    destStart: rawStart + lead,
    destEnd: rawStart + lead + dest.length,
    dest,
    next: rawEnd + 1,
  };
}

export function linkDestSpans(text) {
  const ranges = codeRanges(text);
  const found = [];
  let i = 0;
  while (i < text.length) {
    const at = text.indexOf("](", i);
    if (at < 0) {
      break;
    }
    if (inRange(at, ranges)) {
      i = at + 2;
      continue;
    }
    const read = readDestSpan(text, at + 1);
    if (!read) {
      break;
    }
    if (read.dest.length > 0) {
      found.push(read);
    }
    i = read.next;
  }
  return found;
}

function splitDest(dest) {
  const hash = dest.indexOf("#");
  if (hash < 0) {
    return { path: dest, frag: "" };
  }
  return { path: dest.slice(0, hash), frag: dest.slice(hash) };
}

export function prefixChange(oldDest, newDest) {
  if (oldDest === newDest) {
    return { kind: "same" };
  }
  const oldPart = splitDest(oldDest);
  const newPart = splitDest(newDest);
  if (oldPart.frag !== newPart.frag || !oldPart.path.startsWith("./")) {
    return { kind: "blocked" };
  }
  const body = oldPart.path.slice(2);
  const prefix = newPart.path.slice(0, newPart.path.length - body.length);
  const prefixed =
    body.length > 0 &&
    !body.startsWith("/") &&
    newPart.path === `${prefix}${body}` &&
    /^(\.\.\/)+$/.test(prefix);
  if (!prefixed) {
    return { kind: "blocked" };
  }
  return { kind: "rewrite", old: oldDest, new: newDest };
}

function byteAt(text, index) {
  return Buffer.byteLength(text.slice(0, index), "utf8");
}

function gapMismatch(
  actual,
  expected,
  fromActual,
  fromExpected,
  endActual,
  endExpected,
) {
  const gapActual = actual.slice(fromActual, endActual);
  const gapExpected = expected.slice(fromExpected, endExpected);
  if (gapActual === gapExpected) {
    return -1;
  }
  const n = Math.min(gapActual.length, gapExpected.length);
  for (let i = 0; i < n; i += 1) {
    if (gapActual[i] !== gapExpected[i]) {
      return byteAt(actual, fromActual + i);
    }
  }
  return byteAt(actual, fromActual + n);
}

export function restoredRewrites(actual, expected) {
  const left = linkDestSpans(actual);
  const right = linkDestSpans(expected);
  if (left.length !== right.length) {
    return { ok: false, at: 0, rewrites: [] };
  }
  const rewrites = [];
  let fromActual = 0;
  let fromExpected = 0;
  for (let i = 0; i < left.length; i += 1) {
    const at = gapMismatch(
      actual,
      expected,
      fromActual,
      fromExpected,
      left[i].destStart,
      right[i].destStart,
    );
    if (at >= 0) {
      return { ok: false, at, rewrites: [] };
    }
    const change = prefixChange(right[i].dest, left[i].dest);
    if (change.kind === "blocked") {
      return { ok: false, at: byteAt(actual, left[i].destStart), rewrites: [] };
    }
    if (change.kind === "rewrite") {
      rewrites.push({
        index: left[i].destStart,
        old: change.old,
        new: change.new,
      });
    }
    fromActual = left[i].destEnd;
    fromExpected = right[i].destEnd;
  }
  const tail = gapMismatch(
    actual,
    expected,
    fromActual,
    fromExpected,
    actual.length,
    expected.length,
  );
  if (tail >= 0) {
    return { ok: false, at: tail, rewrites: [] };
  }
  return { ok: true, rewrites };
}

function bodyOf(fileText, manifest) {
  return stripSplitHeader(
    Buffer.from(fileText, "utf8"),
    manifest.headerStart,
    manifest.headerEnd,
  ).toString("utf8");
}

function readPiece(root, rel, manifest) {
  const fileText = readFileSync(path.join(root, rel), "utf8");
  const body = bodyOf(fileText, manifest);
  const bodyAt = fileText.indexOf(body);
  if (bodyAt < 0) {
    throw new Error(`body missing in ${rel}`);
  }
  return { rel, fileText, body, bodyAt };
}

function rewriteLine(piece, item, bodyStart) {
  const fileOffset = piece.bodyAt + (item.index - bodyStart);
  const line = piece.fileText.slice(0, fileOffset).split("\n").length;
  return `${piece.rel}:${line} ${item.old} → ${item.new}`;
}

function linesFor(pieces, rewrites) {
  const lines = [];
  let start = 0;
  for (const piece of pieces) {
    const end = start + piece.body.length;
    for (const item of rewrites) {
      if (item.index >= start && item.index < end) {
        lines.push(rewriteLine(piece, item, start));
      }
    }
    start = end;
  }
  return lines;
}

function judgedLine(label, detail, actual, expected) {
  const judged = restoredRewrites(actual, expected);
  if (!judged.ok) {
    return { failure: `${label} differs at byte ${judged.at}`, rewrites: [] };
  }
  return {
    failure: "",
    line: `compare-spec-bytes: ${label} ${detail} (${Buffer.byteLength(expected, "utf8")} bytes)`,
    rewrites: judged.rewrites,
  };
}

function compareSpan(root, manifest, base, span) {
  const checked = spanEntry(span);
  const origin = gitBytes(root, `${base}:${checked.path}`).toString("utf8");
  const expected = sliceOnce(
    Buffer.from(origin, "utf8"),
    checked.start,
    checked.end,
  ).toString("utf8");
  const fileText = readFileSync(path.join(root, checked.file), "utf8");
  const actual = markedBody(
    Buffer.from(fileText, "utf8"),
    manifest.headerStart,
    manifest.headerEnd,
    checked.bodyEnd,
  ).toString("utf8");
  const judged = judgedLine(
    `${checked.path} span`,
    `matches ${base}`,
    actual,
    expected,
  );
  if (judged.failure) {
    return judged;
  }
  const bodyAt = fileText.indexOf(actual);
  const piece = { rel: checked.file, fileText, body: actual, bodyAt };
  return { ...judged, rewrites: linesFor([piece], judged.rewrites) };
}

export function applyAmendments(text, items) {
  const list = Array.isArray(items) ? items : [];
  let next = text;
  for (const item of list) {
    if (
      typeof item?.old !== "string" ||
      typeof item?.new !== "string" ||
      item.old.length === 0
    ) {
      throw new Error("amendment is incomplete");
    }
    const first = next.indexOf(item.old);
    if (first < 0) {
      throw new Error("amendment text missing");
    }
    if (next.indexOf(item.old, first + item.old.length) >= 0) {
      throw new Error("amendment text is not unique");
    }
    next = `${next.slice(0, first)}${item.new}${next.slice(
      first + item.old.length,
    )}`;
  }
  return next;
}

function sourceAmendments(manifest, sourcePath) {
  const items = manifest.amendments;
  if (!Array.isArray(items)) {
    return [];
  }
  return items.filter((item) => item.source === sourcePath);
}

function compareSource(root, manifest, base, source) {
  const checked = sourceParts(source);
  const pieces = checked.parts.map((rel) => readPiece(root, rel, manifest));
  const actual = pieces.map((piece) => piece.body).join("");
  const expected = applyAmendments(
    gitBytes(root, `${base}:${checked.path}`).toString("utf8"),
    sourceAmendments(manifest, checked.path),
  );
  const judged = judgedLine(
    checked.path,
    `${checked.parts.length} parts match ${base}`,
    actual,
    expected,
  );
  if (judged.failure) {
    return judged;
  }
  return { ...judged, rewrites: linesFor(pieces, judged.rewrites) };
}

function emit(results, rewritesPath) {
  const failures = [];
  const rewrites = [];
  for (const result of results) {
    if (result.failure) {
      failures.push(result.failure);
      continue;
    }
    console.log(result.line);
    rewrites.push(...result.rewrites);
  }
  if (failures.length > 0) {
    for (const line of failures) {
      console.error(`compare-spec-bytes: ${line}`);
    }
    process.exitCode = 1;
    return;
  }
  console.log(`compare-spec-bytes: ${rewrites.length} path prefixes`);
  if (rewritesPath) {
    const text = rewrites.length === 0 ? "" : `${rewrites.join("\n")}\n`;
    writeFileSync(rewritesPath, text);
  }
}

function main(argv) {
  const root = path.resolve(option(argv, "--root", process.cwd()));
  const base = option(argv, "--base", splitBaseline);
  const manifestPath = path.resolve(
    option(
      argv,
      "--manifest",
      path.join(root, "tools/compare-spec-bytes/manifest.json"),
    ),
  );
  const rewritesArg = option(argv, "--rewrites", "");
  const manifest = readManifest(readFileSync(manifestPath, "utf8"));
  const results = [
    ...manifest.sources.map((source) =>
      compareSource(root, manifest, base, source),
    ),
    ...spanList(manifest).map((span) =>
      compareSpan(root, manifest, base, span),
    ),
  ];
  emit(results, rewritesArg ? path.resolve(root, rewritesArg) : "");
}

const invoked = process.argv[1];
if (invoked && import.meta.url === pathToFileURL(invoked).href) {
  try {
    main(process.argv.slice(2));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`compare-spec-bytes: ${message}`);
    process.exitCode = 1;
  }
}

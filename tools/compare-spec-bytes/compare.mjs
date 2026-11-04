import { spawnSync } from "node:child_process";
import { Buffer } from "node:buffer";
import { readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

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

function compareSpan(root, manifest, base, span) {
  const checked = spanEntry(span);
  const origin = gitBytes(root, `${base}:${checked.path}`);
  const expected = sliceOnce(origin, checked.start, checked.end);
  const actual = markedBody(
    readFileSync(path.join(root, checked.file)),
    manifest.headerStart,
    manifest.headerEnd,
    checked.bodyEnd,
  );
  const at = firstMismatch(actual, expected);
  if (at >= 0) {
    return `${checked.path} span differs at byte ${at}`;
  }
  return `compare-spec-bytes: ${checked.path} span matches ${base} (${actual.length} bytes)`;
}

function compareSource(root, manifest, base, source) {
  const checked = sourceParts(source);
  const parts = checked.parts.map((rel) => readFileSync(path.join(root, rel)));
  const actual = joinParts(parts, manifest.headerStart, manifest.headerEnd);
  const expected = gitBytes(root, `${base}:${checked.path}`);
  const at = firstMismatch(actual, expected);
  if (at >= 0) {
    return `${checked.path} differs at byte ${at}`;
  }
  return `compare-spec-bytes: ${checked.path} ${checked.parts.length} parts match ${base} (${actual.length} bytes)`;
}

function main(argv) {
  const root = path.resolve(option(argv, "--root", process.cwd()));
  const base = option(argv, "--base", "origin/main");
  const manifestPath = path.resolve(
    option(
      argv,
      "--manifest",
      path.join(root, "tools/compare-spec-bytes/manifest.json"),
    ),
  );
  const manifest = readManifest(readFileSync(manifestPath, "utf8"));
  const failures = [];
  const lines = [
    ...manifest.sources.map((source) =>
      compareSource(root, manifest, base, source),
    ),
    ...spanList(manifest).map((span) =>
      compareSpan(root, manifest, base, span),
    ),
  ];
  for (const line of lines) {
    if (line.startsWith("compare-spec-bytes:")) {
      console.log(line);
    } else {
      failures.push(line);
    }
  }
  if (failures.length > 0) {
    for (const line of failures) {
      console.error(`compare-spec-bytes: ${line}`);
    }
    process.exitCode = 1;
  }
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

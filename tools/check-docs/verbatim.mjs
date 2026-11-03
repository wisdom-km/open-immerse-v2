import path from "node:path";

import { readBytes, readText } from "./read-text.mjs";

function manifestFinding(detail) {
  return { kind: "verbatim-manifest", file: "verbatim.json", detail };
}

function loadManifest(manifestPath) {
  let parsed;
  try {
    parsed = JSON.parse(readText(manifestPath));
  } catch {
    return { error: manifestFinding("manifest 读失败") };
  }
  if (!parsed || !Array.isArray(parsed.pairs)) {
    return { error: manifestFinding("pairs 不是数组") };
  }
  return { pairs: parsed.pairs };
}

function loadFile(root, rel) {
  try {
    return readBytes(path.join(root, rel));
  } catch {
    return null;
  }
}

function between(text, start, end) {
  if (typeof start !== "string" || typeof end !== "string") {
    return null;
  }
  const lines = text.split(/\r?\n/);
  const from = lines.indexOf(start);
  const to = lines.indexOf(end);
  if (from < 0 || to < 0 || to <= from) {
    return null;
  }
  return lines.slice(from + 1, to).join("\n");
}

function compareMarked(pair, left, right) {
  const a = between(left.toString("utf8"), pair.start, pair.end);
  const b = between(right.toString("utf8"), pair.start, pair.end);
  if (a == null || b == null) {
    return { kind: "verbatim-marker", file: pair.left, detail: pair.right };
  }
  if (a !== b) {
    return { kind: "verbatim-mismatch", file: pair.left, detail: pair.right };
  }
  return null;
}

function comparePair(root, pair) {
  if (
    !pair ||
    typeof pair.left !== "string" ||
    typeof pair.right !== "string"
  ) {
    return manifestFinding("pair 缺路径");
  }
  const left = loadFile(root, pair.left);
  const right = loadFile(root, pair.right);
  if (!left || !right) {
    return manifestFinding("文件不存在");
  }
  if (pair.start || pair.end) {
    return compareMarked(pair, left, right);
  }
  if (!left.equals(right)) {
    return { kind: "verbatim-mismatch", file: pair.left, detail: pair.right };
  }
  return null;
}

export function verbatimFindings(root, manifestPath) {
  const loaded = loadManifest(manifestPath);
  if (loaded.error) {
    return [loaded.error];
  }
  const out = [];
  for (const pair of loaded.pairs) {
    const found = comparePair(root, pair);
    if (found) {
      out.push(found);
    }
  }
  return out;
}

import { Buffer } from "node:buffer";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { expect, it } from "vitest";

import {
  firstMismatch,
  joinParts,
  markedBody,
  prefixChange,
  restoredRewrites,
  sliceOnce,
  splitBaseline,
  stripSplitHeader,
} from "./compare.mjs";

const startMark = "<!-- oi-split-header -->";
const endMark = "<!-- /oi-split-header -->";
const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

function header(label: string) {
  return Buffer.from(`${startMark}\n${label}\n${endMark}\n`, "utf8");
}

function commitExists(sha: string): boolean {
  const present = spawnSync("git", [
    "-C",
    root,
    "cat-file",
    "-e",
    `${sha}^{commit}`,
  ]);
  return present.status === 0;
}

function ensureSplitBaseline(sha: string): void {
  if (commitExists(sha)) {
    return;
  }
  const fetched = spawnSync(
    "git",
    ["-C", root, "fetch", "--depth=1", "origin", sha],
    { stdio: "ignore" },
  );
  if (fetched.status !== 0 || !commitExists(sha)) {
    throw new Error(`git fetch failed for ${sha}`);
  }
}

function originMainPresent(): boolean {
  const present = spawnSync(
    "git",
    [
      "-C",
      root,
      "rev-parse",
      "--verify",
      "--quiet",
      "refs/remotes/origin/main",
    ],
    { stdio: "ignore" },
  );
  return present.status === 0;
}

function ensureOriginMain(): void {
  if (originMainPresent()) {
    return;
  }
  const fetched = spawnSync(
    "git",
    [
      "-C",
      root,
      "fetch",
      "--depth=1",
      "origin",
      "main:refs/remotes/origin/main",
    ],
    { stdio: "ignore" },
  );
  if (fetched.status !== 0 || !originMainPresent()) {
    throw new Error("git fetch failed for origin/main");
  }
}

const slugScript = `
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { headingSlugs } from "./tools/check-docs/slug.mjs";

function origin(file) {
  const result = spawnSync("git", ["show", "origin/main:" + file]);
  if (result.status !== 0) {
    throw new Error(result.stderr.toString("utf8"));
  }
  return result.stdout.toString("utf8");
}

for (const file of ["PRD.md", "ARCHITECTURE.md"]) {
  const left = headingSlugs(readFileSync(file, "utf8")).join("\\n");
  const right = headingSlugs(origin(file)).join("\\n");
  if (left !== right) {
    console.error(file);
    console.error(left);
    console.error("---");
    console.error(right);
    process.exit(1);
  }
}
`;

it("returns the same bytes when the file has no header", () => {
  const bytes = Buffer.from("alpha\n", "utf8");
  const stripped = stripSplitHeader(bytes, startMark, endMark);
  expect(stripped.equals(bytes)).toBe(true);
});

it("drops the header when the end marker is present", () => {
  const body = Buffer.from("正文\n", "utf8");
  const file = Buffer.concat([header("状态：现行。"), body]);
  const stripped = stripSplitHeader(file, startMark, endMark);
  expect(stripped.equals(body)).toBe(true);
});

it("throws when the header end marker is missing", () => {
  const bytes = Buffer.from(`${startMark}\nno end\n`, "utf8");
  expect(() => stripSplitHeader(bytes, startMark, endMark)).toThrow(
    /end marker/,
  );
});

it("joins slices to the original bytes when headers are removed", () => {
  const origin = Buffer.from("alpha\nbeta\n", "utf8");
  const left = Buffer.concat([header("a"), origin.subarray(0, 6)]);
  const right = Buffer.concat([header("b"), origin.subarray(6)]);
  expect(joinParts([left, right], startMark, endMark).equals(origin)).toBe(
    true,
  );
});

it("returns the marked body when the closer follows the header", () => {
  const body = Buffer.from("Q1原文。", "utf8");
  const closer = "<!-- /oi-split-body -->";
  const file = Buffer.concat([
    header("状态：现行。"),
    body,
    Buffer.from(closer, "utf8"),
  ]);
  expect(markedBody(file, startMark, endMark, closer).equals(body)).toBe(true);
});

it("cuts one span when both edges occur once", () => {
  const bytes = Buffer.from("aaSTARTmiddleENDzz", "utf8");
  expect(sliceOnce(bytes, "START", "END").toString("utf8")).toBe(
    "STARTmiddleEND",
  );
});

it("throws when the span edge occurs twice", () => {
  const bytes = Buffer.from("START a START", "utf8");
  expect(() => sliceOnce(bytes, "START", "END")).toThrow(/not unique/);
});

it("accepts a relative path prefix and nothing else", () => {
  const expected = "见 [甲](./docs/a.md) 与 [乙](./b.md#x)。";
  const actual = "见 [甲](../../docs/a.md) 与 [乙](../../b.md#x)。";
  const judged = restoredRewrites(actual, expected);
  expect(judged.ok).toBe(true);
  expect(judged.rewrites.map((item) => `${item.old} → ${item.new}`)).toEqual([
    "./docs/a.md → ../../docs/a.md",
    "./b.md#x → ../../b.md#x",
  ]);
  expect(prefixChange("./a.md", "../../b.md").kind).toBe("blocked");
  const renamed = restoredRewrites(
    "见 [甲](../../b.md)。",
    "见 [甲](./a.md)。",
  );
  expect(renamed.ok).toBe(false);
  const prose = restoredRewrites(
    "改了正文 [甲](./a.md)。",
    "见 [甲](./a.md)。",
  );
  expect(prose.ok).toBe(false);
});

it("returns the first differing byte when a slice changes", () => {
  const origin = Buffer.from("alpha\nbeta\n", "utf8");
  const changed = Buffer.from("alpha\nBETA\n", "utf8");
  expect(firstMismatch(changed, origin)).toBe(6);
  expect(firstMismatch(origin, origin)).toBe(-1);
});

it("matches origin/main when the chapter files are joined", () => {
  ensureSplitBaseline(splitBaseline);
  const result = spawnSync(
    process.execPath,
    [path.join(root, "tools/compare-spec-bytes/compare.mjs")],
    { encoding: "utf8", cwd: root },
  );
  expect({
    status: result.status,
    stderr: result.stderr,
    stdout: result.stdout,
  }).toMatchObject({ status: 0 });
  expect(result.stdout).toContain("PRD.md");
  expect(result.stdout).toContain("ARCHITECTURE.md");
  expect(result.stdout).toContain(`match ${splitBaseline}`);
  expect(result.stdout).toContain("RULES.md span");
  expect(result.stdout).toContain("path prefixes");
});

it("writes the same prefix manifest that evidence keeps", () => {
  ensureSplitBaseline(splitBaseline);
  const out = "/tmp/oi-link-rewrites.txt";
  const result = spawnSync(
    process.execPath,
    [
      path.join(root, "tools/compare-spec-bytes/compare.mjs"),
      "--rewrites",
      out,
    ],
    { encoding: "utf8", cwd: root },
  );
  expect(result.status).toBe(0);
  const fresh = readFileSync(out, "utf8");
  const kept = readFileSync(
    path.join(root, "docs/evidence/125/link-rewrites.txt"),
    "utf8",
  );
  expect(fresh).toBe(kept);
  expect(fresh.trim().split("\n")).toHaveLength(68);
});

it("keeps root heading slugs identical to origin/main", () => {
  ensureOriginMain();
  const result = spawnSync(
    process.execPath,
    ["--input-type=module", "-e", slugScript],
    { encoding: "utf8", cwd: root },
  );
  expect({
    status: result.status,
    stderr: result.stderr,
    stdout: result.stdout,
  }).toMatchObject({ status: 0 });
});

const linkScript = `
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { linkFindings } from "./tools/check-docs/links.mjs";
import { statusFindings } from "./tools/check-docs/status.mjs";

function listed(args) {
  const result = spawnSync("git", args, { encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(result.stderr);
  }
  return result.stdout.split("\\0").filter(Boolean);
}

const files = [...new Set([
  ...listed(["ls-files", "-z", "--", "*.md"]),
  ...listed(["ls-files", "-z", "--others", "--exclude-standard", "--", "*.md"]),
])].filter((file) => !file.startsWith("tools/check-docs/fixtures/")).sort();
const read = (rel) => readFileSync(rel, "utf8");
const found = linkFindings(files, process.cwd(), read);
const missingFile = found.filter((item) => item.kind === "missing-file");
const anchors = found.filter((item) => item.kind === "missing-anchor");
const status = statusFindings(files, read).filter(
  (item) => item.kind === "status-line-missing" && item.file.startsWith("docs/prd/"),
);
if (missingFile.length > 0 || anchors.length > 0 || status.length > 0) {
  console.error(JSON.stringify({ missingFile, anchors, status }, null, 2));
  process.exit(1);
}
console.log("links 0");
console.log("anchors " + String(anchors.length));
`;

it("reports no broken link when tracked and new markdown are checked", () => {
  const result = spawnSync(
    process.execPath,
    ["--input-type=module", "-e", linkScript],
    { encoding: "utf8", cwd: root },
  );
  expect({
    status: result.status,
    stderr: result.stderr,
    stdout: result.stdout,
  }).toMatchObject({ status: 0 });
  expect(result.stdout).toContain("links 0");
  expect(result.stdout).toContain("anchors 0");
});

import { spawnSync } from "node:child_process";

import { writeRemediation } from "../gate-remediation/format.mjs";

const namedHotspots = new Set(["composition-root.ts", "slots.ts"]);
const lineLimit = 30;

function option(name, fallback) {
  const index = process.argv.indexOf(name);
  if (index !== -1) {
    return process.argv[index + 1];
  }
  return process.env.GATE_BASE ?? fallback;
}

function git(args) {
  const result = spawnSync("git", args, { encoding: "utf8" });
  if (result.status !== 0) {
    process.stderr.write(result.stderr ?? "");
    process.exit(result.status === null ? 1 : result.status);
  }
  return result.stdout;
}

function changedFiles(base) {
  return git(["diff", "--name-only", `${base}...HEAD`]).split("\n").filter(Boolean);
}

function changedLines(base, file) {
  const text = git(["diff", "--numstat", `${base}...HEAD`, "--", file]);
  const first = text.split("\n").find(Boolean);
  if (!first) {
    return 0;
  }
  const [added, deleted] = first.split("\t");
  const add = added === "-" ? 0 : Number(added);
  const del = deleted === "-" ? 0 : Number(deleted);
  return add + del;
}

function basename(file) {
  return file.split("/").at(-1) ?? file;
}

const base = option("--base", "main");
const files = changedFiles(base);
const failures = [];
for (const file of files) {
  if (!namedHotspots.has(basename(file))) {
    continue;
  }
  const lines = changedLines(base, file);
  if (lines > lineLimit) {
    failures.push(`${file}: ${lines} lines > ${lineLimit}`);
  }
}

if (failures.length > 0) {
  console.error("check-hotspots: hotspot diff exceeds 30 lines (G11)");
  for (const line of failures) {
    console.error(`  ${line}`);
  }
  writeRemediation(["G11"]);
  process.exit(1);
}

console.log("check-hotspots: named hotspot diffs are within 30 lines");

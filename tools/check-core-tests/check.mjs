import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import { writeRemediation } from "../gate-remediation/format.mjs";

function option(name, fallback) {
  const index = process.argv.indexOf(name);
  return index === -1 ? fallback : process.argv[index + 1];
}

async function walk(directory, found) {
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await walk(fullPath, found);
      continue;
    }
    if (entry.isFile() && entry.name.endsWith(".ts")) {
      found.push(fullPath);
    }
  }
}

const root = path.resolve(option("--root", process.cwd()));
const features = path.join(root, "packages/features");
if (!existsSync(features)) {
  console.log("check-core-tests: no packages/features; nothing to scan");
  process.exit(0);
}

const files = [];
await walk(features, files);
const failures = [];
for (const file of files) {
  const rel = path.relative(root, file).split(path.sep).join("/");
  if (!/\/test\/core\//.test(rel)) {
    continue;
  }
  const text = await readFile(file, "utf8");
  if (text.includes("@vitest-environment")) {
    failures.push(rel);
  }
}

if (failures.length > 0) {
  console.error("check-core-tests: @vitest-environment is forbidden (G16)");
  for (const line of failures) {
    console.error(`  ${line}`);
  }
  writeRemediation(["G16"]);
  process.exit(1);
}

console.log("check-core-tests: core tests stay on the node project");

import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

import { licenseAllowed } from "./policy.mjs";

function option(name, fallback) {
  const index = process.argv.indexOf(name);
  return index === -1 ? fallback : process.argv[index + 1];
}

const lockfile = option("--lockfile", "workers/parser/uv.lock");

function assertPdfPin() {
  const text = readFileSync(lockfile, "utf8");
  if (/^name = "(pymupdf|pymupdf-fonts|fitz)"$/m.test(text)) {
    console.error("check-license: PyMuPDF is AGPL and must not be locked");
    process.exit(1);
  }
  if (!/^name = "pypdfium2"$/m.test(text)) {
    console.error("check-license: uv.lock must contain pypdfium2");
    process.exit(1);
  }
}

function pipReport(argv) {
  const fromJson = argv.indexOf("--from-json");
  if (fromJson !== -1) {
    return JSON.parse(readFileSync(argv[fromJson + 1], "utf8"));
  }
  const result = spawnSync(
    "uv",
    ["run", "--frozen", "--extra", "dev", "pip-licenses", "--with-system", "--format=json"],
    { cwd: "workers/parser", encoding: "utf8" },
  );
  if (result.error) {
    console.error(`check-license: ${result.error.message}`);
    process.exit(1);
  }
  if (result.status !== 0) {
    process.stderr.write(result.stderr ?? "");
    process.exit(result.status ?? 1);
  }
  return JSON.parse(result.stdout);
}

const skipLock = process.argv.includes("--from-json") && !process.argv.includes("--lockfile");
if (!skipLock) {
  assertPdfPin();
}

const failures = [];
for (const item of pipReport(process.argv)) {
  if (!licenseAllowed(item.Name, String(item.License))) {
    failures.push(`${item.Name}: ${item.License}`);
  }
}

if (failures.length > 0) {
  console.error("check-license: pip license rejected (G10, RULES §1.5)");
  for (const line of failures) {
    console.error(`  ${line}`);
  }
  process.exit(1);
}

console.log("check-license: pip licenses accepted");

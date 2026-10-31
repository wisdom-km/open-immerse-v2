import { spawnSync } from "node:child_process";

import { writeRemediation } from "../gate-remediation/format.mjs";

const workerRules = [
  "workers/parser/oi_worker/engines/reading_order/",
  "workers/parser/oi_worker/preprocess/scan_detect.py",
  "workers/parser/oi_worker/engines/modular_a/paragraphs.py",
];
const allowedRulePaths = [
  "packages/features/parsing/",
  "fixtures/parsing-rules/",
  ...workerRules,
];

function option(name, fallback) {
  const index = process.argv.indexOf(name);
  if (index !== -1) {
    return process.argv[index + 1];
  }
  return process.env.GATE_BASE ?? fallback;
}

function changedFiles(base) {
  const result = spawnSync("git", ["diff", "--name-only", `${base}...HEAD`], {
    encoding: "utf8",
  });
  if (result.status !== 0) {
    process.stderr.write(result.stderr ?? "");
    process.exit(result.status === null ? 1 : result.status);
  }
  return result.stdout.split("\n").filter(Boolean);
}

function slicesIn(files) {
  const found = new Set();
  for (const file of files) {
    const match = /^packages\/features\/([^/]+)\/src\//.exec(file);
    if (match?.[1]) {
      found.add(match[1]);
    }
  }
  return [...found];
}

function hasAdr(files) {
  return files.some((file) => /^docs\/adr\/(?!README\.md$).+\.md$/.test(file));
}

function startsWithAny(file, prefixes) {
  return prefixes.some((prefix) => file.startsWith(prefix));
}

function rulesViolation(files) {
  const textLayer = files.some((file) =>
    file.startsWith("packages/features/parsing/src/domain/text-layer/"),
  );
  const fixtures = files.some((file) => file.startsWith("fixtures/parsing-rules/"));
  const worker = files.some((file) => startsWithAny(file, workerRules));
  const touched = textLayer || fixtures || worker;
  if (!touched) {
    return [];
  }
  const missing = [];
  if (!textLayer) {
    missing.push("packages/features/parsing/src/domain/text-layer/");
  }
  if (!fixtures) {
    missing.push("fixtures/parsing-rules/");
  }
  if (!worker) {
    missing.push("worker pure-rule module");
  }
  const extra = files.filter((file) => !startsWithAny(file, allowedRulePaths));
  return [
    ...missing.map((item) => `parsing-rules PR is missing ${item}`),
    ...extra.map((file) => `parsing-rules PR has an extra file ${file}`),
  ];
}

const files = changedFiles(option("--base", "main"));
const slices = slicesIn(files);
const failures = [];
if (slices.length > 1 && !hasAdr(files)) {
  failures.push(`more than one feature slice: ${slices.join(", ")}`);
}
failures.push(...rulesViolation(files));

if (failures.length > 0) {
  console.error("check-one-slice: rejected (G18, RULES §2)");
  for (const line of failures) {
    console.error(`  ${line}`);
  }
  writeRemediation(["G18"]);
  process.exit(1);
}

console.log(`check-one-slice: ${slices.length} feature slice(s)`);

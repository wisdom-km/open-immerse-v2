import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

import { writeRemediation } from "../gate-remediation/format.mjs";
import { licenseAllowed } from "./policy.mjs";

function packagesFromPnpm(report) {
  const found = [];
  for (const packages of Object.values(report)) {
    if (!Array.isArray(packages)) {
      continue;
    }
    for (const item of packages) {
      found.push({ name: item.name, license: item.license });
    }
  }
  return found;
}

function reportFromArgs(argv) {
  const fromJson = argv.indexOf("--from-json");
  if (fromJson !== -1) {
    return JSON.parse(readFileSync(argv[fromJson + 1], "utf8"));
  }
  const result = spawnSync("corepack", ["pnpm", "licenses", "list", "--json"], {
    encoding: "utf8",
  });
  if (result.status !== 0) {
    process.stderr.write(result.stderr ?? "");
    writeRemediation(["G10"]);
    process.exit(result.status === null ? 1 : result.status);
  }
  return JSON.parse(result.stdout);
}

const failures = [];
for (const item of packagesFromPnpm(reportFromArgs(process.argv))) {
  if (!licenseAllowed(item.name, String(item.license))) {
    failures.push(`${item.name}: ${item.license}`);
  }
}

if (failures.length > 0) {
  console.error("check-license: npm license rejected (G10, RULES §1.5)");
  for (const line of failures) {
    console.error(`  ${line}`);
  }
  writeRemediation(["G10"]);
  process.exit(1);
}

console.log("check-license: npm licenses accepted");

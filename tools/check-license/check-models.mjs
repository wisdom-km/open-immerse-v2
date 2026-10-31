import { existsSync, readFileSync } from "node:fs";

import { writeRemediation } from "../gate-remediation/format.mjs";
import { licenseAllowed } from "./policy.mjs";

function option(name, fallback) {
  const index = process.argv.indexOf(name);
  return index === -1 ? fallback : process.argv[index + 1];
}

const manifestPath = option(
  "--manifest",
  "workers/parser/oi_worker/runtime/models.json",
);

if (!existsSync(manifestPath)) {
  console.log("check-license: no runtime model manifest");
  process.exit(0);
}

const models = JSON.parse(readFileSync(manifestPath, "utf8"));
const failures = [];
for (const model of models) {
  if (!model.name || !model.version || !model.sha256 || !model.license || !model.source) {
    failures.push(`${model.name ?? "(unnamed)"}: missing name, version, sha256, license, or source`);
    continue;
  }
  if (!licenseAllowed(model.name, String(model.license))) {
    failures.push(`${model.name}: ${model.license}`);
  }
}

if (failures.length > 0) {
  console.error("check-license: model license rejected (G10, RULES §1.5)");
  for (const line of failures) {
    console.error(`  ${line}`);
  }
  writeRemediation(["G10"]);
  process.exit(1);
}

console.log(`check-license: ${models.length} model licenses accepted`);

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { matchedIds, writeRemediation } from "../gate-remediation/format.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));

function option(name, fallback) {
  const index = process.argv.indexOf(name);
  return index === -1 ? fallback : process.argv[index + 1];
}

const roots = ["packages", "apps"].filter((dir) => existsSync(dir));
if (roots.length === 0) {
  console.log("check-deps: no packages/ or apps/; nothing to cruise");
  process.exit(0);
}

const depcruise = path.resolve(scriptDir, "../../node_modules/.bin/depcruise");
const result = spawnSync(
  depcruise,
  ["--config", option("--config", "dependency-cruiser.config.mjs"), "--output-type", "err", ...roots],
  { encoding: "utf8" },
);
process.stdout.write(result.stdout ?? "");
process.stderr.write(result.stderr ?? "");
if ((result.status ?? 1) !== 0) {
  if (result.error) {
    console.error(result.error.message);
  }
  const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
  writeRemediation(matchedIds(output, "G5"));
  process.exit(result.status === null ? 1 : result.status);
}

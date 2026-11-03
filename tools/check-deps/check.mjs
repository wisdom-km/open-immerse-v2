import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";

import { matchedIds, writeRemediation } from "../gate-remediation/format.mjs";
import { launchDepcruise } from "./launch-depcruise.mjs";

function option(name, fallback) {
  const index = process.argv.indexOf(name);
  return index === -1 ? fallback : process.argv[index + 1];
}

const roots = ["packages", "apps"].filter((dir) => existsSync(dir));
if (roots.length === 0) {
  console.log("check-deps: no packages/ or apps/; nothing to cruise");
  process.exit(0);
}

const result = launchDepcruise(spawnSync, [
  "--config",
  option("--config", "dependency-cruiser.config.mjs"),
  "--output-type",
  "err",
  ...roots,
]);
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

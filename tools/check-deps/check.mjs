import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { findPackageJSON } from "node:module";
import path from "node:path";

import { matchedIds, writeRemediation } from "../gate-remediation/format.mjs";

function option(name, fallback) {
  const index = process.argv.indexOf(name);
  return index === -1 ? fallback : process.argv[index + 1];
}

function depcruiseEntry() {
  const pkgPath = findPackageJSON("dependency-cruiser", import.meta.url);
  if (pkgPath === undefined) {
    throw new Error("dependency-cruiser bin.depcruise was not found");
  }
  const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
  const binField = pkg.bin;
  const relative =
    typeof binField === "object" && binField !== null ? binField.depcruise : undefined;
  if (typeof relative !== "string" || relative.length === 0) {
    throw new Error("dependency-cruiser bin.depcruise was not found");
  }
  return path.resolve(path.dirname(pkgPath), relative);
}

const roots = ["packages", "apps"].filter((dir) => existsSync(dir));
if (roots.length === 0) {
  console.log("check-deps: no packages/ or apps/; nothing to cruise");
  process.exit(0);
}

const result = spawnSync(
  process.execPath,
  [
    depcruiseEntry(),
    "--config",
    option("--config", "dependency-cruiser.config.mjs"),
    "--output-type",
    "err",
    ...roots,
  ],
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

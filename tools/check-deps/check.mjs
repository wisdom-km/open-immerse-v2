import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";

const roots = ["packages", "apps"].filter((dir) => existsSync(dir));
if (roots.length === 0) {
  console.log("check-deps: no packages/ or apps/; nothing to cruise");
  process.exit(0);
}

const result = spawnSync(
  "depcruise",
  ["--config", "dependency-cruiser.config.mjs", "--output-type", "err", ...roots],
  { stdio: "inherit" },
);
process.exit(result.status === null ? 1 : result.status);

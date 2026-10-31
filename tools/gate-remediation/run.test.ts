import { spawnSync } from "node:child_process";
import path from "node:path";
import { expect, it } from "vitest";

import { commandOutput, remediationBlock } from "./block.js";

const run = path.resolve("tools/gate-remediation/run.mjs");

it("appends the catalog block only when the command exits non-zero", () => {
  const ok = spawnSync("node", [run, "--id", "G4", "--", "node", "-e", "process.exit(0)"], {
    encoding: "utf8",
  });
  expect(ok.status).toBe(0);
  expect(commandOutput(ok)).not.toContain("gate-remediation:");

  const failed = spawnSync("node", [run, "--id", "G4", "--", "node", "-e", "process.exit(2)"], {
    encoding: "utf8",
  });
  expect(failed.status).toBe(2);
  const output = commandOutput(failed);
  expect(output).toContain("gate-remediation: G4");
  expect(output).toContain(remediationBlock("G4"));
  expect(output).toContain("problem:");
  expect(output).toContain("fix:");
  expect(output).toContain("spec:");
});

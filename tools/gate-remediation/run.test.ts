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

it("rejects an unknown id before the wrapped command runs", () => {
  const format = path.resolve("tools/gate-remediation/format.mjs");
  const passed = spawnSync(
    "node",
    [run, "--id", "NOT-A-GATE", "--", "node", "-e", "console.log('ran'); process.exit(0)"],
    { encoding: "utf8" },
  );
  expect(passed.status).toBe(2);
  expect(commandOutput(passed)).toContain("unknown gate id NOT-A-GATE");
  expect(commandOutput(passed)).not.toContain("ran");

  const failed = spawnSync(
    "node",
    [run, "--id", "NOT-A-GATE", "--", "node", "-e", "console.log('ran'); process.exit(7)"],
    { encoding: "utf8" },
  );
  expect(failed.status).toBe(2);
  expect(commandOutput(failed)).not.toContain("ran");

  const formatted = spawnSync("node", [format, "--id", "NOT-A-GATE"], { encoding: "utf8" });
  expect(formatted.status).toBe(2);
  expect(formatted.stdout).toBe("");
  expect(formatted.stderr).toContain("unknown gate id NOT-A-GATE");
});

it("keeps exit codes 0 and 7 for a catalog id", () => {
  const ok = spawnSync("node", [run, "--id", "G4", "--", "node", "-e", "process.exit(0)"], {
    encoding: "utf8",
  });
  expect(ok.status).toBe(0);
  expect(commandOutput(ok)).not.toContain("gate-remediation:");

  const seven = spawnSync("node", [run, "--id", "G4", "--", "node", "-e", "process.exit(7)"], {
    encoding: "utf8",
  });
  expect(seven.status).toBe(7);
  expect(commandOutput(seven)).toContain(remediationBlock("G4"));
});

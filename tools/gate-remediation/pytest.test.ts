import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { expect, it } from "vitest";

import { commandOutput, remediationBlock } from "./block.js";

it("prints G8 remediation for a pytest fixture that is not collected by default", () => {
  const project = readFileSync("workers/parser/pyproject.toml", "utf8");
  expect(project).toContain('testpaths = ["tests"]');
  const listed = spawnSync("uv", ["run", "pytest", "--collect-only", "-q"], {
    cwd: path.resolve("workers/parser"),
    encoding: "utf8",
  });
  expect(listed.status).toBe(0);
  expect(commandOutput(listed)).not.toContain("test_rejected");

  const result = spawnSync(
    "node",
    [
      path.resolve("tools/gate-remediation/run.mjs"),
      "--id",
      "G8",
      "--cwd",
      path.resolve("workers/parser"),
      "--",
      "uv",
      "run",
      "pytest",
      path.resolve("tools/gate-fixtures/pytest/test_rejected.py"),
    ],
    { encoding: "utf8" },
  );
  expect(result.status).not.toBe(0);
  const output = commandOutput(result);
  expect(output).toContain("intentional G8 violation");
  expect(output).toContain(remediationBlock("G8"));
});

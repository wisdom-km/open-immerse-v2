import { spawnSync } from "node:child_process";
import path from "node:path";
import { expect, it } from "vitest";

import { commandOutput, remediationBlock } from "./block.js";

it("prints G3-pyright remediation for a strict violation", () => {
  const result = spawnSync(
    "node",
    [
      path.resolve("tools/gate-remediation/run.mjs"),
      "--id",
      "G3-pyright",
      "--cwd",
      path.resolve("workers/parser"),
      "--",
      "uv",
      "run",
      "pyright",
      path.resolve("tools/gate-fixtures/pyright/bad.py"),
    ],
    { encoding: "utf8" },
  );
  expect(result.status).not.toBe(0);
  const output = commandOutput(result);
  expect(output).toContain(remediationBlock("G3-pyright"));
  expect(output.toLowerCase()).toContain("error");
});

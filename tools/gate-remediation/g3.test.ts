import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { expect, it } from "vitest";

import { commandOutput, remediationBlock } from "./block.js";

it("prints G3 remediation for a tsc violation that stays outside the required check", () => {
  const result = spawnSync(
    "node",
    [
      path.resolve("tools/gate-remediation/run.mjs"),
      "--id",
      "G3",
      "--",
      "tsc",
      "--noEmit",
      "--pretty",
      "false",
      "--project",
      "tools/gate-fixtures/g3/tsconfig.json",
    ],
    { encoding: "utf8" },
  );
  expect(result.status).not.toBe(0);
  const output = commandOutput(result);
  expect(output).toContain("TS2322");
  expect(output).toContain(remediationBlock("G3"));

  expect(readFileSync("tsconfig.json", "utf8")).toContain("tools/gate-fixtures");
  expect(readFileSync("tsconfig.core.json", "utf8")).toContain("tools/gate-fixtures");
  expect(readFileSync("eslint.config.js", "utf8")).toContain("tools/gate-fixtures/**");
  expect(readFileSync("package.json", "utf8")).not.toContain("tsc -b");
  expect(readFileSync(".github/workflows/ci.yml", "utf8")).not.toContain("tsc -b");
  expect(readFileSync("package.json", "utf8")).not.toContain("gate-fixtures/g3");

  const required = spawnSync("node", ["tools/typecheck.mjs"], { encoding: "utf8" });
  expect(required.status).toBe(0);
  expect(commandOutput(required)).not.toContain("gate-remediation:");
});

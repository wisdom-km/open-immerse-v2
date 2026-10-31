import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { expect, it } from "vitest";

const target = "packages/features/jobs/test/core/job-id.test.ts";
const marker = ["@", "vitest-environment jsdom"].join("");

it("rejects a vitest environment directive in the jobs core test (G16)", () => {
  const original = readFileSync(target, "utf8");
  writeFileSync(target, `${marker}\n${original}`);
  try {
    const result = spawnSync("node", ["tools/check-core-tests/check.mjs"], { encoding: "utf8" });
    const output = `${result.stdout}${result.stderr}`;
    expect(result.status).not.toBe(0);
    expect(output).toContain("job-id.test.ts");
  } finally {
    writeFileSync(target, original);
  }
});

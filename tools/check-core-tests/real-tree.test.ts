import { spawnSync } from "node:child_process";
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { expect, it } from "vitest";

const marker = ["@", "vitest-environment jsdom"].join("");

it("rejects a vitest environment directive in the jobs core test (G16)", () => {
  const root = mkdtempSync(path.join(tmpdir(), "oi-core-"));
  const relative = "packages/features/jobs/test/core/job-id.test.ts";
  try {
    cpSync("packages/features/jobs", path.join(root, "packages/features/jobs"), {
      recursive: true,
    });
    const target = path.join(root, relative);
    const original = readFileSync(target, "utf8");
    writeFileSync(target, `${marker}\n${original}`);
    const result = spawnSync("node", [path.resolve("tools/check-core-tests/check.mjs"), "--root", root], {
      encoding: "utf8",
    });
    const output = `${result.stdout}${result.stderr}`;
    expect(result.status).not.toBe(0);
    expect(output).toContain("job-id.test.ts");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

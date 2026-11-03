import { spawnSync } from "node:child_process";
import path from "node:path";
import { expect, it } from "vitest";

const checker = path.resolve("tools/check-docs/check.mjs");

function text(result: { stdout: string | Buffer | null | undefined }) {
  return typeof result.stdout === "string" ? result.stdout : "";
}

it("exits zero when the fixture tree has findings", () => {
  const result = spawnSync(
    "node",
    [checker, "--root", path.resolve("tools/check-docs/fixtures/missing-file")],
    { encoding: "utf8" },
  );
  const out = text(result);
  expect(result.status).toBe(0);
  expect(out).toContain("check-docs: report-only");
  expect(out).toMatch(/^findings: [1-9]/m);
});

it("ignores fixture links when scanning the repository", () => {
  const result = spawnSync("node", [checker], { encoding: "utf8" });
  const out = text(result);
  expect(result.status).toBe(0);
  expect(out).toContain("check-docs: report-only");
  expect(out).not.toContain("tools/check-docs/fixtures/");
});

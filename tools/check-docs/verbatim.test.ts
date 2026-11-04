import { spawnSync } from "node:child_process";
import path from "node:path";
import { expect, it } from "vitest";

const checker = path.resolve("tools/check-docs/check.mjs");
const root = path.resolve("tools/check-docs/fixtures/verbatim");

function run(manifest: string) {
  return spawnSync(
    "node",
    [checker, "--root", root, "--verbatim", path.join(root, manifest)],
    { encoding: "utf8" },
  );
}

function text(result: { stdout: string | Buffer | null | undefined }) {
  return typeof result.stdout === "string" ? result.stdout : "";
}

it("accepts a pair when the bytes match", () => {
  const result = run("match.json");
  const out = text(result);
  expect(result.status).toBe(0);
  expect(out).toContain("verbatim: 0");
  expect(out).toContain("findings: 0");
});

it("reports a mismatch when the bytes differ", () => {
  const result = run("mismatch.json");
  const out = text(result);
  expect(result.status).toBe(1);
  expect(out).toContain("verbatim-mismatch\tdiff-a.md\tdiff-b.md");
  expect(out).toContain("verbatim: 1");
});

it("accepts a marked span when the bytes outside it differ", () => {
  const result = run("marked.json");
  const out = text(result);
  expect(result.status).toBe(0);
  expect(out).toContain("verbatim: 0");
  expect(out).toContain("findings: 0");
});

it("reports a missing marker when the end line is absent", () => {
  const result = run("marker.json");
  const out = text(result);
  expect(result.status).toBe(1);
  expect(out).toContain("verbatim-marker\tmark-a.md\tmark-missing.md");
});

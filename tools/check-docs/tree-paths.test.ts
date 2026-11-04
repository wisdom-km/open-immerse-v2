import { spawnSync } from "node:child_process";
import path from "node:path";
import { expect, it } from "vitest";

const checker = path.resolve("tools/check-docs/check.mjs");

function run(root: string) {
  return spawnSync("node", [checker, "--root", root], { encoding: "utf8" });
}

function text(result: { stdout: string | Buffer | null | undefined }) {
  return typeof result.stdout === "string" ? result.stdout : "";
}

it("reports a missing tree path when the name is absent", () => {
  const result = run(path.resolve("tools/check-docs/fixtures/tree-paths"));
  const out = text(result);
  expect(result.status).toBe(0);
  expect(out).toContain("tree-path-missing\tdocs/arch/03.md\tmissing.md");
  expect(out).toContain("tree: 1");
});

it("accepts a path when the file exists", () => {
  const out = text(run(path.resolve("tools/check-docs/fixtures/tree-paths")));
  expect(out).not.toContain("docs/arch/03.md\tdocs/");
  expect(out).not.toContain("docs/arch/03.md\tdocs/arch/");
  expect(out).not.toContain("docs/arch/03.md\tkeep.md");
  expect(out).not.toContain("docs/arch/03.md\talso.md");
});

it("accepts a path when the comment marks it planned", () => {
  const out = text(run(path.resolve("tools/check-docs/fixtures/tree-paths")));
  expect(out).not.toContain("planned/");
});

it("reports a missing tree when the fence is absent", () => {
  const out = text(
    run(path.resolve("tools/check-docs/fixtures/tree-paths-empty")),
  );
  expect(out).toContain("tree-path-missing\tdocs/arch/03.md\t没有目录树代码块");
});

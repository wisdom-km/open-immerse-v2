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

it("reports a missing status line when the first 40 lines have none", () => {
  const result = run(path.resolve("tools/check-docs/fixtures/missing-status"));
  const out = text(result);
  expect(result.status).toBe(0);
  expect(out).toContain(
    "status-line-missing\tdocs/README.md\t前 40 行没有状态行",
  );
  expect(out).toContain(
    "status-line-missing\tdocs/plain.md\t前 40 行没有状态行",
  );
  expect(out).not.toContain("docs/kept.md");
  expect(out).not.toContain("docs/exec-plans/");
  expect(out).not.toContain("docs/evidence/");
  expect(out).not.toContain("not-in-index");
});

it("reports one missing index when the status table is absent", () => {
  const out = text(
    run(path.resolve("tools/check-docs/fixtures/missing-status")),
  );
  expect(out).toContain(
    "index-table-missing\tdocs/README.md\t索引表缺少路径与状态列",
  );
  expect(out).toContain("status: 3");
  expect(out).toContain("findings: 3");
});

it("reports a status mismatch when the index token is absent from the file", () => {
  const out = text(run(path.resolve("tools/check-docs/fixtures/status-table")));
  expect(out).toContain("status-mismatch\tdocs/old.md\t历史草案");
  expect(out).toContain("status-mismatch\tdocs/bad.md\t随便");
  expect(out).not.toContain("index-table-missing");
  expect(out).not.toContain("docs/exec-plans/");
  expect(out).not.toContain("docs/evidence/");
});

it("reports a file when the index omits it", () => {
  const out = text(run(path.resolve("tools/check-docs/fixtures/status-table")));
  expect(out).toContain("not-in-index\tdocs/extra.md\t索引没有这一行");
});

it("accepts a file when the index token appears in its status line", () => {
  const out = text(run(path.resolve("tools/check-docs/fixtures/status-table")));
  expect(out).not.toContain("docs/guide.md");
  expect(out).toContain("status: 3");
  expect(out).toContain("findings: 3");
});

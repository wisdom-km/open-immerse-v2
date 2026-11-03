import { spawnSync } from "node:child_process";
import path from "node:path";
import { expect, it } from "vitest";

const checker = path.resolve("tools/check-docs/check.mjs");

function run(args: string[]) {
  return spawnSync("node", [checker, ...args], { encoding: "utf8" });
}

function fixture(name: string) {
  return path.resolve("tools/check-docs/fixtures", name);
}

function text(result: { stdout: string | Buffer | null | undefined }) {
  return typeof result.stdout === "string" ? result.stdout : "";
}

it("reports a missing file when the link target is absent", () => {
  const result = run(["--root", fixture("missing-file")]);
  const out = text(result);
  expect(result.status).toBe(0);
  expect(out).toContain("missing-file\tpage.md\tmissing.md");
  expect(out).toContain("missing-file\tpage.md\t/etc/passwd");
  expect(out).toContain("missing-file\tpage.md\t../outside.md");
  expect(out).toContain("links: 3");
  expect(out).toContain("findings: 3");
  expect(out).not.toContain("nope.md");
  expect(out).not.toContain("note.txt");
});

it("skips an external link when the scheme is https", () => {
  const result = run(["--root", fixture("missing-file")]);
  const out = text(result);
  expect(result.status).toBe(0);
  expect(out).not.toContain("example.invalid");
  expect(out).not.toContain("mailto:");
});

it("reports a missing anchor when the slug is absent", () => {
  const result = run(["--root", fixture("missing-anchor")]);
  const out = text(result);
  expect(result.status).toBe(0);
  expect(out).toContain("missing-anchor\tpage.md\t#no-such");
  expect(out).toContain("missing-anchor\tpage.md\tother.md#absent");
  expect(out).toContain("missing-anchor\tpage.md\t#not-a-heading");
  expect(out).toContain("anchors: 3");
  expect(out).not.toContain("missing-anchor\tpage.md\t#title\n");
  expect(out).not.toContain("#title-1");
  expect(out).not.toContain("other.md#present");
  expect(out).not.toContain("#70-服务商");
});

it("accepts an anchor when the heading slug matches", () => {
  const out = text(run(["--root", fixture("missing-anchor")]));
  expect(out).toContain("anchors: 3");
  expect(out).not.toContain("#70-服务商");
  expect(out).toContain("links: 0");
});

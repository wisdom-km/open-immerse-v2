import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { expect, it } from "vitest";

import { commandOutput } from "../gate-remediation/block.js";

function git(cwd: string, args: string[]) {
  execFileSync("git", args, { cwd, stdio: "pipe" });
}

function run(root: string, base: string) {
  return spawnSync(
    "node",
    [path.resolve("tools/check-hotspots/check.mjs"), "--base", base],
    { cwd: root, encoding: "utf8" },
  );
}

function repoWith(name: string, repeats: number) {
  const root = mkdtempSync(path.join(tmpdir(), "oi-hot-"));
  git(root, ["init"]);
  git(root, ["config", "user.email", "gate@example.com"]);
  git(root, ["config", "user.name", "gate"]);
  writeFileSync(path.join(root, name), "export const n = 1;\n");
  git(root, ["add", "."]);
  git(root, ["commit", "-m", "chore: base"]);
  writeFileSync(path.join(root, name), "export const n = 1;\n".repeat(repeats));
  git(root, ["add", "."]);
  git(root, ["commit", "-m", "chore: edit"]);
  return root;
}

it("prints a composition-root diff over 30 lines and does not fail", () => {
  const root = repoWith("composition-root.ts", 40);
  try {
    const reported = run(root, "HEAD~1");
    expect(reported.status).toBe(0);
    const output = commandOutput(reported);
    expect(output).toContain("composition-root.ts:");
    expect(output).toContain("lines > 30");
    expect(output).toContain("not a dependency or duty check");
    expect(output).not.toContain("gate-remediation:");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

it("prints a slots diff over 30 lines and ignores an unrelated file", () => {
  const root = repoWith("slots.ts", 40);
  try {
    writeFileSync(
      path.join(root, "other.ts"),
      "export const n = 1;\n".repeat(40),
    );
    git(root, ["add", "other.ts"]);
    git(root, ["commit", "-m", "chore: other"]);
    const reported = run(root, "HEAD~2");
    expect(reported.status).toBe(0);
    const output = commandOutput(reported);
    expect(output).toContain("slots.ts:");
    expect(output).not.toContain("other.ts");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

it("does not print an over hint for a named file at or under 30 lines", () => {
  const root = repoWith("composition-root.ts", 2);
  try {
    const reported = run(root, "HEAD~1");
    expect(reported.status).toBe(0);
    expect(commandOutput(reported)).not.toContain("lines >");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

it("keeps a non-zero status when git cannot read the base", () => {
  const root = repoWith("composition-root.ts", 2);
  try {
    const failed = run(root, "not-a-ref");
    expect(failed.status).not.toBe(0);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

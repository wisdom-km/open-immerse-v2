import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { expect, it } from "vitest";

import { commandOutput } from "../gate-remediation/block.js";

function git(cwd: string, args: string[]) {
  execFileSync("git", args, { cwd, stdio: "pipe" });
}

function init(root: string) {
  git(root, ["init"]);
  git(root, ["config", "user.email", "gate@example.com"]);
  git(root, ["config", "user.name", "gate"]);
  writeFileSync(path.join(root, "README.md"), "base\n");
  git(root, ["add", "README.md"]);
  git(root, ["commit", "-m", "chore: base"]);
  return execFileSync("git", ["rev-parse", "HEAD"], {
    cwd: root,
    encoding: "utf8",
  }).trim();
}

function run(root: string, base: string) {
  return spawnSync(
    "node",
    [path.resolve("tools/check-pr-size/check.mjs"), "--base", base],
    { cwd: root, encoding: "utf8" },
  );
}

it("prints a diff over 600 lines and does not fail with or without a reason", () => {
  const root = mkdtempSync(path.join(tmpdir(), "oi-pr-"));
  try {
    const base = init(root);
    writeFileSync(
      path.join(root, "wide.ts"),
      "export const n = 1;\n".repeat(601),
    );
    git(root, ["add", "wide.ts"]);
    git(root, ["commit", "-m", "chore: widen"]);
    const plain = run(root, base);
    expect(plain.status).toBe(0);
    expect(commandOutput(plain)).toContain(
      "check-pr-size: 601 non-generated lines",
    );
    expect(commandOutput(plain)).toContain("former hint 600");
    expect(commandOutput(plain)).not.toContain("gate-remediation:");

    git(root, [
      "commit",
      "--allow-empty",
      "-m",
      "chore: note\n\nG12: fixture stays together",
    ]);
    const noted = run(root, base);
    expect(noted.status).toBe(0);
    expect(commandOutput(noted)).toContain(
      "check-pr-size: 601 non-generated lines",
    );
    expect(commandOutput(noted)).toContain("former hint 600");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

it("prints a contracts-only diff over 200 lines and does not fail", () => {
  const root = mkdtempSync(path.join(tmpdir(), "oi-pr-"));
  try {
    const base = init(root);
    const file = path.join(root, "packages/contracts/wide.ts");
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, "export const n = 1;\n".repeat(201));
    git(root, ["add", "."]);
    git(root, ["commit", "-m", "chore: widen contracts"]);
    const plain = run(root, base);
    expect(plain.status).toBe(0);
    expect(commandOutput(plain)).toContain(
      "check-pr-size: 201 non-generated lines",
    );
    expect(commandOutput(plain)).toContain("former hint 200");

    git(root, [
      "commit",
      "--allow-empty",
      "-m",
      "chore: note\n\nG12: fixture stays together",
    ]);
    const noted = run(root, base);
    expect(noted.status).toBe(0);
    expect(commandOutput(noted)).toContain("former hint 200");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

it("keeps a non-zero status when git cannot read the base", () => {
  const root = mkdtempSync(path.join(tmpdir(), "oi-pr-"));
  try {
    init(root);
    const failed = run(root, "not-a-ref");
    expect(failed.status).not.toBe(0);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { expect, it } from "vitest";

const config = path.resolve(".gitleaks.toml");

function git(cwd: string, args: string[]) {
  execFileSync("git", args, { cwd, stdio: "pipe" });
}

function binary(context: { skip: (note: string) => void }): string {
  const fromEnv = process.env.GITLEAKS_BIN;
  if (fromEnv === undefined || fromEnv.length === 0) {
    context.skip("GITLEAKS_BIN is unset. Point it at the gitleaks binary to run G9.");
    return "";
  }
  return fromEnv;
}

function detect(bin: string, root: string) {
  execFileSync(bin, ["detect", "--source", root, "--config", config, "--no-banner", "--redact"], {
    encoding: "utf8",
  });
}

it("rejects a committed access key that lacks the oitest_ prefix (G9)", (context) => {
  const bin = binary(context);
  const root = mkdtempSync(path.join(tmpdir(), "oi-leak-"));
  try {
    git(root, ["init"]);
    git(root, ["config", "user.email", "gate@example.com"]);
    git(root, ["config", "user.name", "gate"]);
    const suffix = ["1WqE2rT3", "yU4iO5pA", "6sD7fG8h", "J9kL0zXc", "VbNm"].join("");
    const key = ["ghp_", suffix].join("");
    writeFileSync(path.join(root, "secret.txt"), `token=${key}\n`);
    git(root, ["add", "secret.txt"]);
    git(root, ["commit", "-m", "chore: leak fixture"]);
    expect(() => {
      detect(bin, root);
    }).toThrow();
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

it("allows a synthetic key that uses the oitest_ prefix (G9)", (context) => {
  const bin = binary(context);
  const root = mkdtempSync(path.join(tmpdir(), "oi-leak-ok-"));
  try {
    git(root, ["init"]);
    git(root, ["config", "user.email", "gate@example.com"]);
    git(root, ["config", "user.name", "gate"]);
    const suffix = ["1WqE2rT3", "yU4iO5pA", "6sD7fG8h", "J9kL0zXc", "VbNm"].join("");
    const key = ["oitest_", suffix].join("");
    writeFileSync(path.join(root, "secret.txt"), `token=${key}\n`);
    git(root, ["add", "secret.txt"]);
    git(root, ["commit", "-m", "chore: synthetic key"]);
    expect(() => {
      detect(bin, root);
    }).not.toThrow();
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

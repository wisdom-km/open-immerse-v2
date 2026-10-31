import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { expect, it } from "vitest";

const gitleaks = process.env.GITLEAKS_BIN ?? "/tmp/gitleaks";

function git(cwd: string, args: string[]) {
  execFileSync("git", args, { cwd, stdio: "pipe" });
}

it("rejects a committed access key (G9)", () => {
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
    expect(() =>
      execFileSync(gitleaks, ["detect", "--source", root, "--no-banner", "--redact"], {
        encoding: "utf8",
      }),
    ).toThrow();
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { expect, it } from "vitest";

import { commandOutput, remediationBlock } from "../gate-remediation/block.js";

function git(cwd: string, args: string[]) {
  execFileSync("git", args, { cwd, stdio: "pipe" });
}

it("codegen leaves a diff when generated output drifted (G7)", () => {
  const root = mkdtempSync(path.join(tmpdir(), "oi-gen-"));
  try {
    writeFileSync(path.join(root, "source.txt"), "left\n");
    writeFileSync(path.join(root, "generated.txt"), "right\n");
    writeFileSync(
      path.join(root, "manifest.json"),
      JSON.stringify({ generators: [{ input: "source.txt", output: "generated.txt" }] }),
    );
    git(root, ["init"]);
    git(root, ["config", "user.email", "gate@example.com"]);
    git(root, ["config", "user.name", "gate"]);
    git(root, ["add", "."]);
    git(root, ["commit", "-m", "chore: fixture"]);
    execFileSync(
      "node",
      [path.resolve("tools/codegen/run.mjs"), "--root", root, "--manifest", path.join(root, "manifest.json")],
      { cwd: root, stdio: "pipe" },
    );
    const drifted = spawnSync(
      "node",
      [
        path.resolve("tools/gate-remediation/run.mjs"),
        "--id",
        "G7",
        "--cwd",
        root,
        "--",
        "git",
        "diff",
        "--exit-code",
      ],
      { encoding: "utf8" },
    );
    expect(drifted.status).not.toBe(0);
    expect(commandOutput(drifted)).toContain(remediationBlock("G7"));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

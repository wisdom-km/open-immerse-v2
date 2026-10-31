import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { expect, it } from "vitest";

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
    expect(() => {
      git(root, ["diff", "--exit-code"]);
    }).toThrow();
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { expect, it } from "vitest";

const script = path.resolve("tools/check-one-slice/check.mjs");

function git(cwd: string, args: string[]) {
  execFileSync("git", args, { cwd, stdio: "pipe" });
}

function initRepo() {
  const root = mkdtempSync(path.join(tmpdir(), "oi-slice-"));
  git(root, ["init"]);
  git(root, ["config", "user.email", "gate@example.com"]);
  git(root, ["config", "user.name", "gate"]);
  writeFileSync(path.join(root, "README.md"), "base\n");
  git(root, ["add", "README.md"]);
  git(root, ["commit", "-m", "chore: base"]);
  return root;
}

function check(root: string, base: string) {
  try {
    execFileSync("node", [script, "--base", base], { cwd: root, encoding: "utf8" });
    return 0;
  } catch (error) {
    const failed = error as { status?: number };
    return failed.status ?? 1;
  }
}

it("rejects two feature slices and allows one slice ui plus core (G18)", () => {
  const root = initRepo();
  try {
    const base = execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim();
    mkdirSync(path.join(root, "packages/features/reader/src/ui"), { recursive: true });
    mkdirSync(path.join(root, "packages/features/reader/src/domain"), { recursive: true });
    writeFileSync(path.join(root, "packages/features/reader/src/ui/pane.ts"), "export const n = 1;\n");
    writeFileSync(path.join(root, "packages/features/reader/src/domain/sync.ts"), "export const n = 1;\n");
    git(root, ["add", "."]);
    git(root, ["commit", "-m", "feat(reader): ui and core"]);
    expect(check(root, base)).toBe(0);

    mkdirSync(path.join(root, "packages/features/notes/src/domain"), { recursive: true });
    writeFileSync(path.join(root, "packages/features/notes/src/domain/note.ts"), "export const n = 1;\n");
    git(root, ["add", "."]);
    git(root, ["commit", "-m", "feat(notes): domain"]);
    expect(check(root, base)).not.toBe(0);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

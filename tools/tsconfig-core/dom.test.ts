import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { expect, it } from "vitest";

function typecheck(root: string, fileName: string) {
  writeFileSync(
    path.join(root, "tsconfig.json"),
    JSON.stringify({
      extends: path.resolve("tsconfig.core.json"),
      files: [fileName],
      include: [],
    }),
  );
  try {
    const stdout = execFileSync("tsc", ["-p", path.join(root, "tsconfig.json"), "--pretty", "false"], {
      encoding: "utf8",
    });
    return { status: 0, output: stdout };
  } catch (error) {
    const failed = error as { status?: number; stdout?: string };
    return { status: failed.status ?? 1, output: failed.stdout ?? "" };
  }
}

it("rejects DOM and process globals in the core compile environment (G14)", () => {
  const root = mkdtempSync(path.join(tmpdir(), "oi-dom-"));
  try {
    writeFileSync(path.join(root, "package.json"), '{"type":"module"}\n');
    writeFileSync(
      path.join(root, "bad.ts"),
      [
        "export const view = document;",
        "export const host = window;",
        "export const el: HTMLElement | null = null;",
        "export const key: KeyboardEvent | null = null;",
        "export const pid = process.pid;",
        "",
      ].join("\n"),
    );
    const bad = typecheck(root, "bad.ts");
    expect(bad.status).not.toBe(0);
    expect(bad.output).toContain("document");
    expect(bad.output).toContain("HTMLElement");
    expect(bad.output).toContain("process");
    writeFileSync(path.join(root, "ok.ts"), "export const n = 1;\n");
    expect(typecheck(root, "ok.ts").status).toBe(0);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

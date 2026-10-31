import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { expect, it } from "vitest";

function npmCheck(file: string) {
  try {
    execFileSync("node", [path.resolve("tools/check-license/check-npm.mjs"), "--from-json", file], {
      encoding: "utf8",
    });
    return { status: 0, output: "" };
  } catch (error) {
    const failed = error as { status?: number; stderr?: string };
    return { status: failed.status ?? 1, output: failed.stderr ?? "" };
  }
}

it("rejects GPL, AGPL, and LGPL npm licenses (G10)", () => {
  const root = mkdtempSync(path.join(tmpdir(), "oi-lic-"));
  try {
    const gpl = path.join(root, "gpl.json");
    writeFileSync(gpl, JSON.stringify({ "GPL-3.0-only": [{ name: "bad", license: "GPL-3.0-only" }] }));
    const gplResult = npmCheck(gpl);
    expect(gplResult.status).not.toBe(0);
    expect(gplResult.output).toContain("GPL-3.0-only");

    const agpl = path.join(root, "agpl.json");
    writeFileSync(agpl, JSON.stringify({ "AGPL-3.0-only": [{ name: "bad", license: "AGPL-3.0-only" }] }));
    expect(npmCheck(agpl).status).not.toBe(0);

    const lgpl = path.join(root, "lgpl.json");
    writeFileSync(lgpl, JSON.stringify({ "LGPL-3.0-only": [{ name: "bad", license: "LGPL-3.0-only" }] }));
    expect(npmCheck(lgpl).status).not.toBe(0);

    const ok = path.join(root, "ok.json");
    writeFileSync(ok, JSON.stringify({ MIT: [{ name: "fine", license: "MIT OR Apache-2.0" }] }));
    expect(npmCheck(ok).status).toBe(0);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

it("rejects a lockfile that pins PyMuPDF (G10)", () => {
  const root = mkdtempSync(path.join(tmpdir(), "oi-lock-"));
  try {
    const lock = path.join(root, "uv.lock");
    const report = path.join(root, "ok.json");
    writeFileSync(lock, 'name = "pypdfium2"\nname = "pymupdf"\n');
    writeFileSync(report, "[]");
    const result = execFileSync(
      "node",
      [
        path.resolve("tools/check-license/check-pip.mjs"),
        "--from-json",
        report,
        "--lockfile",
        lock,
      ],
      { encoding: "utf8" },
    );
    expect(result).toContain("should not run");
  } catch (error) {
    const failed = error as { status?: number; stderr?: string };
    expect(failed.status).not.toBe(0);
    expect(failed.stderr ?? "").toContain("PyMuPDF");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

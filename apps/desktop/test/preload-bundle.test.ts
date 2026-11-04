import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import { expect, it } from "vitest";

const script = path.resolve("apps/desktop/scripts/use-cjs-preload.mjs");

it("inlines the generated preload module into one cjs file", () => {
  const root = mkdtempSync(path.join(tmpdir(), "oi-preload-bundle-"));
  try {
    writeFileSync(
      path.join(root, "oi.generated.js"),
      "exports.createOi = function createOi() { return { ready: true }; };\n",
    );
    writeFileSync(
      path.join(root, "index.js"),
      'const generated = require("./oi.generated.js");\nexports.createOi = generated.createOi;\n',
    );
    execFileSync(process.execPath, [script, root], { stdio: "pipe" });
    const bundled = readFileSync(path.join(root, "index.cjs"), "utf8");
    expect(bundled).not.toContain('require("./oi.generated.js")');
    const loaded = createRequire(import.meta.url)(
      path.join(root, "index.cjs"),
    ) as {
      createOi: () => { ready: boolean };
    };
    expect(loaded.createOi()).toEqual({ ready: true });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

it("fails the preload bundle when the generated module is not required", () => {
  const root = mkdtempSync(path.join(tmpdir(), "oi-preload-bundle-"));
  try {
    writeFileSync(
      path.join(root, "oi.generated.js"),
      "exports.createOi = () => ({});\n",
    );
    writeFileSync(path.join(root, "index.js"), "exports.oi = {};\n");
    expect(() => {
      execFileSync(process.execPath, [script, root], { stdio: "pipe" });
    }).toThrow();
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

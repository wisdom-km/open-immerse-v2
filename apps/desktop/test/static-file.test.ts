import { mkdirSync, mkdtempSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { expect, it } from "vitest";

import { bodyForMethod, resolveInsideRoot, resolveStaticFile } from "../src/main/static-file.js";

function withRoot(run: (root: string) => void): void {
  const root = mkdtempSync(path.join(tmpdir(), "oi-app-"));
  const outside = mkdtempSync(path.join(tmpdir(), "oi-outside-"));
  try {
    writeFileSync(path.join(root, "index.html"), "<title>Open Immerse</title>\n");
    writeFileSync(path.join(outside, "secret.html"), "secret");
    symlinkSync(path.join(outside, "secret.html"), path.join(root, "secret.html"));
    run(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
    rmSync(outside, { recursive: true, force: true });
  }
}

it("serves html inside the renderer root and rejects escapes", () => {
  withRoot((root) => {
    const index = realpathSync(path.join(root, "index.html"));
    expect(resolveInsideRoot(root, "oi-app://app/index.html")).toBe(index);
    expect(resolveInsideRoot(root, "oi-app://app/%2e%2e%2fsecret.html")).toBeNull();
    expect(resolveInsideRoot(root, "oi-app://app/index.html%00.html")).toBeNull();
    expect(resolveInsideRoot(root, "oi-app://app/%5C..%5Csecret.html")).toBeNull();
    expect(resolveInsideRoot(root, "oi-app://evil/index.html")).toBeNull();
    expect(resolveInsideRoot(root, "oi-app://app/secret.html")).toBeNull();
    expect(resolveInsideRoot(root, "file:///etc/passwd")).toBeNull();

    const served = resolveStaticFile(root, "oi-app://app/index.html", "GET");
    expect(served.kind).toBe("file");
    if (served.kind === "file") {
      expect(served.contentType).toBe("text/html; charset=utf-8");
      expect(served.body.byteLength).toBeGreaterThan(0);
    }
    expect(resolveStaticFile(root, "oi-app://app/index.html", "POST").kind).toBe("method");
    expect(bodyForMethod("HEAD", new Uint8Array([1]))).toBeNull();
    expect(bodyForMethod("GET", new Uint8Array([1]))).toEqual(new Uint8Array([1]));
  });
});

it("rejects a directory that is not an html file", () => {
  const root = mkdtempSync(path.join(tmpdir(), "oi-dir-"));
  try {
    mkdirSync(path.join(root, "nested"));
    expect(resolveInsideRoot(root, "oi-app://app/nested")).toBeNull();
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

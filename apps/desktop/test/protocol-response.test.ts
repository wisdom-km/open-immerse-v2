import { mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { expect, it } from "vitest";

import { respond } from "../src/main/protocol-response.js";
import { CONTENT_SECURITY_POLICY } from "../src/main/security/csp.js";

const PAGE = "<title>Open Immerse</title>\n";

async function withPage(run: (root: string) => Promise<void> | void): Promise<void> {
  const root = mkdtempSync(path.join(tmpdir(), "oi-app-"));
  const outside = mkdtempSync(path.join(tmpdir(), "oi-outside-"));
  try {
    writeFileSync(path.join(root, "index.html"), PAGE);
    writeFileSync(path.join(outside, "secret.html"), "secret");
    symlinkSync(path.join(outside, "secret.html"), path.join(root, "secret.html"));
    await run(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
    rmSync(outside, { recursive: true, force: true });
  }
}

it("returns 405 when POST targets an html file inside the root", async () => {
  await withPage((root) => {
    const response = respond(root, "oi-app://app/index.html", "POST");
    expect(response.status).toBe(405);
  });
});

it("returns 404 when the html file is missing", async () => {
  await withPage((root) => {
    const response = respond(root, "oi-app://app/missing.html", "GET");
    expect(response.status).toBe(404);
  });
});

it("returns 404 when the path is a symlink outside the root", async () => {
  await withPage((root) => {
    const response = respond(root, "oi-app://app/secret.html", "GET");
    expect(response.status).toBe(404);
  });
});

it("returns 200 when GET reads an html file inside the root", async () => {
  await withPage(async (root) => {
    const response = respond(root, "oi-app://app/index.html", "GET");
    const body = new Uint8Array(await response.arrayBuffer());
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("text/html; charset=utf-8");
    expect(body).toEqual(new Uint8Array(readFileSync(path.join(root, "index.html"))));
    expect(response.headers.get("content-security-policy")).toBe(CONTENT_SECURITY_POLICY);
  });
});

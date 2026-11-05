import {
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { expect, it } from "vitest";

import { respond } from "../src/main/protocol-response.js";
import { CONTENT_SECURITY_POLICY } from "../src/main/security/csp.js";

const PAGE = "<title>Open Immerse</title>\n";

async function withPage(
  run: (root: string) => Promise<void> | void,
): Promise<void> {
  const root = mkdtempSync(path.join(tmpdir(), "oi-app-"));
  try {
    writeFileSync(path.join(root, "index.html"), PAGE);
    await run(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

it("returns 405 when POST targets an html file inside the root", async () => {
  await withPage((root) => {
    const response = respond(root, "oi-app://app/index.html", "POST");
    expect(response.status).toBe(405);
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
  });
});

it("returns 404 when the html file is missing", async () => {
  await withPage((root) => {
    const response = respond(root, "oi-app://app/missing.html", "GET");
    expect(response.status).toBe(404);
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
  });
});

it("returns 404 when the path escapes the root", async () => {
  await withPage((root) => {
    const response = respond(root, "oi-app://app/%2e%2e%2fsecret.html", "GET");
    expect(response.status).toBe(404);
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
  });
});

it("returns 404 when a directory link points outside the root", () => {
  const root = mkdtempSync(path.join(tmpdir(), "oi-app-"));
  const outside = mkdtempSync(path.join(tmpdir(), "oi-outside-"));
  try {
    writeFileSync(path.join(outside, "secret.html"), "secret");
    symlinkSync(outside, path.join(root, "linked"), "junction");
    const response = respond(root, "oi-app://app/linked/secret.html", "GET");
    expect(response.status).toBe(404);
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
  } finally {
    rmSync(root, { recursive: true, force: true });
    rmSync(outside, { recursive: true, force: true });
  }
});

it("returns 200 when GET reads an html file inside the root", async () => {
  await withPage(async (root) => {
    const response = respond(root, "oi-app://app/index.html", "GET");
    const body = new Uint8Array(await response.arrayBuffer());
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe(
      "text/html; charset=utf-8",
    );
    expect(body).toEqual(
      new Uint8Array(readFileSync(path.join(root, "index.html"))),
    );
    expect(response.headers.get("content-security-policy")).toBe(
      CONTENT_SECURITY_POLICY,
    );
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
  });
});

it("returns 200 without a body when HEAD reads an html file", async () => {
  await withPage(async (root) => {
    const response = respond(root, "oi-app://app/index.html", "HEAD");
    const body = new Uint8Array(await response.arrayBuffer());
    expect(response.status).toBe(200);
    expect(body.byteLength).toBe(0);
    expect(response.headers.get("content-type")).toBe(
      "text/html; charset=utf-8",
    );
    expect(response.headers.get("content-security-policy")).toBe(
      CONTENT_SECURITY_POLICY,
    );
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
  });
});

it("returns 200 when GET reads html with an uppercase extension", async () => {
  const root = mkdtempSync(path.join(tmpdir(), "oi-app-"));
  try {
    writeFileSync(path.join(root, "INDEX.HTML"), PAGE);
    const response = respond(root, "oi-app://app/INDEX.HTML", "GET");
    const body = new Uint8Array(await response.arrayBuffer());
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe(
      "text/html; charset=utf-8",
    );
    expect(body).toEqual(
      new Uint8Array(readFileSync(path.join(root, "INDEX.HTML"))),
    );
    expect(response.headers.get("content-security-policy")).toBe(
      CONTENT_SECURITY_POLICY,
    );
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

it("returns 404 when the extension is not html, javascript, or css", async () => {
  await withPage((root) => {
    writeFileSync(path.join(root, "a.mjs"), "export {}\n");
    writeFileSync(path.join(root, "a.exe"), "x");
    writeFileSync(path.join(root, "icon.svg"), "<svg></svg>\n");
    writeFileSync(path.join(root, "icon.png"), "png");
    for (const name of ["a.mjs", "a.exe", "icon.svg", "icon.png"]) {
      const response = respond(root, `oi-app://app/${name}`, "GET");
      expect(response.status).toBe(404);
      expect(response.headers.get("content-type")).toBe(
        "text/plain; charset=utf-8",
      );
      expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    }
  });
});

it("returns 200 when GET reads javascript or css inside the root", async () => {
  await withPage(async (root) => {
    writeFileSync(path.join(root, "main.js"), "console.log(1)\n");
    writeFileSync(path.join(root, "library.css"), "body{}\n");
    const script = respond(root, "oi-app://app/main.js", "GET");
    const style = respond(root, "oi-app://app/library.css", "GET");
    expect(script.status).toBe(200);
    expect(style.status).toBe(200);
    expect(script.headers.get("content-type")).toBe(
      "text/javascript; charset=utf-8",
    );
    expect(style.headers.get("content-type")).toBe("text/css; charset=utf-8");
    expect(new Uint8Array(await script.arrayBuffer())).toEqual(
      new Uint8Array(readFileSync(path.join(root, "main.js"))),
    );
    expect(new Uint8Array(await style.arrayBuffer())).toEqual(
      new Uint8Array(readFileSync(path.join(root, "library.css"))),
    );
    expect(script.headers.get("content-security-policy")).toBe(
      CONTENT_SECURITY_POLICY,
    );
    expect(script.headers.get("x-content-type-options")).toBe("nosniff");
    expect(style.headers.get("x-content-type-options")).toBe("nosniff");
  });
});

it("returns 200 without a body when HEAD reads css", async () => {
  await withPage(async (root) => {
    writeFileSync(path.join(root, "library.css"), "body{}\n");
    const response = respond(root, "oi-app://app/library.css", "HEAD");
    const body = new Uint8Array(await response.arrayBuffer());
    expect(response.status).toBe(200);
    expect(body.byteLength).toBe(0);
    expect(response.headers.get("content-type")).toBe(
      "text/css; charset=utf-8",
    );
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
  });
});

it("returns 405 when POST targets javascript inside the root", async () => {
  await withPage((root) => {
    writeFileSync(path.join(root, "main.js"), "console.log(1)\n");
    const response = respond(root, "oi-app://app/main.js", "POST");
    expect(response.status).toBe(405);
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
  });
});

it("returns 404 when a javascript path escapes the root", async () => {
  await withPage((root) => {
    const response = respond(root, "oi-app://app/%2e%2e%2fsecret.js", "GET");
    expect(response.status).toBe(404);
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
  });
});

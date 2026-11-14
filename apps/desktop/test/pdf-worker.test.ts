import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { expect, it } from "vitest";

import { respond } from "../src/main/protocol-response.js";
import { CONTENT_SECURITY_POLICY } from "../src/main/security/csp.js";

const copyScript = pathToFileURL(
  path.resolve("apps/desktop/scripts/copy-pdf-worker.mjs"),
).href;

type Copied = { readonly source: string; readonly dest: string };

it("copies pdf.worker.mjs to a same-origin js file with the same bytes", async () => {
  const tool = (await import(copyScript)) as {
    copyPdfWorker(dest?: string): Copied;
    pdfWorkerDest: string;
    pdfWorkerFileName: string;
    pdfjsDistVersion(): string;
  };
  expect(tool.pdfjsDistVersion()).toBe("6.5.438");
  expect(path.basename(tool.pdfWorkerDest)).toBe("pdf.worker.js");
  const root = mkdtempSync(path.join(tmpdir(), "oi-worker-"));
  try {
    const copied = tool.copyPdfWorker(path.join(root, "pdf.worker.js"));
    expect(path.basename(copied.source)).toBe("pdf.worker.mjs");
    expect(readFileSync(copied.dest).equals(readFileSync(copied.source))).toBe(
      true,
    );
    const response = respond(root, "oi-app://app/pdf.worker.js", "GET");
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe(
      "text/javascript; charset=utf-8",
    );
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(response.headers.get("content-security-policy")).toBe(
      CONTENT_SECURITY_POLICY,
    );
    expect(CONTENT_SECURITY_POLICY).toBe(
      "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' oi-asset:; font-src 'self'; connect-src 'self' oi-asset:; worker-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'",
    );
    expect(CONTENT_SECURITY_POLICY.includes("wasm-unsafe-eval")).toBe(false);
    expect(CONTENT_SECURITY_POLICY.includes("blob:")).toBe(false);
    expect(respond(root, "oi-app://app/pdf.worker.mjs", "GET").status).toBe(
      404,
    );
    expect(path.resolve(tool.pdfWorkerDest)).toBe(
      path.resolve("apps/desktop/src/renderer/pdf.worker.js"),
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

it("copies the openjpeg and jbig2 js fallbacks and not the wasm files", async () => {
  const tool = (await import(copyScript)) as {
    copyPdfImageFallbacks(dir?: string): Copied[];
    imageFallbackFileNames: readonly string[];
    imageFallbackDir: string;
  };
  expect(tool.imageFallbackFileNames).toEqual([
    "openjpeg_nowasm_fallback.js",
    "jbig2_nowasm_fallback.js",
  ]);
  expect(path.resolve(tool.imageFallbackDir)).toBe(
    path.resolve("apps/desktop/src/renderer"),
  );
  const root = mkdtempSync(path.join(tmpdir(), "oi-image-"));
  try {
    const copied = tool.copyPdfImageFallbacks(root);
    expect(copied.map((item) => path.basename(item.dest))).toEqual(
      tool.imageFallbackFileNames,
    );
    for (const item of copied) {
      expect(path.basename(path.dirname(item.source))).toBe("wasm");
      expect(path.basename(item.source)).toBe(path.basename(item.dest));
      expect(item.dest.endsWith(".wasm")).toBe(false);
      expect(item.dest.endsWith(".mjs")).toBe(false);
      expect(readFileSync(item.dest).equals(readFileSync(item.source))).toBe(
        true,
      );
      const response = respond(
        root,
        `oi-app://app/${path.basename(item.dest)}`,
        "GET",
      );
      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toBe(
        "text/javascript; charset=utf-8",
      );
      expect(response.headers.get("content-security-policy")).toBe(
        CONTENT_SECURITY_POLICY,
      );
    }
    expect(readdirSync(root).sort()).toEqual([
      "jbig2_nowasm_fallback.js",
      "openjpeg_nowasm_fallback.js",
    ]);
    expect(respond(root, "oi-app://app/openjpeg.wasm", "GET").status).toBe(404);
    expect(respond(root, "oi-app://app/jbig2.wasm", "GET").status).toBe(404);
    expect(
      respond(root, "oi-app://app/openjpeg_nowasm_fallback.mjs", "GET").status,
    ).toBe(404);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

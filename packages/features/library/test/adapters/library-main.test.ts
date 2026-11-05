import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { expect, it } from "vitest";

import { createLibraryMain } from "../../src/adapters/library-main.js";
import { pathLeaks } from "../support/path-leaks.js";

const ADDED = Date.parse("2026-11-05T04:00:00.000Z");

function pdf(): Uint8Array {
  return new TextEncoder().encode("%PDF-1.4\n% paper\n");
}

it("lists the imported paper when the picker returns a file", async () => {
  const root = mkdtempSync(path.join(tmpdir(), "oitest-library-main-"));
  const source = path.join(root, "Paper.pdf");
  writeFileSync(source, pdf());
  const main = createLibraryMain({
    dataRoot: path.join(root, "data"),
    clock: { nowMs: () => ADDED },
    pickPdf: { pick: () => ({ kind: "chosen", filePath: source }) },
  });
  try {
    const imported = await main.handlers.import({});
    const again = await main.handlers.import({});
    const listed = await main.handlers.list({ view: "all" });
    const recent = await main.handlers.list({ view: "recent" });
    expect(imported.ok && imported.value.duplicate).toBe(false);
    expect(imported.ok && imported.value.entry.title).toBe("Paper");
    expect(again.ok && again.value.duplicate).toBe(true);
    expect(listed.ok && listed.value).toHaveLength(1);
    expect(recent.ok && recent.value).toEqual([]);
    expect(pathLeaks(imported, [root])).toEqual([]);
    expect(pathLeaks(listed, [root])).toEqual([]);
  } finally {
    main.close();
    main.close();
    rmSync(root, { recursive: true, force: true });
  }
});

it("returns handler_threw when the data root cannot be opened", async () => {
  const secret = "secret-root-hidden";
  const main = createLibraryMain({
    dataRoot: `${secret}\u0000`,
    clock: { nowMs: () => ADDED },
    pickPdf: { pick: () => ({ kind: "cancelled" }) },
  });
  try {
    const listed = await main.handlers.list({ view: "recent" });
    const imported = await main.handlers.import({});
    expect(listed).toEqual({
      ok: false,
      error: { code: "handler_threw", retryable: true },
    });
    expect(imported).toEqual({
      ok: false,
      error: { code: "handler_threw", retryable: true },
    });
    expect(JSON.stringify(listed).includes(secret)).toBe(false);
    expect(JSON.stringify(imported).includes(secret)).toBe(false);
  } finally {
    main.close();
  }
});

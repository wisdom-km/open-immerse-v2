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
    const bind = await main.reading.bindReadingAsset({} as never);
    const revoke = await main.reading.revokeReadingAsset({} as never);
    const read = await main.reading.getProgressPage({} as never);
    const write = await main.reading.setProgressPage({} as never);
    const threw = {
      ok: false,
      error: { code: "handler_threw", retryable: true },
    };
    expect(listed).toEqual(threw);
    expect(imported).toEqual(threw);
    expect(bind).toEqual(threw);
    expect(revoke).toEqual(threw);
    expect(read).toEqual(threw);
    expect(write).toEqual(threw);
    const encoded = JSON.stringify([
      listed,
      imported,
      bind,
      revoke,
      read,
      write,
    ]);
    expect(encoded.includes(secret)).toBe(false);
  } finally {
    main.close();
  }
});

import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { createLibraryMain, type LibraryMain } from "@oi/feature-library/main";
import { expect, it, vi } from "vitest";

import { commandMap } from "../src/main/library-wiring.js";
import type { IpcCommandContext } from "../src/main/ipc/ipc-router.js";

vi.mock("electron", () => {
  return {
    app: {},
    BrowserWindow: {},
    dialog: {},
    Menu: {},
  };
});

const context: IpcCommandContext = { requestId: "map" };

it("maps the four reading channels onto that library main", async () => {
  const root = mkdtempSync(path.join(tmpdir(), "oitest-reading-map-"));
  const main = openMain(root);
  try {
    const seen: string[] = [];
    watch(main.reading, seen);
    const handlers = commandMap(main);
    await handlers.get("library.bindReadingAsset")?.({ id: "x" }, context);
    await handlers.get("library.revokeReadingAsset")?.({ id: "x" }, context);
    await handlers.get("library.getProgressPage")?.({ id: "x" }, context);
    await handlers.get("library.setProgressPage")?.({ id: "x" }, context);
    expect(seen).toEqual([
      "library.bindReadingAsset",
      "library.revokeReadingAsset",
      "library.getProgressPage",
      "library.setProgressPage",
    ]);
  } finally {
    main.close();
    rmSync(root, { recursive: true, force: true });
  }
});

function watch(reading: LibraryMain["reading"], seen: string[]): void {
  const target = reading as unknown as Record<string, () => Promise<unknown>>;
  target.bindReadingAsset = note(seen, "library.bindReadingAsset");
  target.revokeReadingAsset = note(seen, "library.revokeReadingAsset");
  target.getProgressPage = note(seen, "library.getProgressPage");
  target.setProgressPage = note(seen, "library.setProgressPage");
}

function note(seen: string[], channel: string): () => Promise<unknown> {
  return () => {
    seen.push(channel);
    return Promise.resolve({ ok: true, value: { channel } });
  };
}

function openMain(root: string): LibraryMain {
  const source = path.join(root, "Paper.pdf");
  writeFileSync(source, new TextEncoder().encode("%PDF-1.4\n% paper\n"));
  return createLibraryMain({
    dataRoot: path.join(root, "data"),
    clock: { nowMs: () => Date.parse("2026-11-09T10:42:00.000Z") },
    pickPdf: { pick: () => ({ kind: "chosen", filePath: source }) },
  });
}

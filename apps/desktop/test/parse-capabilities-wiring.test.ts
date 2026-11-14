import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath, pathToFileURL } from "node:url";

import { createLibraryMain, type LibraryMain } from "@oi/feature-library/main";
import { expect, it, vi } from "vitest";

import {
  registerIpcRouter,
  type IpcListener,
} from "../src/main/ipc/ipc-router.js";
import { ipcRegistry } from "../src/main/ipc/registry.generated.js";
import type { IpcInvokeEvent } from "../src/main/ipc/sender-frame.js";
import {
  openWiredLibrary,
  wiredLibraryCommands,
} from "../src/main/library-wiring.js";

vi.mock("electron", () => {
  return {
    app: {},
    BrowserWindow: {},
    dialog: {},
    Menu: {},
    protocol: {},
  };
});

const CHANNEL = "parsing.getParseCapabilities";
const ADDED = Date.parse("2026-11-14T07:00:00.000Z");
const invokeEvent: IpcInvokeEvent = {
  senderFrame: { url: "oi-app://app/index.html" },
  sender: { id: 1 },
};

it("resolves the settings migration next to the emitted adapter", () => {
  const emitted = pathToFileURL(
    path.resolve("packages/features/settings/dist/adapters/settings-main.js"),
  );
  const sql = fileURLToPath(
    new URL("../../migrations/0001_set_providers.sql", emitted),
  );
  expect(existsSync(sql)).toBe(true);
});

it("keeps library rows and reports unconfigured after the settings migration", async () => {
  const root = mkdtempSync(path.join(tmpdir(), "oitest-parse-wire-"));
  const dataRoot = path.join(root, "data");
  const first = openLibrary(root, dataRoot);
  try {
    const imported = await first.handlers.import({});
    expect(imported.ok).toBe(true);
    if (!imported.ok) {
      return;
    }
    const id = imported.value.entry.id;
    first.close();
    const main = openWiredLibrary(dataRoot);
    try {
      expect(main.storage?.appSchema).toBe(1);
      const listed = await main.handlers.list({ view: "all" });
      expect(listed.ok && listed.value).toEqual([
        expect.objectContaining({ id }),
      ]);
      expect(await ask(main)).toEqual({
        ok: true,
        value: { state: "unconfigured" },
      });
    } finally {
      main.close();
    }
  } finally {
    first.close();
    rmSync(root, { recursive: true, force: true });
  }
});

it("returns handler_threw through the router when set_providers is absent", async () => {
  const root = mkdtempSync(path.join(tmpdir(), "oitest-parse-absent-"));
  const dataRoot = path.join(root, "data");
  const first = openLibrary(root, dataRoot);
  const databaseFile = first.storage?.layout.databaseFile;
  first.close();
  if (databaseFile === undefined) {
    throw new Error("library storage missing");
  }
  raiseSchema(databaseFile);
  const main = openWiredLibrary(dataRoot);
  try {
    expect(main.storage?.mode).toBe("read-only");
    expect(main.storage?.writes).toBe(0);
    expect(await ask(main)).toEqual({
      ok: false,
      error: { code: "handler_threw", retryable: true },
    });
  } finally {
    main.close();
    rmSync(root, { recursive: true, force: true });
  }
});

it("leaves the library unopened when the settings migration cannot be read", async () => {
  const root = mkdtempSync(path.join(tmpdir(), "oitest-parse-unread-"));
  const closed = {
    ok: false,
    error: { code: "handler_threw", retryable: true },
  };
  const main = openWiredLibrary(
    path.join(root, "data"),
    path.join(root, "missing-settings"),
  );
  try {
    expect(main.storage).toBeNull();
    expect(await main.handlers.list({ view: "all" })).toEqual(closed);
    expect(await main.handlers.import({})).toEqual(closed);
    expect(await ask(main)).toEqual(closed);
  } finally {
    main.close();
    rmSync(root, { recursive: true, force: true });
  }
});

it("returns handler_threw when the library cannot be opened", async () => {
  const main = openWiredLibrary("secret-root\u0000");
  try {
    expect(main.storage).toBeNull();
    expect(await ask(main)).toEqual({
      ok: false,
      error: { code: "handler_threw", retryable: true },
    });
  } finally {
    main.close();
  }
});

function openLibrary(root: string, dataRoot: string): LibraryMain {
  const source = path.join(root, "Paper.pdf");
  writeFileSync(source, new TextEncoder().encode("%PDF-1.4\n% paper\n"));
  return createLibraryMain({
    dataRoot,
    clock: { nowMs: () => ADDED },
    pickPdf: { pick: () => ({ kind: "chosen", filePath: source }) },
  });
}

function raiseSchema(databaseFile: string): void {
  const database = new DatabaseSync(databaseFile);
  database.exec("UPDATE app_meta SET app_schema = 2 WHERE id = 1");
  database.close();
}

async function ask(main: LibraryMain): Promise<unknown> {
  const listeners = new Map<string, IpcListener>();
  registerIpcRouter({
    registry: ipcRegistry.filter((entry) => entry.channel === CHANNEL),
    handlers: wiredLibraryCommands(main),
    bind(channel, listener) {
      listeners.set(channel, listener);
    },
    acceptsSender: () => true,
    logOversize() {
      return undefined;
    },
    logHandlerThrew() {
      return undefined;
    },
    nowIso: () => "2026-11-14T07:00:00.000Z",
  });
  const listener = listeners.get(CHANNEL);
  if (listener === undefined) {
    throw new Error("parsing handler missing");
  }
  return listener(invokeEvent, {});
}

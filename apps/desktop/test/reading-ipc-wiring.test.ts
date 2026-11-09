import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { createLibraryMain, type LibraryMain } from "@oi/feature-library/main";
import { expect, it } from "vitest";

import {
  registerIpcRouter,
  type IpcCommandHandler,
  type IpcListener,
} from "../src/main/ipc/ipc-router.js";
import type { IpcPassThrough } from "../src/main/ipc/pass-through.js";
import { ipcRegistry } from "../src/main/ipc/registry.generated.js";
import type { IpcInvokeEvent } from "../src/main/ipc/sender-frame.js";

const ADDED = Date.parse("2026-11-09T07:20:00.000Z");
const missing = "ab".repeat(32);
const channels = [
  "library.bindReadingAsset",
  "library.revokeReadingAsset",
  "library.getProgressPage",
  "library.setProgressPage",
] as const;

const invokeEvent: IpcInvokeEvent = {
  senderFrame: { url: "oi-app://app/index.html" },
  sender: { id: 1 },
};

it("routes the current generation and rejects the others", async () => {
  const root = mkdtempSync(path.join(tmpdir(), "oitest-reading-ipc-"));
  const main = openMain(root);
  try {
    const id = await importedId(main);
    const listeners = bindReading(main);
    const absent = await call(listeners, "library.bindReadingAsset", {
      id: missing,
    });
    expect(absent).toEqual({
      ok: false,
      error: { code: "not_found", retryable: false },
    });
    expect(JSON.stringify(absent).includes("assetId")).toBe(false);
    const unbound = await call(listeners, "library.getProgressPage", {
      id,
      generation: 1,
    });
    expect(unbound).toEqual({
      ok: false,
      error: { code: "rejected", retryable: false, id, generation: 1 },
    });
    expect(JSON.stringify(unbound).includes("assetId")).toBe(false);
    expect(await call(listeners, "library.bindReadingAsset", { id })).toEqual({
      ok: true,
      value: { id, assetId: "1", generation: 1 },
    });
    expect(
      await call(listeners, "library.getProgressPage", { id, generation: 1 }),
    ).toEqual({
      ok: true,
      value: { id, generation: 1, progressPage: null },
    });
    expect(
      await call(listeners, "library.setProgressPage", {
        id,
        generation: 1,
        progressPage: 4,
      }),
    ).toEqual({
      ok: true,
      value: { id, generation: 1, progressPage: 4 },
    });
    expect(
      await call(listeners, "library.getProgressPage", { id, generation: 2 }),
    ).toEqual({
      ok: false,
      error: { code: "rejected", retryable: false, id, generation: 2 },
    });
    expect(
      await call(listeners, "library.revokeReadingAsset", {
        id,
        generation: 1,
      }),
    ).toEqual({ ok: true, value: { id, generation: 1 } });
    expect(
      await call(listeners, "library.getProgressPage", { id, generation: 1 }),
    ).toEqual({
      ok: false,
      error: { code: "rejected", retryable: false, id, generation: 1 },
    });
  } finally {
    main.close();
    rmSync(root, { recursive: true, force: true });
  }
});

it("rejects the revoked generation after the next bind", async () => {
  const root = mkdtempSync(path.join(tmpdir(), "oitest-reading-ipc-again-"));
  const main = openMain(root);
  try {
    const id = await importedId(main);
    const listeners = bindReading(main);
    expect(await call(listeners, "library.bindReadingAsset", { id })).toEqual({
      ok: true,
      value: { id, assetId: "1", generation: 1 },
    });
    expect(
      await call(listeners, "library.setProgressPage", {
        id,
        generation: 1,
        progressPage: 4,
      }),
    ).toEqual({
      ok: true,
      value: { id, generation: 1, progressPage: 4 },
    });
    expect(
      await call(listeners, "library.revokeReadingAsset", {
        id,
        generation: 1,
      }),
    ).toEqual({ ok: true, value: { id, generation: 1 } });
    expect(await call(listeners, "library.bindReadingAsset", { id })).toEqual({
      ok: true,
      value: { id, assetId: "2", generation: 2 },
    });
    await expectRejected(listeners, "library.getProgressPage", {
      id,
      generation: 1,
    });
    await expectRejected(listeners, "library.setProgressPage", {
      id,
      generation: 1,
      progressPage: 4,
    });
    await expectRejected(listeners, "library.revokeReadingAsset", {
      id,
      generation: 1,
    });
    expect(
      await call(listeners, "library.getProgressPage", { id, generation: 2 }),
    ).toEqual({
      ok: true,
      value: { id, generation: 2, progressPage: 4 },
    });
  } finally {
    main.close();
    rmSync(root, { recursive: true, force: true });
  }
});

it("starts at generation 1 when another library main opens the same files", async () => {
  const root = mkdtempSync(path.join(tmpdir(), "oitest-reading-ipc-next-"));
  const first = openMain(root);
  try {
    const id = await importedId(first);
    expect(
      await call(bindReading(first), "library.bindReadingAsset", { id }),
    ).toEqual({ ok: true, value: { id, assetId: "1", generation: 1 } });
    first.close();
    const second = openMain(root);
    try {
      expect(
        await call(bindReading(second), "library.bindReadingAsset", { id }),
      ).toEqual({ ok: true, value: { id, assetId: "1", generation: 1 } });
    } finally {
      second.close();
    }
  } finally {
    first.close();
    rmSync(root, { recursive: true, force: true });
  }
});

function openMain(root: string): LibraryMain {
  const source = path.join(root, "Paper.pdf");
  writeFileSync(source, new TextEncoder().encode("%PDF-1.4\n% paper\n"));
  return createLibraryMain({
    dataRoot: path.join(root, "data"),
    clock: { nowMs: () => ADDED },
    pickPdf: { pick: () => ({ kind: "chosen", filePath: source }) },
  });
}

async function importedId(main: LibraryMain): Promise<string> {
  const imported = await main.handlers.import({});
  if (!imported.ok) {
    throw new Error("import failed");
  }
  return imported.value.entry.id;
}

function bindReading(main: LibraryMain): ReadonlyMap<string, IpcListener> {
  const listeners = new Map<string, IpcListener>();
  const reading = main.reading;
  registerIpcRouter({
    registry: ipcRegistry.filter((entry) =>
      (channels as readonly string[]).includes(entry.channel),
    ),
    handlers: new Map<string, IpcCommandHandler>([
      [
        "library.bindReadingAsset",
        (payload) => reading.bindReadingAsset(payload as never),
      ],
      [
        "library.revokeReadingAsset",
        (payload) => reading.revokeReadingAsset(payload as never),
      ],
      [
        "library.getProgressPage",
        (payload) => reading.getProgressPage(payload as never),
      ],
      [
        "library.setProgressPage",
        (payload) => reading.setProgressPage(payload as never),
      ],
    ]),
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
    nowIso: () => "2026-11-09T07:20:00.000Z",
  });
  return listeners;
}

async function expectRejected(
  listeners: ReadonlyMap<string, IpcListener>,
  channel: string,
  payload: {
    readonly id: string;
    readonly generation: number;
    readonly progressPage?: number;
  },
): Promise<void> {
  const result = await call(listeners, channel, payload);
  expect(result).toEqual({
    ok: false,
    error: {
      code: "rejected",
      retryable: false,
      id: payload.id,
      generation: payload.generation,
    },
  });
  expect(JSON.stringify(result).includes("assetId")).toBe(false);
}

function call(
  listeners: ReadonlyMap<string, IpcListener>,
  channel: string,
  payload: unknown,
): Promise<IpcPassThrough> {
  const listener = listeners.get(channel);
  if (listener === undefined) {
    return Promise.reject(new Error("missing listener"));
  }
  return listener(invokeEvent, payload);
}

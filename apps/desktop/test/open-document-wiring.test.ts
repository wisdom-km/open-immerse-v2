import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { expect, it, vi } from "vitest";

import type { IpcCommandContext } from "../src/main/ipc/ipc-router.js";
import { startLibrary } from "../src/main/library-wiring.js";
import { openDocumentChannel } from "../src/main/open-document-wiring.js";

const picked = vi.hoisted(() => ({ files: [] as string[] }));

vi.mock("electron", () => {
  return {
    app: { on: () => undefined },
    BrowserWindow: { getAllWindows: () => [] },
    dialog: { showOpenDialogSync: () => picked.files },
    Menu: {
      setApplicationMenu: () => undefined,
      buildFromTemplate: () => [],
    },
  };
});

const context: IpcCommandContext = { requestId: "open" };

it("writes recent after open and does not put an older page back", async () => {
  const root = mkdtempSync(path.join(tmpdir(), "oitest-open-document-"));
  const source = path.join(root, "Paper.pdf");
  writeFileSync(source, "%PDF-1.4\n% paper\n");
  picked.files = [source];
  const handlers = startLibrary(path.join(root, "data"));
  try {
    const id = await importedId(handlers);
    expect(await recentIds(handlers)).not.toContain(id);
    expect(await call(handlers, openDocumentChannel, { id })).toEqual({
      ok: true,
      value: { jobId: "1" },
    });
    expect(await recentIds(handlers)).toContain(id);
    const firstOpenedAt = await openedAtOf(handlers, id);
    expect(await pageOf(handlers, id)).toBeNull();
    expect(await setPage(handlers, id, 4)).toEqual({
      ok: true,
      value: { id, generation: 1, progressPage: 4 },
    });
    await waitForNextMillisecond(firstOpenedAt);
    const again = await call(handlers, openDocumentChannel, { id });
    expect(again).toEqual({ ok: true, value: { jobId: "1" } });
    expect(await pageOf(handlers, id)).toBe(4);
    expect(await openedAtOf(handlers, id)).not.toBe(firstOpenedAt);
    expect(JSON.stringify(again)).not.toContain("originalPath");
    expect(JSON.stringify(again)).not.toContain(root);
    expect(JSON.stringify(again)).not.toContain("message");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

it("returns handler_threw when the library cannot be opened", async () => {
  const handlers = startLibrary("");
  const result = await call(handlers, openDocumentChannel, {
    id: "ab".repeat(32),
  });
  expect(result).toEqual({
    ok: false,
    error: { code: "handler_threw", retryable: true },
  });
  expect(JSON.stringify(result)).not.toContain("message");
});

type HandlerMap = ReturnType<typeof startLibrary>;

type Reply = {
  readonly ok: boolean;
  readonly value?: unknown;
  readonly error?: unknown;
};

async function importedId(handlers: HandlerMap): Promise<string> {
  const imported = await call(handlers, "library.import", {});
  if (!imported.ok || imported.value === undefined) {
    throw new Error("import failed");
  }
  const value = imported.value as { readonly entry: { readonly id: string } };
  return value.entry.id;
}

async function recentIds(handlers: HandlerMap): Promise<readonly string[]> {
  const listed = await call(handlers, "library.list", { view: "recent" });
  if (!listed.ok) {
    return [];
  }
  const rows = listed.value as readonly { readonly id: string }[];
  return rows.map((row) => row.id);
}

async function openedAtOf(handlers: HandlerMap, id: string): Promise<string> {
  const listed = await call(handlers, "library.list", { view: "recent" });
  if (!listed.ok) {
    throw new Error("list failed");
  }
  const rows = listed.value as readonly {
    readonly id: string;
    readonly openedAt: string | null;
  }[];
  const hit = rows.find((row) => row.id === id);
  if (hit?.openedAt == null) {
    throw new Error("missing openedAt");
  }
  return hit.openedAt;
}

async function pageOf(
  handlers: HandlerMap,
  id: string,
): Promise<number | null> {
  const bound = await call(handlers, "library.bindReadingAsset", { id });
  if (!bound.ok) {
    throw new Error("bind failed");
  }
  const generation = (bound.value as { readonly generation: number })
    .generation;
  const read = await call(handlers, "library.getProgressPage", {
    id,
    generation,
  });
  if (!read.ok) {
    throw new Error("read failed");
  }
  return (read.value as { readonly progressPage: number | null }).progressPage;
}

function setPage(
  handlers: HandlerMap,
  id: string,
  progressPage: number,
): Promise<unknown> {
  return call(handlers, "library.setProgressPage", {
    id,
    generation: 1,
    progressPage,
  });
}

async function call(
  handlers: HandlerMap,
  channel: string,
  payload: unknown,
): Promise<Reply> {
  const handler = handlers.get(channel);
  if (handler === undefined) {
    throw new Error("missing handler");
  }
  return handler(payload, context) as Promise<Reply>;
}

async function waitForNextMillisecond(previous: string): Promise<void> {
  const started = Date.now();
  while (new Date(Date.now()).toISOString() === previous) {
    if (Date.now() - started > 50) {
      return;
    }
    await new Promise((resolve) => {
      setTimeout(resolve, 2);
    });
  }
}

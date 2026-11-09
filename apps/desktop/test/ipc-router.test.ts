import { expect, it } from "vitest";

import {
  registerIpcRouter,
  type HandlerThrewLog,
  type IpcCommandHandler,
  type IpcListener,
  type IpcOversizeLog,
} from "../src/main/ipc/ipc-router.js";
import { IPC_OVERSIZE_BYTES } from "../src/main/ipc/oversize.js";
import {
  ipcRegistry,
  type IpcRegistryEntry,
} from "../src/main/ipc/registry.generated.js";
import type { IpcInvokeEvent } from "../src/main/ipc/sender-frame.js";

const frame = { url: "oi-app://app/index.html" };
const invokeEvent: IpcInvokeEvent = { senderFrame: frame, sender: { id: 1 } };

it("registers one handle for each exposed library command", () => {
  const channels = ipcRegistry.map((entry) => entry.channel);
  expect(channels).toEqual([
    "library.bindReadingAsset",
    "library.getProgressPage",
    "library.import",
    "library.importDropped",
    "library.list",
    "library.relocate",
    "library.revokeReadingAsset",
    "library.setProgressPage",
  ]);
  const handlers = new Map<string, IpcCommandHandler>(
    channels.map((channel) => [
      channel,
      () => Promise.resolve({ ok: true, value: {} }),
    ]),
  );
  const harness = bind(ipcRegistry, handlers);
  expect(harness.count).toBe(channels.length);
  expect([...harness.listeners.keys()]).toEqual(channels);
});

it("returns invalid_payload when a relocate id fails the pattern", async () => {
  const handlers = new Map<string, IpcCommandHandler>(
    ipcRegistry.map((entry) => [
      entry.channel,
      () => Promise.resolve({ ok: true, value: {} }),
    ]),
  );
  const harness = bind(ipcRegistry, handlers);
  const result = await invokeChannel(harness.listeners, "library.relocate", {
    id: "not-a-hash",
  });
  expect(result).toEqual({
    ok: false,
    error: { code: "invalid_payload", retryable: false },
  });
});

it("requires a handler when an exposed command is registered", () => {
  expect(() => bind([command], new Map())).toThrow("missing ipc handler");
});

it("does not bind a handle when the registry entry is an event", () => {
  const harness = bind([eventEntry], new Map());
  expect(harness.count).toBe(0);
});

it("returns handler_threw once when an idempotent handler throws", async () => {
  let calls = 0;
  let requestId = "";
  const handlers = new Map<string, IpcCommandHandler>([
    [
      "library.open",
      (_payload, context) => {
        calls += 1;
        requestId = context.requestId;
        throw new Error("boom /tmp/secret.txt");
      },
    ],
  ]);
  const harness = bind([command], handlers);
  const result = await invoke(harness.listeners);
  expect(calls).toBe(1);
  expect(result).toEqual({
    ok: false,
    error: { code: "handler_threw", retryable: true },
  });
  expect(result.ok).toBe(false);
  if (!result.ok) {
    expect("detail" in result.error).toBe(false);
    expect("message" in result.error).toBe(false);
  }
  expect(harness.threw).toHaveLength(1);
  const logged = harness.threw[0];
  expect(logged?.message.includes("/tmp/secret.txt")).toBe(false);
  expect(logged?.message.includes("[path]")).toBe(true);
  expect(logged?.requestId).toBe(requestId);
  expect(JSON.stringify(result).includes(requestId)).toBe(false);
});

it("returns sender_rejected when the frame is not this app", async () => {
  let calls = 0;
  const harness = bind(
    [command],
    handler(() => {
      calls += 1;
      return Promise.resolve({ ok: true, value: { name: "a" } });
    }),
    () => false,
  );
  const result = await invoke(harness.listeners);
  expect(calls).toBe(0);
  expect(result).toEqual({
    ok: false,
    error: { code: "sender_rejected", retryable: false },
  });
});

it("returns invalid_payload when the schema rejects the body", async () => {
  let calls = 0;
  const harness = bind(
    [command],
    handler(() => {
      calls += 1;
      return Promise.resolve({ ok: true, value: { name: "a" } });
    }),
  );
  const result = await invoke(harness.listeners, { id: 1 });
  expect(calls).toBe(0);
  expect(result).toEqual({
    ok: false,
    error: { code: "invalid_payload", retryable: false },
  });
});

it("returns invalid_payload when the response value is missing a field", async () => {
  let calls = 0;
  const harness = bind(
    [command],
    handler(() => {
      calls += 1;
      return Promise.resolve({
        ok: true,
        value: { title: "secret-title" },
        message: "secret-message",
      });
    }),
  );
  const result = await invoke(harness.listeners, { id: "doc-1" });
  expect(calls).toBe(1);
  expect(result).toEqual({
    ok: false,
    error: { code: "invalid_payload", retryable: false },
  });
  const encoded = JSON.stringify(result);
  expect(encoded.includes("secret-title")).toBe(false);
  expect(encoded.includes("secret-message")).toBe(false);
  expect(encoded.includes("detail")).toBe(false);
  expect("message" in result).toBe(false);
});

it("returns invalid_payload when the response value has an extra field", async () => {
  const harness = bind(
    [command],
    handler(() =>
      Promise.resolve({
        ok: true,
        value: { name: "paper", note: "secret-note" },
      }),
    ),
  );
  const result = await invoke(harness.listeners, { id: "doc-1" });
  expect(result).toEqual({
    ok: false,
    error: { code: "invalid_payload", retryable: false },
  });
  expect(JSON.stringify(result).includes("secret-note")).toBe(false);
});

it("returns invalid_payload when the response value has the wrong type", async () => {
  const harness = bind(
    [command],
    handler(() => Promise.resolve({ ok: true, value: { name: 1 } })),
  );
  expect(await invoke(harness.listeners, { id: "doc-1" })).toEqual({
    ok: false,
    error: { code: "invalid_payload", retryable: false },
  });
});

it("drops extra result fields when the response value matches", async () => {
  const harness = bind(
    [command],
    handler(() =>
      Promise.resolve({
        ok: true,
        value: { name: "paper" },
        message: "secret-message",
      }),
    ),
  );
  const result = await invoke(harness.listeners, { id: "doc-1" });
  expect(result).toEqual({ ok: true, value: { name: "paper" } });
  expect(JSON.stringify(result).includes("secret-message")).toBe(false);
});

it("strips transport errors to code and retryable when the handler adds fields", async () => {
  const cases = [
    { code: "sender_rejected", retryable: false },
    { code: "invalid_payload", retryable: false },
    { code: "handler_threw", retryable: true },
  ] as const;
  for (const expected of cases) {
    const harness = bind(
      [command],
      handler(() =>
        Promise.resolve({
          ok: false,
          error: {
            code: expected.code,
            retryable: !expected.retryable,
            detail: { leak: "secret-detail" },
            message: "secret-message",
          },
        }),
      ),
    );
    const result = await invoke(harness.listeners, { id: "doc-1" });
    expect(result).toEqual({ ok: false, error: { ...expected } });
    const encoded = JSON.stringify(result);
    expect(encoded.includes("secret-detail")).toBe(false);
    expect(encoded.includes("secret-message")).toBe(false);
    expect(encoded.includes("detail")).toBe(false);
    expect(encoded.includes("message")).toBe(false);
  }
});

it("drops a message when a business error flattens nested detail", async () => {
  const harness = bind(
    [command],
    handler(() =>
      Promise.resolve({
        ok: false,
        message: "secret-message",
        error: {
          code: "not_found",
          retryable: false,
          detail: { id: "doc-1" },
          message: "secret-error",
        },
      }),
    ),
  );
  const result = await invoke(harness.listeners, { id: "doc-1" });
  expect(result).toEqual({
    ok: false,
    error: {
      code: "not_found",
      retryable: false,
      id: "doc-1",
    },
  });
  const encoded = JSON.stringify(result);
  expect(encoded.includes("secret-message")).toBe(false);
  expect(encoded.includes("secret-error")).toBe(false);
});

it("returns the handler result when the payload is valid", async () => {
  const success = { ok: true as const, value: { name: "paper" } };
  const harness = bind(
    [command],
    handler((payload, context) => {
      expect(payload).toEqual({ id: "doc-1" });
      expect(context.requestId.length > 0).toBe(true);
      return Promise.resolve(success);
    }),
  );
  expect(await invoke(harness.listeners, { id: "doc-1" })).toBe(success);
});

it("keeps the business id when a handler returns nested detail", async () => {
  const failure = {
    ok: false as const,
    error: { code: "not_found", retryable: false, detail: { id: "doc-1" } },
  };
  const harness = bind(
    [command],
    handler(() => Promise.resolve(failure)),
  );
  expect(await invoke(harness.listeners, { id: "doc-1" })).toEqual({
    ok: false,
    error: { code: "not_found", retryable: false, id: "doc-1" },
  });
});

it("returns handler_threw when the handler does not return a result", async () => {
  const harness = bind(
    [command],
    handler(() => Promise.resolve(1)),
  );
  expect(await invoke(harness.listeners, { id: "doc-1" })).toEqual({
    ok: false,
    error: { code: "handler_threw", retryable: true },
  });
});

it("logs ipc.oversize without changing the result when the response is large", async () => {
  const value = { name: "x".repeat(IPC_OVERSIZE_BYTES) };
  const success = { ok: true as const, value };
  const harness = bind(
    [command],
    handler(() => Promise.resolve(success)),
  );
  expect(await invoke(harness.listeners, { id: "doc-1" })).toBe(success);
  expect(harness.oversize).toHaveLength(1);
  const logged = harness.oversize[0];
  expect(logged).toMatchObject({
    event: "ipc.oversize",
    channel: "library.open",
    level: "warn",
    feature: "ipc",
  });
  expect(logged?.bytes).toBeGreaterThan(IPC_OVERSIZE_BYTES);
  expect(JSON.stringify(logged).includes(value.name)).toBe(false);
});

it("passes a dropped file path to the handler and leaves it out of the result", async () => {
  const seen: string[] = [];
  const harness = bind(
    [droppedCommand],
    new Map<string, IpcCommandHandler>([
      [
        "library.importDropped",
        (_payload, context) => {
          seen.push(context.droppedFilePath ?? "");
          return Promise.resolve({ ok: true, value: { name: "paper.pdf" } });
        },
      ],
    ]),
  );
  const result = await invokeChannel(
    harness.listeners,
    "library.importDropped",
    {},
    "/tmp/papers/a.pdf",
  );
  expect(seen).toEqual(["/tmp/papers/a.pdf"]);
  expect(JSON.stringify(result).includes("/tmp/papers/a.pdf")).toBe(false);
});

it("rejects a path field inside a dropped-file payload", async () => {
  let calls = 0;
  const harness = bind(
    [droppedCommand],
    new Map<string, IpcCommandHandler>([
      [
        "library.importDropped",
        () => {
          calls += 1;
          return Promise.resolve({ ok: true, value: {} });
        },
      ],
    ]),
  );
  const result = await invokeChannel(
    harness.listeners,
    "library.importDropped",
    { absolutePath: "/tmp/papers/a.pdf" },
    "/tmp/papers/a.pdf",
  );
  expect(calls).toBe(0);
  expect(result).toEqual({
    ok: false,
    error: { code: "invalid_payload", retryable: false },
  });
});

it("returns invalid_payload when a dropped-file command has no path", async () => {
  const harness = bind(
    [droppedCommand],
    new Map<string, IpcCommandHandler>([
      ["library.importDropped", () => Promise.resolve({ ok: true, value: {} })],
    ]),
  );
  const result = await invokeChannel(
    harness.listeners,
    "library.importDropped",
    {},
  );
  expect(result).toEqual({
    ok: false,
    error: { code: "invalid_payload", retryable: false },
  });
});

it("ignores a second argument on an invoke command", async () => {
  let dropped = "unset";
  const harness = bind(
    [command],
    new Map<string, IpcCommandHandler>([
      [
        "library.open",
        (_payload, context) => {
          dropped = context.droppedFilePath ?? "absent";
          return Promise.resolve({ ok: true, value: { name: "a" } });
        },
      ],
    ]),
  );
  await invokeChannel(
    harness.listeners,
    "library.open",
    { id: "doc-1" },
    "/tmp/papers/a.pdf",
  );
  expect(dropped).toBe("absent");
});

const command = {
  kind: "command" as const,
  channel: "library.open",
  idempotent: true,
  transport: "invoke" as const,
  request: {
    type: "object",
    additionalProperties: false,
    required: ["id"],
    properties: { id: { type: "string" } },
  },
  response: {
    type: "object",
    additionalProperties: false,
    required: ["name"],
    properties: { name: { type: "string" } },
  },
} satisfies IpcRegistryEntry;

const droppedCommand = {
  kind: "command" as const,
  channel: "library.importDropped",
  idempotent: false,
  transport: "dropped-file" as const,
  request: { type: "object", additionalProperties: false },
  response: { type: "object", additionalProperties: false },
} satisfies IpcRegistryEntry;

const eventEntry = {
  kind: "event" as const,
  channel: "library.onOpened",
  payload: { type: "object", additionalProperties: false },
} satisfies IpcRegistryEntry;

function handler(run: IpcCommandHandler): Map<string, IpcCommandHandler> {
  return new Map([["library.open", run]]);
}

function bind(
  registry: readonly IpcRegistryEntry[],
  handlers: ReadonlyMap<string, IpcCommandHandler>,
  acceptsSender: (event: IpcInvokeEvent) => boolean = () => true,
) {
  const listeners = new Map<string, IpcListener>();
  const oversize: IpcOversizeLog[] = [];
  const threw: HandlerThrewLog[] = [];
  const count = registerIpcRouter({
    registry,
    handlers,
    bind(channel, listener) {
      listeners.set(channel, listener);
    },
    acceptsSender,
    logOversize(record) {
      oversize.push(record);
    },
    logHandlerThrew(record) {
      threw.push(record);
    },
    nowIso: () => "2026-11-04T00:00:00.000Z",
  });
  return { listeners, oversize, threw, count };
}

async function invoke(
  listeners: ReadonlyMap<string, IpcListener>,
  payload: unknown = { id: "doc-1" },
) {
  return invokeChannel(listeners, "library.open", payload);
}

async function invokeChannel(
  listeners: ReadonlyMap<string, IpcListener>,
  channel: string,
  payload: unknown,
  droppedFilePath?: unknown,
) {
  const listener = listeners.get(channel);
  if (listener === undefined) {
    throw new Error("listener");
  }
  return listener(invokeEvent, payload, droppedFilePath);
}

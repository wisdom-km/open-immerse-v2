import { expect, it } from "vitest";

import {
  registerIpcRouter,
  type IpcCommandHandler,
  type IpcListener,
} from "../src/main/ipc/ipc-router.js";
import type { IpcRegistryEntry } from "../src/main/ipc/registry.generated.js";
import type { IpcInvokeEvent } from "../src/main/ipc/sender-frame.js";

const invokeEvent: IpcInvokeEvent = {
  senderFrame: { url: "oi-app://app/index.html" },
  sender: { id: 1 },
};

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

function listen(run: IpcCommandHandler): IpcListener {
  const listeners = new Map<string, IpcListener>();
  registerIpcRouter({
    registry: [command],
    handlers: new Map([[command.channel, run]]),
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
    nowIso: () => "2026-11-04T00:00:00.000Z",
  });
  const listener = listeners.get(command.channel);
  if (listener === undefined) {
    throw new Error("listener");
  }
  return listener;
}

async function invoke(error: {
  readonly code: string;
  readonly retryable: boolean;
  readonly id: string;
  readonly generation?: number;
  readonly message?: string;
}) {
  const listener = listen(() => Promise.resolve({ ok: false, error }));
  return listener(invokeEvent, { id: "doc-1" });
}

it("keeps id and generation when a flat rejected error has both", async () => {
  const result = await invoke({
    code: "rejected",
    retryable: false,
    id: "doc-1",
    generation: 4,
  });
  expect(result).toEqual({
    ok: false,
    error: { code: "rejected", retryable: false, id: "doc-1", generation: 4 },
  });
});

it("keeps only id when a flat rejected error has no generation", async () => {
  const result = await invoke({
    code: "rejected",
    retryable: false,
    id: "doc-1",
  });
  expect(result).toEqual({
    ok: false,
    error: { code: "rejected", retryable: false, id: "doc-1" },
  });
  if (!result.ok) {
    expect("generation" in result.error).toBe(false);
  }
});

it("drops message when a business error carries message", async () => {
  const result = await invoke({
    code: "rejected",
    retryable: false,
    id: "doc-1",
    generation: 2,
    message: "secret-message",
  });
  expect(result).toEqual({
    ok: false,
    error: { code: "rejected", retryable: false, id: "doc-1", generation: 2 },
  });
  if (!result.ok) {
    expect("message" in result.error).toBe(false);
  }
  expect(JSON.stringify(result).includes("secret-message")).toBe(false);
});

it("keeps the ordinary prototype when a business error carries __proto__", async () => {
  const error = {
    code: "rejected",
    retryable: false,
    id: "doc-1",
    detail: { generation: 3 },
  };
  defineOwn(error, { polluted: true });
  defineOwn(error.detail, { polluted: true });
  const listener = listen(() => Promise.resolve({ ok: false, error }));
  const result = await listener(invokeEvent, { id: "doc-1" });
  expect(result).toEqual({
    ok: false,
    error: { code: "rejected", retryable: false, id: "doc-1", generation: 3 },
  });
  if (!result.ok) {
    expect(Object.getPrototypeOf(result.error)).toBe(Object.prototype);
    expect(Object.hasOwn(result.error, "__proto__")).toBe(false);
  }
  expect(JSON.stringify(result).includes("polluted")).toBe(false);
});

it("drops stack when a business error carries stack", async () => {
  const listener = listen(() =>
    Promise.resolve({
      ok: false,
      error: {
        code: "rejected",
        retryable: false,
        id: "doc-1",
        stack: "secret-stack",
        detail: { generation: 2, stack: "secret-detail-stack" },
      },
    }),
  );
  const result = await listener(invokeEvent, { id: "doc-1" });
  expect(result).toEqual({
    ok: false,
    error: { code: "rejected", retryable: false, id: "doc-1", generation: 2 },
  });
  if (!result.ok) {
    expect("stack" in result.error).toBe(false);
  }
  const encoded = JSON.stringify(result);
  expect(encoded.includes("secret-stack")).toBe(false);
  expect(encoded.includes("secret-detail-stack")).toBe(false);
});

function defineOwn(target: object, value: object): void {
  Object.defineProperty(target, "__proto__", {
    value,
    enumerable: true,
    writable: true,
    configurable: true,
  });
}

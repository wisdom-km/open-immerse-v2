import { expect, it } from "vitest";

import {
  registerIpcRouter,
  type IpcCommandHandler,
} from "../src/main/ipc/ipc-router.js";
import { libraryCommandChannels } from "../src/main/ipc/library-command-channels.js";
import { ipcRegistry } from "../src/main/ipc/registry.generated.js";
import { openDocumentChannel } from "../src/main/open-document-wiring.js";

it("covers the generated registry with the production command list", () => {
  const commands = ipcRegistry
    .filter((entry) => entry.kind === "command")
    .map((entry) => entry.channel);
  const handlers = new Map<string, IpcCommandHandler>(
    libraryCommandChannels.map((channel) => [channel, unusedHandler]),
  );
  handlers.set(openDocumentChannel, unusedHandler);
  const count = registerIpcRouter({
    registry: ipcRegistry,
    handlers,
    bind() {
      return undefined;
    },
    acceptsSender() {
      return true;
    },
    logOversize() {
      return undefined;
    },
    logHandlerThrew() {
      return undefined;
    },
    nowIso() {
      return "2026-11-09T00:00:00.000Z";
    },
  });
  expect(commands.every((channel) => handlers.has(channel))).toBe(true);
  expect(count).toBe(commands.length);
  expect(commands).not.toContain("parsing.getParseCapabilities");
});

function unusedHandler(): Promise<unknown> {
  return Promise.resolve({ ok: true, value: {} });
}

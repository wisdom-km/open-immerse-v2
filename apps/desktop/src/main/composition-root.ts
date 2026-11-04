import { app } from "electron";
import { stderr } from "node:process";

import { createFileLogger } from "@oi/platform-node";

import { wireIpc } from "./ipc/wire-ipc.js";

const processLogger: {
  current: ReturnType<typeof createFileLogger> | undefined;
} = { current: undefined };

export function startMainLogger(): void {
  processLogger.current = createFileLogger({
    appDataDirectory: app.getPath("userData"),
    clock: { nowMs: () => Date.now() },
  });
  wireIpc({
    logOversize: (record) => {
      processLogger.current?.log(record);
    },
    logHandlerThrew: (record) => {
      stderr.write(`${JSON.stringify(record)}\n`);
    },
  });
}

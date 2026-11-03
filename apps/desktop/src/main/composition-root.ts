import { app } from "electron";

import { createFileLogger } from "@oi/platform-node";

const processLogger: {
  current: ReturnType<typeof createFileLogger> | undefined;
} = { current: undefined };

export function startMainLogger(): void {
  processLogger.current = createFileLogger({
    appDataDirectory: app.getPath("userData"),
    clock: { nowMs: () => Date.now() },
  });
}

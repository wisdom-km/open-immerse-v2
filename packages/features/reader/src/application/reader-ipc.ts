import type { ReaderCommands } from "@oi/contracts";

import type { SetZoom } from "./use-cases/set-zoom.js";

export type ReaderIpcHandlers = {
  readonly setZoom: ReaderCommands["setZoom"];
};

export type ReaderIpcDeps = {
  readonly setZoom: SetZoom;
};

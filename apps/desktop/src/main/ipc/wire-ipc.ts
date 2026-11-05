import { BrowserWindow, ipcMain, type IpcMainInvokeEvent } from "electron";

import {
  registerIpcRouter,
  type HandlerThrewLog,
  type IpcCommandHandler,
  type IpcOversizeLog,
} from "./ipc-router.js";
import { ipcRegistry } from "./registry.generated.js";
import {
  isAppSender,
  type AppWindow,
  type IpcInvokeEvent,
} from "./sender-frame.js";

export type IpcLogSink = {
  readonly logOversize: (record: IpcOversizeLog) => void;
  readonly logHandlerThrew: (record: HandlerThrewLog) => void;
};

export type IpcWireOptions = IpcLogSink & {
  readonly handlers: ReadonlyMap<string, IpcCommandHandler>;
};

export function wireIpc(options: IpcWireOptions): void {
  registerIpcRouter({
    registry: ipcRegistry,
    handlers: options.handlers,
    bind(channel, listener) {
      ipcMain.handle(
        channel,
        (event, payload: unknown, droppedFilePath?: unknown) =>
          listener(asInvokeEvent(event), payload, droppedFilePath),
      );
    },
    acceptsSender(event) {
      return isAppSender(event, appFrames());
    },
    logOversize: options.logOversize,
    logHandlerThrew: options.logHandlerThrew,
    nowIso() {
      return new Date().toISOString();
    },
  });
}

function asInvokeEvent(event: IpcMainInvokeEvent): IpcInvokeEvent {
  return {
    senderFrame: event.senderFrame,
    sender: { id: event.sender.id },
  };
}

function appFrames(): readonly AppWindow[] {
  return BrowserWindow.getAllWindows().map((win) => ({
    senderId: win.webContents.id,
    mainFrame: win.webContents.mainFrame,
  }));
}

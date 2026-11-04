import { BrowserWindow, ipcMain, type IpcMainInvokeEvent } from "electron";

import {
  registerIpcRouter,
  type HandlerThrewLog,
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

export function wireIpc(sink: IpcLogSink): void {
  registerIpcRouter({
    registry: ipcRegistry,
    handlers: new Map(),
    bind(channel, listener) {
      ipcMain.handle(channel, (event, payload: unknown) =>
        listener(asInvokeEvent(event), payload),
      );
    },
    acceptsSender(event) {
      return isAppSender(event, appFrames());
    },
    logOversize: sink.logOversize,
    logHandlerThrew: sink.logHandlerThrew,
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

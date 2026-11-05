import { app, BrowserWindow, dialog, Menu } from "electron";

import { createLibraryMain, type LibraryMain } from "@oi/feature-library/main";

import type { IpcCommandHandler } from "./ipc/ipc-router.js";
import { fileMenu, openFileScript } from "./library-menu.js";

export function startLibrary(
  dataRoot: string,
): ReadonlyMap<string, IpcCommandHandler> {
  const main = createLibraryMain({
    dataRoot,
    clock: { nowMs: () => Date.now() },
    pickPdf: {
      pick() {
        return pickPdf();
      },
    },
  });
  app.on("will-quit", () => {
    main.close();
  });
  installFileMenu();
  return commandMap(main);
}

function pickPdf():
  | { readonly kind: "chosen"; readonly filePath: string }
  | { readonly kind: "cancelled" } {
  const selected = dialog.showOpenDialogSync({
    title: "打开文件",
    properties: ["openFile"],
    filters: [{ name: "PDF", extensions: ["pdf"] }],
  });
  const filePath = selected?.[0];
  if (filePath === undefined) {
    return { kind: "cancelled" };
  }
  return { kind: "chosen", filePath };
}

function installFileMenu(): void {
  const item = fileMenu.items[0];
  Menu.setApplicationMenu(
    Menu.buildFromTemplate([
      {
        label: fileMenu.label,
        submenu: [
          {
            label: item.label,
            accelerator: item.accelerator,
            click() {
              void dispatchOpenFile();
            },
          },
        ],
      },
    ]),
  );
}

function dispatchOpenFile(): Promise<void> {
  const win = BrowserWindow.getAllWindows()[0];
  if (win === undefined) {
    return Promise.resolve();
  }
  return win.webContents.executeJavaScript(openFileScript()).then(() => {
    return undefined;
  });
}

function commandMap(main: LibraryMain): ReadonlyMap<string, IpcCommandHandler> {
  const handlers = main.handlers;
  return new Map<string, IpcCommandHandler>([
    ["library.import", (payload) => handlers.import(asImport(payload))],
    [
      "library.importDropped",
      (_payload, context) => importDropped(handlers, context.droppedFilePath),
    ],
    ["library.list", (payload) => handlers.list(asList(payload))],
    ["library.relocate", (payload) => handlers.relocate(asRelocate(payload))],
  ]);
}

function asImport(
  payload: unknown,
): Parameters<LibraryMain["handlers"]["import"]>[0] {
  if (typeof payload === "object" && payload !== null) {
    return payload;
  }
  return {};
}

function asList(
  payload: unknown,
): Parameters<LibraryMain["handlers"]["list"]>[0] {
  return payload as Parameters<LibraryMain["handlers"]["list"]>[0];
}

function asRelocate(
  payload: unknown,
): Parameters<LibraryMain["handlers"]["relocate"]>[0] {
  return payload as Parameters<LibraryMain["handlers"]["relocate"]>[0];
}

function importDropped(
  handlers: LibraryMain["handlers"],
  absolutePath: string | undefined,
): ReturnType<LibraryMain["handlers"]["importDropped"]> {
  if (absolutePath === undefined) {
    return Promise.resolve({
      ok: false,
      error: { code: "invalid_payload", retryable: false },
    });
  }
  return handlers.importDropped(absolutePath);
}

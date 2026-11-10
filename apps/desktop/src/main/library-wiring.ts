import {
  app,
  BrowserWindow,
  dialog,
  Menu,
  protocol,
  type MenuItemConstructorOptions,
} from "electron";
import { platform } from "node:process";

import { createLibraryMain, type LibraryMain } from "@oi/feature-library/main";

import type { IpcCommandHandler } from "./ipc/ipc-router.js";
import { createReadingAssetPath } from "./reading-asset-path.js";
import {
  handleReadingAssetProtocol,
  type ReadingAssetRegistrar,
} from "./reading-asset-protocol.js";
import {
  libraryCommandChannels,
  type LibraryCommandChannel,
} from "./ipc/library-command-channels.js";
import {
  applicationMenuTemplate,
  fileMenu,
  type ShellMenuEntry,
} from "./library-menu.js";
import {
  openDocumentChannel,
  openDocumentHandler,
} from "./open-document-wiring.js";

export function startLibrary(
  dataRoot: string,
  register: ReadingAssetRegistrar = registerReadingAsset,
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
  handleReadingAssetProtocol(createReadingAssetPath(main, dataRoot), register);
  app.on("will-quit", () => {
    main.close();
  });
  installFileMenu();
  return withOpenDocument(commandMap(main), main);
}

function withOpenDocument(
  commands: ReadonlyMap<string, IpcCommandHandler>,
  main: LibraryMain,
): ReadonlyMap<string, IpcCommandHandler> {
  const merged = new Map(commands);
  merged.set(openDocumentChannel, openDocumentHandler(main));
  return merged;
}

function registerReadingAsset(
  scheme: string,
  handler: Parameters<ReadingAssetRegistrar>[1],
): void {
  protocol.handle(scheme, handler);
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
  Menu.setApplicationMenu(
    Menu.buildFromTemplate(applicationMenuTemplate(platform).map(toMenuItem)),
  );
}

function toMenuItem(entry: ShellMenuEntry): MenuItemConstructorOptions {
  if ("role" in entry) {
    return { role: entry.role };
  }
  return {
    label: entry.label,
    submenu: entry.items.map((item) => menuEntry(item)),
  };
}

function menuEntry(
  item: (typeof fileMenu.items)[number],
): MenuItemConstructorOptions {
  const click = () => {
    void dispatchMenu(item.event);
  };
  if ("accelerator" in item) {
    return { label: item.label, accelerator: item.accelerator, click };
  }
  return { label: item.label, click };
}

function dispatchMenu(eventName: string): Promise<void> {
  const win = BrowserWindow.getAllWindows()[0];
  if (win === undefined) {
    return Promise.resolve();
  }
  const script = `window.dispatchEvent(new Event(${JSON.stringify(eventName)}))`;
  return win.webContents.executeJavaScript(script).then(() => {
    return undefined;
  });
}

/** 测试断言四条阅读通道。生产 `startLibrary` 用这一张表。 */
export function commandMap(
  main: LibraryMain,
): ReadonlyMap<LibraryCommandChannel, IpcCommandHandler> {
  const handlers = main.handlers;
  const reading = main.reading;
  const bound: Record<LibraryCommandChannel, IpcCommandHandler> = {
    "library.import": (payload) => handlers.import(asImport(payload)),
    "library.importDropped": (_payload, context) =>
      importDropped(handlers, context.droppedFilePath),
    "library.list": (payload) => handlers.list(asList(payload)),
    "library.relocate": (payload) => handlers.relocate(asRelocate(payload)),
    "library.bindReadingAsset": (payload) =>
      reading.bindReadingAsset(asBind(payload)),
    "library.revokeReadingAsset": (payload) =>
      reading.revokeReadingAsset(asRevoke(payload)),
    "library.getProgressPage": (payload) =>
      reading.getProgressPage(asGetProgress(payload)),
    "library.setProgressPage": (payload) =>
      reading.setProgressPage(asSetProgress(payload)),
  };
  return new Map(
    libraryCommandChannels.map((channel) => [channel, bound[channel]]),
  );
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

function asBind(
  payload: unknown,
): Parameters<LibraryMain["reading"]["bindReadingAsset"]>[0] {
  return payload as Parameters<LibraryMain["reading"]["bindReadingAsset"]>[0];
}

function asRevoke(
  payload: unknown,
): Parameters<LibraryMain["reading"]["revokeReadingAsset"]>[0] {
  return payload as Parameters<LibraryMain["reading"]["revokeReadingAsset"]>[0];
}

function asGetProgress(
  payload: unknown,
): Parameters<LibraryMain["reading"]["getProgressPage"]>[0] {
  return payload as Parameters<LibraryMain["reading"]["getProgressPage"]>[0];
}

function asSetProgress(
  payload: unknown,
): Parameters<LibraryMain["reading"]["setProgressPage"]>[0] {
  return payload as Parameters<LibraryMain["reading"]["setProgressPage"]>[0];
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

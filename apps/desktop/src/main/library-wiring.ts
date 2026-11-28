import {
  app,
  BrowserWindow,
  dialog,
  Menu,
  protocol,
  type MenuItem,
  type MenuItemConstructorOptions,
} from "electron";
import { platform } from "node:process";

import { createLibraryMain, type LibraryMain } from "@oi/feature-library/main";
import {
  createSettingsParseCapabilities,
  settingsMigrationsDirectory,
} from "@oi/feature-settings/main";
import { readSliceMigrations } from "@oi/platform-node";

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
  scriptForMenuEvent,
  type MenuItemSpec,
  type ShellMenuEntry,
} from "./library-menu.js";
import type { ViewSlotDescription } from "./view-menu-mirror.js";
import {
  createViewMenuGate,
  type ViewMenuCandidateGate,
  type ViewMenuGate,
} from "./view-menu-gate.js";
import { bindViewMenuLifecycle } from "./view-menu-lifecycle.js";
import { createViewMenuHandler } from "./view-menu-handler.js";
import type { ViewMenuEpoch, ViewMenuFloorWriter } from "./view-menu-epoch.js";
import {
  openDocumentChannel,
  openDocumentHandler,
} from "./open-document-wiring.js";

export function startLibrary(
  dataRoot: string,
  register?: ReadingAssetRegistrar,
  epoch?: ViewMenuEpoch,
): ReadonlyMap<string, IpcCommandHandler> {
  const main = openWiredLibrary(dataRoot);
  handleReadingAssetProtocol(
    createReadingAssetPath(main, dataRoot),
    register ?? registerReadingAsset,
  );
  app.on("will-quit", () => {
    main.close();
  });
  const installed = installApplicationMenu(epoch);
  void installed.ready.catch(() => undefined);
  const commands = wiredLibraryCommands(main);
  if (epoch === undefined) return commands;
  return withViewMenu(commands, epoch, installed.gate);
}

const startupViewMark = "unbound";

export function openWiredLibrary(
  dataRoot: string,
  settingsDirectory = settingsMigrationsDirectory(),
): LibraryMain {
  const settings = readSliceMigrations("settings", settingsDirectory);
  return createLibraryMain({
    dataRoot,
    clock: { nowMs: () => Date.now() },
    pickPdf: {
      pick() {
        return pickPdf();
      },
    },
    migrations: settings.ok ? settings.value : null,
  });
}

export function wiredLibraryCommands(
  main: LibraryMain,
): ReadonlyMap<string, IpcCommandHandler> {
  return withParseCapabilities(withOpenDocument(commandMap(main), main), main);
}

function withParseCapabilities(
  commands: ReadonlyMap<string, IpcCommandHandler>,
  main: LibraryMain,
): ReadonlyMap<string, IpcCommandHandler> {
  const merged = new Map(commands);
  merged.set("parsing.getParseCapabilities", parseCapabilitiesHandler(main));
  return merged;
}

function parseCapabilitiesHandler(main: LibraryMain): IpcCommandHandler {
  const storage = main.storage;
  if (storage === null) {
    return () =>
      Promise.resolve({
        ok: false,
        error: { code: "handler_threw", retryable: true },
      });
  }
  const handle = createSettingsParseCapabilities(storage);
  return () => handle({});
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

type InstalledMenu = {
  readonly menu: Menu;
  readonly descriptions: readonly ViewSlotDescription[];
};

function installApplicationMenu(epoch?: ViewMenuEpoch): {
  readonly ready: Promise<void>;
  readonly gate: ViewMenuCandidateGate;
} {
  const held: { gate: ViewMenuGate | null; current: InstalledMenu | null } = {
    gate: null,
    current: null,
  };
  const gate = createViewMenuGate({
    replace(descriptions) {
      const owner = held.gate;
      if (owner === null) return;
      const menu = buildMenu(descriptions, owner);
      held.current = { menu, descriptions };
      Menu.setApplicationMenu(menu);
    },
    postCheck() {
      const current = held.current;
      if (current === null) return false;
      return currentMenuMatches(current.menu, current.descriptions);
    },
    dispatch(event) {
      return dispatchMenu(event);
    },
  });
  held.gate = gate;
  if (epoch !== undefined) bindViewMenuLifecycle(epoch, gate);
  return { ready: gate.submit("none", startupViewMark), gate };
}

function withViewMenu(
  commands: ReadonlyMap<string, IpcCommandHandler>,
  epoch: ViewMenuEpoch,
  gate: ViewMenuCandidateGate,
): ReadonlyMap<string, IpcCommandHandler> {
  const merged = new Map(commands);
  merged.set(
    "shell.reportViewMenu",
    createViewMenuHandler({
      epoch: floorWriter(epoch),
      gate,
      soleWindow,
    }),
  );
  return merged;
}

function floorWriter(
  epoch: ViewMenuEpoch,
): ViewMenuEpoch & ViewMenuFloorWriter {
  if (isFloorWriter(epoch)) return epoch;
  return {
    attach: (win) => {
      epoch.attach(win);
    },
    read: (id) => epoch.read(id),
    subscribe: (listener) => epoch.subscribe(listener),
    commitFloor: () => undefined,
  };
}

function isFloorWriter(
  epoch: ViewMenuEpoch,
): epoch is ViewMenuEpoch & ViewMenuFloorWriter {
  const candidate = epoch as ViewMenuEpoch & { commitFloor?: unknown };
  return typeof candidate.commitFloor === "function";
}

function soleWindow(): number | undefined {
  let windows: readonly BrowserWindow[];
  try {
    windows = BrowserWindow.getAllWindows();
  } catch {
    return undefined;
  }
  const live = windows.filter((win) => windowIsLive(win));
  if (live.length !== 1) return undefined;
  const id = live[0]?.webContents.id;
  return typeof id === "number" ? id : undefined;
}

function windowIsLive(win: BrowserWindow): boolean {
  if (typeof win.isDestroyed !== "function") return true;
  try {
    return !win.isDestroyed();
  } catch {
    return false;
  }
}

function buildMenu(
  descriptions: readonly ViewSlotDescription[],
  gate: ViewMenuGate,
): Menu {
  return Menu.buildFromTemplate(
    applicationMenuTemplate(platform).map((entry) =>
      toMenuItem(entry, descriptions, gate),
    ),
  );
}

function toMenuItem(
  entry: ShellMenuEntry,
  descriptions: readonly ViewSlotDescription[],
  gate: ViewMenuGate,
): MenuItemConstructorOptions {
  if ("role" in entry) return { role: entry.role };
  return {
    label: entry.label,
    submenu: entry.items.map((item) => menuEntry(item, descriptions, gate)),
  };
}

function menuEntry(
  item: MenuItemSpec,
  descriptions: readonly ViewSlotDescription[],
  gate: ViewMenuGate,
): MenuItemConstructorOptions {
  const slot = descriptions.find(
    (description) => description.event === item.event,
  );
  if (slot === undefined) return commandEntry(item);
  return viewEntry(item, slot, gate);
}

function commandEntry(item: MenuItemSpec): MenuItemConstructorOptions {
  const click = () => {
    void dispatchMenu(item.event);
  };
  if (item.accelerator === undefined) return { label: item.label, click };
  return { label: item.label, accelerator: item.accelerator, click };
}

function viewEntry(
  item: MenuItemSpec,
  slot: ViewSlotDescription,
  gate: ViewMenuGate,
): MenuItemConstructorOptions {
  const click = (): void => {
    void gate.click(item.event).catch(() => undefined);
  };
  const entry = slotEntry({ id: slot.event, label: slot.label, click }, slot);
  if (item.accelerator === undefined) return entry;
  return { ...entry, accelerator: item.accelerator };
}

function slotEntry(
  entry: MenuItemConstructorOptions,
  slot: ViewSlotDescription,
): MenuItemConstructorOptions {
  if (!("type" in slot)) return entry;
  return { ...entry, type: slot.type, checked: slot.checked };
}

function currentMenuMatches(
  menu: Menu,
  descriptions: readonly ViewSlotDescription[],
): boolean {
  const current = readApplicationMenu();
  if (current !== menu) return false;
  const items = collectItems(current);
  for (const slot of descriptions) {
    if (!oneDescribedSlot(items, slot)) return false;
  }
  return true;
}

function readApplicationMenu(): Menu | undefined {
  try {
    const api = Menu as { getApplicationMenu?: () => Menu | null };
    if (typeof api.getApplicationMenu !== "function") return undefined;
    const current = api.getApplicationMenu();
    return current === null ? undefined : current;
  } catch {
    return undefined;
  }
}

function oneDescribedSlot(
  items: readonly MenuItem[],
  slot: ViewSlotDescription,
): boolean {
  const hits = items.filter((item) => item.id === slot.event);
  const hit = hits.length === 1 ? hits[0] : undefined;
  if (hit === undefined || hit.label !== slot.label) return false;
  if (!("type" in slot))
    return hit.type === "normal" && sameChecked(hit.checked, false);
  return hit.type === slot.type && sameChecked(hit.checked, slot.checked);
}

function sameChecked(actual: unknown, expected: unknown): boolean {
  return actual === expected;
}

function collectItems(menu: {
  readonly items: readonly MenuItem[];
}): readonly MenuItem[] {
  const found: MenuItem[] = [];
  for (const item of menu.items) {
    found.push(item);
    const nested = childMenu(item);
    if (nested === undefined) continue;
    found.push(...collectItems(nested));
  }
  return found;
}

// Electron 45 在没有子菜单时把 submenu 做成 null，类型却是 Menu | undefined。
// 按对象展开会抛错，postCheck 失败，submit 履行后仍不留下已提交形状。
function childMenu(
  item: MenuItem,
): { readonly items: readonly MenuItem[] } | undefined {
  const nested: unknown = item.submenu;
  if (!hasMenuItems(nested)) return undefined;
  return nested;
}

function hasMenuItems(
  value: unknown,
): value is { readonly items: readonly MenuItem[] } {
  return (
    typeof value === "object" &&
    value !== null &&
    "items" in value &&
    Array.isArray(value.items)
  );
}

function dispatchMenu(eventName: string): Promise<void> {
  const win = BrowserWindow.getAllWindows()[0];
  if (win === undefined) {
    return Promise.resolve();
  }
  const script = scriptForMenuEvent(eventName);
  if (script === undefined) {
    return Promise.resolve();
  }
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

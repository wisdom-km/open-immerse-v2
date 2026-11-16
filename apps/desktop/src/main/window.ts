import { BrowserWindow } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  blockUnlessAllowed,
  decideNavigation,
  decideWindowOpen,
} from "./security/navigation.js";
import {
  appStartUrl,
  browserWindowOptions,
} from "./security/window-preferences.js";
import type { ViewMenuEpoch } from "./view-menu-epoch.js";

export function createMainWindow(epoch: ViewMenuEpoch): BrowserWindow {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const preload = path.join(here, "../preload/index.cjs");
  const win = new BrowserWindow(browserWindowOptions(preload));
  win.webContents.on("will-navigate", (event) => {
    blockUnlessAllowed(decideNavigation(), event);
  });
  win.webContents.setWindowOpenHandler(() => decideWindowOpen());
  epoch.attach(win);
  void win.loadURL(appStartUrl);
  return win;
}

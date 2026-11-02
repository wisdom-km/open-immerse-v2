import { app, session } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { handleAppProtocol, registerAppScheme } from "./app-protocol.js";
import { blockUnlessAllowed, decideWebViewAttach } from "./security/navigation.js";
import { decidePermissionCheck, decidePermissionRequest } from "./security/permissions.js";
import { createMainWindow } from "./window.js";

registerAppScheme();

app.on("window-all-closed", () => {
  app.quit();
});

app.on("web-contents-created", (_event, contents) => {
  contents.on("will-attach-webview", (event) => {
    blockUnlessAllowed(decideWebViewAttach(), event);
  });
});

void app.whenReady().then(() => {
  handleAppProtocol(rendererRoot(fileURLToPath(import.meta.url)));
  denyPermissions();
  createMainWindow();
});

function rendererRoot(mainFile: string): string {
  return path.resolve(path.dirname(mainFile), "../../src/renderer");
}

function denyPermissions(): void {
  session.defaultSession.setPermissionRequestHandler((_contents, _permission, callback) => {
    callback(decidePermissionRequest());
  });
  session.defaultSession.setPermissionCheckHandler(() => decidePermissionCheck());
}

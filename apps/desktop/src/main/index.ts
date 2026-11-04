import { app, session } from "electron";
import path from "node:path";
import { stderr } from "node:process";
import { fileURLToPath } from "node:url";

import { handleAppProtocol, registerAppScheme } from "./app-protocol.js";
import { startMainLogger } from "./composition-root.js";
import { runWhenReady } from "./run-when-ready.js";
import {
  blockUnlessAllowed,
  decideWebViewAttach,
} from "./security/navigation.js";
import {
  decidePermissionCheck,
  decidePermissionRequest,
} from "./security/permissions.js";
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

runWhenReady(app.whenReady(), startDesktop, reportReadyFailure);

function startDesktop(): void {
  handleAppProtocol(rendererRoot(fileURLToPath(import.meta.url)));
  denyPermissions();
  startMainLogger();
  createMainWindow();
}

function reportReadyFailure(error: unknown): void {
  const text =
    error instanceof Error ? (error.stack ?? error.message) : String(error);
  stderr.write(`${text}\n`);
}

function rendererRoot(mainFile: string): string {
  return path.resolve(path.dirname(mainFile), "../../src/renderer");
}

function denyPermissions(): void {
  session.defaultSession.setPermissionRequestHandler(
    (_contents, _permission, callback) => {
      callback(decidePermissionRequest());
    },
  );
  session.defaultSession.setPermissionCheckHandler(() =>
    decidePermissionCheck(),
  );
}

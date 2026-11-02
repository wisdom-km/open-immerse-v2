import { expect, it } from "vitest";

import {
  appStartUrl,
  browserWindowOptions,
  windowPreferences,
  windowTitle,
} from "../src/main/security/window-preferences.js";

it("keeps isolation on and leaves webSecurity at the default", () => {
  expect(windowTitle).toBe("Open Immerse");
  expect(appStartUrl).toBe("oi-app://app/index.html");
  expect(windowPreferences).toEqual({
    contextIsolation: true,
    sandbox: true,
    nodeIntegration: false,
  });
  expect("webSecurity" in windowPreferences).toBe(false);
  expect("webviewTag" in windowPreferences).toBe(false);
});

it("does not replace the system window frame", () => {
  const options = browserWindowOptions("/preload/index.cjs");
  expect(options.title).toBe(windowTitle);
  expect(options.webPreferences.preload).toBe("/preload/index.cjs");
  expect("frame" in options).toBe(false);
  expect("titleBarStyle" in options).toBe(false);
  expect("titleBarOverlay" in options).toBe(false);
});

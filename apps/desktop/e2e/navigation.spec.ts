import { type ElectronApplication } from "@playwright/test";

import { expect, test } from "./fixtures/electron-app.js";

test("stays on the app url when the renderer assigns an external location", async ({ desktop }) => {
  const before = desktop.page.url();
  await evaluate(desktop.page, "location.href = 'https://example.com/'");
  expect(desktop.page.url()).toBe(before);
});

test("returns null when the renderer calls window.open", async ({ desktop }) => {
  expect(await evaluate(desktop.page, "window.open('https://example.com/') === null")).toBe(true);
});

test("keeps the web contents count when the renderer calls window.open", async ({ desktop }) => {
  const before = await webContentsCount(desktop.app);
  await evaluate(desktop.page, "window.open('https://example.com/')");
  expect(await webContentsCount(desktop.app)).toBe(before);
});

test("does not attach a webview when the renderer appends a webview element", async ({ desktop }) => {
  await evaluate(
    desktop.page,
    "document.body.appendChild(Object.assign(document.createElement('webview'), { src: 'https://example.com/' }))",
  );
  const types = await desktop.app.evaluate(({ webContents }) =>
    webContents.getAllWebContents().map((item) => item.getType()),
  );
  expect(types.includes("webview")).toBe(false);
});

function webContentsCount(app: ElectronApplication): Promise<number> {
  return app.evaluate(({ webContents }) => webContents.getAllWebContents().length);
}

function evaluate(page: EvaluatePage, source: string): Promise<unknown> {
  return page.evaluate(source as never);
}

type EvaluatePage = {
  evaluate: (source: never) => Promise<unknown>;
};

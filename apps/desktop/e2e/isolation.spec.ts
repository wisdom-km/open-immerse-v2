import { type ElectronApplication } from "@playwright/test";

import { expect, test } from "./fixtures/electron-app.js";

test("exposes the library seam when window.oi is read", async ({ desktop }) => {
  const raw = await evaluate(
    desktop.page,
    `JSON.stringify({
      keys: Object.keys(window.oi),
      library:
        window.oi.library !== null && typeof window.oi.library === "object",
      import: typeof window.oi.library.import,
      getParseCapabilities: typeof window.oi.parsing.getParseCapabilities
    })`,
  );
  expect(raw).toBe(
    '{"keys":["ingest","library","parsing"],"library":true,"import":"function","getParseCapabilities":"function"}',
  );
});

test("enables context isolation when web preferences are read", async ({
  desktop,
}) => {
  expect((await preferences(desktop.app)).contextIsolation).toBe(true);
});

test("enables the sandbox when web preferences are read", async ({
  desktop,
}) => {
  expect((await preferences(desktop.app)).sandbox).toBe(true);
});

test("disables node integration when web preferences are read", async ({
  desktop,
}) => {
  expect((await preferences(desktop.app)).nodeIntegration).toBe(false);
});

test("leaves web security enabled when web preferences are read", async ({
  desktop,
}) => {
  expect((await preferences(desktop.app)).webSecurity).not.toBe(false);
});

async function preferences(
  app: ElectronApplication,
): Promise<Record<string, unknown>> {
  const prefs = await app.evaluate(({ BrowserWindow }) => {
    const win = BrowserWindow.getAllWindows()[0];
    if (win === undefined) {
      return undefined;
    }
    const contents = win.webContents as unknown as {
      getLastWebPreferences?: () => Record<string, unknown>;
    };
    return contents.getLastWebPreferences?.();
  });
  return asRecord(prefs);
}

function evaluate(page: EvaluatePage, source: string): Promise<unknown> {
  return page.evaluate(source as never);
}

function asRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null) {
    throw new Error("missing webPreferences");
  }
  return value as Record<string, unknown>;
}

type EvaluatePage = {
  evaluate: (source: never) => Promise<unknown>;
};

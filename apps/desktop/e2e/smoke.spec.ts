import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { _electron as electron, expect, test, type ElectronApplication } from "@playwright/test";

import { CONTENT_SECURITY_POLICY } from "../src/main/security/csp.js";
import { appStartUrl } from "../src/main/security/window-preferences.js";

const desktopRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("opens one oi-app window under the security baseline", async () => {
  const app = await electron.launch({
    executablePath: electronBinary(),
    cwd: desktopRoot,
    args: [path.join(desktopRoot, "dist/main/index.js")],
  });
  try {
    const page = await app.firstWindow();
    expect((await page.title()).length).toBeGreaterThan(0);
    expect(page.url()).toBe(appStartUrl);
    await expectCsp(page);
    expect(await evaluate(page, "location.protocol")).toBe("oi-app:");
    await expectNoFileUrls(app, page);
    await expectNavigationBlocked(page);
    await expectWindowOpenBlocked(app, page);
    await expectWebViewBlocked(app, page);
    expect(await evaluate(page, "Notification.requestPermission()")).toBe("denied");
    expect(await evaluate(page, "JSON.stringify(window.oi)")).toBe("{}");
    await expectPreferences(app);
  } finally {
    await app.close();
  }
});

function electronBinary(): string {
  const resolved: unknown = createRequire(import.meta.url)("electron");
  if (typeof resolved !== "string" || resolved.length === 0) {
    throw new Error("electron binary path missing");
  }
  return resolved;
}

async function expectCsp(page: AsyncPage): Promise<void> {
  const response = await page.reload();
  expect(response).not.toBeNull();
  const headers = response?.headers() ?? {};
  expect(headers["content-security-policy"]).toBe(CONTENT_SECURITY_POLICY);
  expect(headers["content-security-policy"]?.includes("unsafe-eval")).toBe(false);
}

async function expectNoFileUrls(app: ElectronApplication, page: RequestPage): Promise<void> {
  const seen: string[] = [];
  page.on("request", (request) => {
    const url = request.url();
    if (url.startsWith("file:")) {
      seen.push(url);
    }
  });
  await page.reload();
  expect(seen).toEqual([]);
  expect(page.url().startsWith("file:")).toBe(false);
  const urls = await app.evaluate(({ webContents }) =>
    webContents.getAllWebContents().map((item) => item.getURL()),
  );
  expect(urls.some((url) => url.startsWith("file:"))).toBe(false);
}

async function expectNavigationBlocked(page: AsyncPage): Promise<void> {
  const before = page.url();
  await evaluate(page, "location.href = 'https://example.com/'");
  expect(page.url()).toBe(before);
}

async function expectWindowOpenBlocked(app: ElectronApplication, page: AsyncPage): Promise<void> {
  const before = await app.evaluate(({ webContents }) => webContents.getAllWebContents().length);
  expect(await evaluate(page, "window.open('https://example.com/') === null")).toBe(true);
  const after = await app.evaluate(({ webContents }) => webContents.getAllWebContents().length);
  expect(after).toBe(before);
}

async function expectWebViewBlocked(app: ElectronApplication, page: AsyncPage): Promise<void> {
  await evaluate(
    page,
    "document.body.appendChild(Object.assign(document.createElement('webview'), { src: 'https://example.com/' }))",
  );
  const types = await app.evaluate(({ webContents }) =>
    webContents.getAllWebContents().map((item) => item.getType()),
  );
  expect(types.includes("webview")).toBe(false);
}

async function expectPreferences(app: ElectronApplication): Promise<void> {
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
  const record = asRecord(prefs);
  expect(record.contextIsolation).toBe(true);
  expect(record.sandbox).toBe(true);
  expect(record.nodeIntegration).toBe(false);
  expect(record.webSecurity).not.toBe(false);
}

type AsyncPage = {
  title: () => Promise<string>;
  url: () => string;
  reload: () => Promise<{ headers: () => Record<string, string> } | null>;
  evaluate: (source: never) => Promise<unknown>;
};

type RequestPage = AsyncPage & {
  on: (event: "request", listener: (request: { url: () => string }) => void) => void;
};

function evaluate(page: AsyncPage, source: string): Promise<unknown> {
  return page.evaluate(source as never);
}

function asRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null) {
    throw new Error("missing webPreferences");
  }
  return value as Record<string, unknown>;
}

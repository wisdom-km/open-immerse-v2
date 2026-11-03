import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  test as base,
  _electron as electron,
  type ElectronApplication,
  type Page,
} from "@playwright/test";

const desktopRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

type Desktop = {
  app: ElectronApplication;
  page: Page;
};

export const test = base.extend<{ desktop: Desktop }>({
  desktop: [
    async (fixtures, use) => {
      const app = await electron.launch({
        executablePath: electronBinary(),
        cwd: desktopRoot,
        args: [path.join(desktopRoot, "dist/main/index.js")],
      });
      try {
        const page = await app.firstWindow();
        await use({ app, page });
      } finally {
        await app.close();
      }
    },
    { scope: "test" },
  ],
});

export { expect } from "@playwright/test";

function electronBinary(): string {
  const resolved: unknown = createRequire(import.meta.url)("electron");
  if (typeof resolved !== "string" || resolved.length === 0) {
    throw new Error("electron binary path missing");
  }
  return resolved;
}

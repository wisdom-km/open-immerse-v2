import { mkdtemp, rm } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  test as base,
  expect,
  _electron as electron,
  type ElectronApplication,
  type Page,
} from "@playwright/test";

const desktopRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

type Desktop = {
  app: ElectronApplication;
  page: Page;
  userDataDir: string;
};

export const test = base.extend<{ desktop: Desktop }>({
  desktop: [
    // Playwright 的 fixture 变换要求第一个参数是对象解构。本 fixture 不依赖其他 fixture。
    // eslint-disable-next-line no-empty-pattern -- 空解构是 Playwright 要求的形式
    async ({}, use) => {
      const launchedAt = Date.now();
      const userDataDir = await mkdtemp(path.join(tmpdir(), "oi-e2e-"));
      const app = await electron.launch({
        executablePath: electronBinary(),
        cwd: desktopRoot,
        args: [
          `--user-data-dir=${userDataDir}`,
          path.join(desktopRoot, "dist/main/index.js"),
        ],
      });
      try {
        const page = await app.firstWindow();
        const actual: unknown = await app.evaluate(({ app: electronApp }) =>
          electronApp.getPath("userData"),
        );
        expect(actual).toBe(userDataDir);
        console.log(`electron launch ms: ${String(Date.now() - launchedAt)}`);
        await use({ app, page, userDataDir });
      } finally {
        await app.close();
        await rm(userDataDir, { recursive: true, force: true });
      }
    },
    { scope: "test" },
  ],
});

export { expect };

function electronBinary(): string {
  const resolved: unknown = createRequire(import.meta.url)("electron");
  if (typeof resolved !== "string" || resolved.length === 0) {
    throw new Error("electron binary path missing");
  }
  return resolved;
}

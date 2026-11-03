import { expect, test } from "./fixtures/electron-app.js";

test("records zero file requests when the page reloads", async ({ desktop }) => {
  const seen: string[] = [];
  desktop.page.on("request", (request) => {
    const url = request.url();
    if (url.startsWith("file:")) {
      seen.push(url);
    }
  });
  await desktop.page.reload();
  expect(seen).toEqual([]);
});

test("stays off file urls when the page url is read", ({ desktop }) => {
  expect(desktop.page.url().startsWith("file:")).toBe(false);
});

test("keeps web contents off file urls when all contents are listed", async ({ desktop }) => {
  const urls = await desktop.app.evaluate(({ webContents }) =>
    webContents.getAllWebContents().map((item) => item.getURL()),
  );
  expect(urls.some((url) => url.startsWith("file:"))).toBe(false);
});

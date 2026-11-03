import { expect, test } from "./fixtures/electron-app.js";

import { appStartUrl } from "../src/main/security/window-preferences.js";

test("shows a non-empty title when the window opens", async ({ desktop }) => {
  expect((await desktop.page.title()).length).toBeGreaterThan(0);
});

test("loads the app start url when the window opens", ({ desktop }) => {
  expect(desktop.page.url()).toBe(appStartUrl);
});

test("uses the oi-app protocol when the page location is read", async ({
  desktop,
}) => {
  expect(await evaluate(desktop.page, "location.protocol")).toBe("oi-app:");
});

function evaluate(page: EvaluatePage, source: string): Promise<unknown> {
  return page.evaluate(source as never);
}

type EvaluatePage = {
  evaluate: (source: never) => Promise<unknown>;
};

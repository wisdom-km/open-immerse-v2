import { expect, test } from "./fixtures/electron-app.js";

test("returns denied when the renderer requests notification permission", async ({ desktop }) => {
  expect(await evaluate(desktop.page, "Notification.requestPermission()")).toBe("denied");
});

test("denied when renderer queries notifications", async ({ desktop }) => {
  expect(await permissionState(desktop.page, "notifications")).toBe("denied");
});

test("denied when renderer queries geolocation", async ({ desktop }) => {
  expect(await permissionState(desktop.page, "geolocation")).toBe("denied");
});

test("denied when renderer queries camera", async ({ desktop }) => {
  expect(await permissionState(desktop.page, "camera")).toBe("denied");
});

test("denied when renderer queries microphone", async ({ desktop }) => {
  expect(await permissionState(desktop.page, "microphone")).toBe("denied");
});

test("grants notifications when the check handler is overridden to allow", async ({ desktop }) => {
  await desktop.app.evaluate(({ session }) => {
    session.defaultSession.setPermissionCheckHandler(() => true);
  });
  expect(await permissionState(desktop.page, "notifications")).not.toBe("denied");
});

function permissionState(page: EvaluatePage, name: string): Promise<unknown> {
  return evaluate(
    page,
    `navigator.permissions.query({ name: "${name}" }).then((status) => status.state)`,
  );
}

function evaluate(page: EvaluatePage, source: string): Promise<unknown> {
  return page.evaluate(source as never);
}

type EvaluatePage = {
  evaluate: (source: never) => Promise<unknown>;
};

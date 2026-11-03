import { expect, test } from "./fixtures/electron-app.js";

import { CONTENT_SECURITY_POLICY } from "../src/main/security/csp.js";

test("returns a response when the oi-app document reloads", async ({ desktop }) => {
  const response = await desktop.page.reload();
  expect(response).not.toBeNull();
});

test("matches the csp constant when the oi-app document responds", async ({ desktop }) => {
  const response = await desktop.page.reload();
  expect(response?.headers()["content-security-policy"]).toBe(CONTENT_SECURITY_POLICY);
});

test("omits unsafe-eval when the csp header is read", async ({ desktop }) => {
  const response = await desktop.page.reload();
  expect(response?.headers()["content-security-policy"]?.includes("unsafe-eval")).toBe(false);
});

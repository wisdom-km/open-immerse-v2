import { expect, it } from "vitest";

import { CONTENT_SECURITY_POLICY } from "../src/main/security/csp.js";

const draft =
  "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' oi-asset:; font-src 'self'; connect-src 'self'; worker-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'";

it("matches the architecture draft without unsafe sources", () => {
  expect(CONTENT_SECURITY_POLICY).toBe(draft);
  expect(CONTENT_SECURITY_POLICY.includes("unsafe-eval")).toBe(false);
  expect(CONTENT_SECURITY_POLICY.includes("unsafe-inline")).toBe(false);
});

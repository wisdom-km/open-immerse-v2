import { expect, it } from "vitest";

import { decidePermissionCheck, decidePermissionRequest } from "../src/main/security/permissions.js";

it("rejects permission requests and checks", () => {
  expect(decidePermissionRequest()).toBe(false);
  expect(decidePermissionCheck()).toBe(false);
});

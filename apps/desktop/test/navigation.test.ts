import { expect, it } from "vitest";

import {
  blockUnlessAllowed,
  decideNavigation,
  decideWebViewAttach,
  decideWindowOpen,
} from "../src/main/security/navigation.js";

it("denies navigation, new windows, and webviews", () => {
  expect(decideNavigation()).toBe("prevent");
  expect(decideWindowOpen()).toEqual({ action: "deny" });
  expect(decideWebViewAttach()).toBe("prevent");
});

it("blocks every decision except an explicit allow", () => {
  const blocked = { prevented: false, preventDefault: () => { blocked.prevented = true; } };
  blockUnlessAllowed(decideNavigation(), blocked);
  expect(blocked.prevented).toBe(true);

  const allowed = { prevented: false, preventDefault: () => { allowed.prevented = true; } };
  blockUnlessAllowed("allow", allowed);
  expect(allowed.prevented).toBe(false);
});

import { expect, expectTypeOf, it } from "vitest";

import {
  DEBUG_LOG_DIRECTORY,
  DEBUG_LOG_MAX_AGE_MS,
  DEBUG_LOG_MAX_BYTES,
  DEBUG_MODE_DEFAULT,
  PRODUCT_LOG_DIRECTORY,
  type DebugModeChange,
} from "@oi/kernel";

it("AC-101 keeps debug mode off when the setting has never been changed", () => {
  expect(DEBUG_MODE_DEFAULT).toBe(false);
  expect(DEBUG_LOG_MAX_AGE_MS).toBe(604_800_000);
  expect(DEBUG_LOG_MAX_BYTES).toBe(52_428_800);
  expect(PRODUCT_LOG_DIRECTORY).toBe("diagnostics");
  expect(DEBUG_LOG_DIRECTORY).toBe("debug");
});

it("requires deleteFiles when debug mode is turned off", () => {
  type Off = Extract<DebugModeChange, { enabled: false }>;
  type On = Extract<DebugModeChange, { enabled: true }>;
  expectTypeOf<keyof Off>().toEqualTypeOf<"enabled" | "deleteFiles">();
  expectTypeOf<undefined extends Off["deleteFiles"] ? true : false>().toEqualTypeOf<false>();
  expectTypeOf<keyof On>().toEqualTypeOf<"enabled">();
  const turningOff: Extract<DebugModeChange, { enabled: false }> = {
    enabled: false,
    deleteFiles: true,
  };
  const turningOn: Extract<DebugModeChange, { enabled: true }> = { enabled: true };
  expect(turningOff.deleteFiles).toBe(true);
  expect(turningOn.enabled).toBe(true);
});

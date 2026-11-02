import { expectTypeOf, it } from "vitest";

import type {
  AnswerEgressConsentError,
  EgressConsentRequired,
  EgressDestination,
  WithdrawEgressConsentError,
} from "../src/egress.js";
import type { SettingsEgressChannel, SettingsEgressCommands, SettingsEgressEventPayload } from "../src/ipc/settings.js";
import type { Result } from "../src/result.js";

it("returns Result from each settings egress command", () => {
  expectTypeOf<SettingsEgressCommands["answerEgressConsent"]>().returns.toEqualTypeOf<
    Promise<Result<Readonly<{ vendorId: string }>, AnswerEgressConsentError>>
  >();
  expectTypeOf<SettingsEgressCommands["withdrawEgressConsent"]>().returns.toEqualTypeOf<
    Promise<Result<Readonly<{ vendorId: string }>, WithdrawEgressConsentError>>
  >();
  expectTypeOf<SettingsEgressCommands["setEgressPromptEnabled"]>().returns.toEqualTypeOf<
    Promise<Result<Readonly<{ enabled: boolean }>, never>>
  >();
  expectTypeOf<SettingsEgressCommands["listEgressDestinations"]>().returns.toEqualTypeOf<
    Promise<Result<readonly EgressDestination[], never>>
  >();
});

it("names the settings egress channel and the consent payload", () => {
  expectTypeOf<
    Exclude<
      SettingsEgressChannel,
      | "settings.answerEgressConsent"
      | "settings.withdrawEgressConsent"
      | "settings.setEgressPromptEnabled"
      | "settings.listEgressDestinations"
      | "settings.onEgressConsentRequired"
    >
  >().toBeNever();
  expectTypeOf<SettingsEgressEventPayload>().toEqualTypeOf<EgressConsentRequired>();
});

import { expectTypeOf, it } from "vitest";

import type { EgressConsentRequired } from "../src/egress.js";
import type {
  SettingsEgressChannel,
  SettingsEgressCommands,
  SettingsEgressEventPayload,
} from "../src/ipc/settings.js";
import type { Result } from "../src/result.js";

type AnswerError =
  | { readonly code: "unknown_request"; readonly retryable: false }
  | { readonly code: "sender_rejected"; readonly retryable: false }
  | { readonly code: "invalid_payload"; readonly retryable: false }
  | { readonly code: "handler_threw"; readonly retryable: true };

type WithdrawError =
  | { readonly code: "consent_not_granted"; readonly retryable: false }
  | { readonly code: "sender_rejected"; readonly retryable: false }
  | { readonly code: "invalid_payload"; readonly retryable: false }
  | { readonly code: "handler_threw"; readonly retryable: true };

type TransportError =
  | { readonly code: "sender_rejected"; readonly retryable: false }
  | { readonly code: "invalid_payload"; readonly retryable: false }
  | { readonly code: "handler_threw"; readonly retryable: true };

it("returns Result from each settings egress command", () => {
  expectTypeOf<
    SettingsEgressCommands["answerEgressConsent"]
  >().parameters.toEqualTypeOf<
    [{ requestId: string; granted: boolean | null }]
  >();
  expectTypeOf<
    SettingsEgressCommands["answerEgressConsent"]
  >().returns.toEqualTypeOf<
    Promise<Result<{ vendorId: string }, AnswerError>>
  >();
  expectTypeOf<
    SettingsEgressCommands["withdrawEgressConsent"]
  >().parameters.toEqualTypeOf<[{ vendorId: string }]>();
  expectTypeOf<
    SettingsEgressCommands["withdrawEgressConsent"]
  >().returns.toEqualTypeOf<
    Promise<Result<{ vendorId: string }, WithdrawError>>
  >();
  expectTypeOf<
    SettingsEgressCommands["setEgressPromptEnabled"]
  >().parameters.toEqualTypeOf<[{ enabled: boolean }]>();
  expectTypeOf<
    SettingsEgressCommands["setEgressPromptEnabled"]
  >().returns.toEqualTypeOf<
    Promise<Result<{ enabled: boolean }, TransportError>>
  >();
  expectTypeOf<
    SettingsEgressCommands["listEgressDestinations"]
  >().parameters.toEqualTypeOf<[]>();
  expectTypeOf<
    SettingsEgressCommands["listEgressDestinations"]
  >().returns.toEqualTypeOf<
    Promise<
      Result<
        Array<{
          vendorId: string;
          providerName: string;
          capabilities: Array<{
            id: string;
            name: string;
            sends: Array<
              | "region_crop_and_candidates"
              | "rendered_page_image"
              | "text_to_translate"
              | "qa_context"
            >;
            status: "granted" | "prompt_disabled" | "refused";
          }>;
        }>,
        TransportError
      >
    >
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
  expectTypeOf<SettingsEgressEventPayload>().toExtend<EgressConsentRequired>();
});

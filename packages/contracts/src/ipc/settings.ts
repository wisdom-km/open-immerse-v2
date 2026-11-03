import type {
  AnswerEgressConsentError,
  AnswerEgressConsentInput,
  EgressConsentRequired,
  EgressDestination,
  SetEgressPromptEnabledInput,
  WithdrawEgressConsentError,
  WithdrawEgressConsentInput,
} from "../egress.js";
import type { Result } from "../result.js";

export interface SettingsEgressCommands {
  answerEgressConsent(
    input: AnswerEgressConsentInput,
  ): Promise<Result<Readonly<{ vendorId: string }>, AnswerEgressConsentError>>;
  withdrawEgressConsent(
    input: WithdrawEgressConsentInput,
  ): Promise<
    Result<Readonly<{ vendorId: string }>, WithdrawEgressConsentError>
  >;
  setEgressPromptEnabled(
    input: SetEgressPromptEnabledInput,
  ): Promise<Result<Readonly<{ enabled: boolean }>, never>>;
  listEgressDestinations(): Promise<
    Result<readonly EgressDestination[], never>
  >;
}

export type SettingsEgressChannel =
  | "settings.answerEgressConsent"
  | "settings.withdrawEgressConsent"
  | "settings.setEgressPromptEnabled"
  | "settings.listEgressDestinations"
  | "settings.onEgressConsentRequired";

export type SettingsEgressEventPayload = EgressConsentRequired;

/** ARCHITECTURE §7.4, PRD AC-103. Not a vendor type. Default is api. */
export type JevRoute = "api" | "local";

export type DefaultJevRoute = "api";

export type JevRouteSetting = Readonly<{
  route: JevRoute;
}>;

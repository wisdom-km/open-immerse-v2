export type EgressDecision = "allow" | "ask" | "refused";
// Decision order, first match wins (ARCHITECTURE §7.0):
// 1. allow: loopback or a host the user marked trusted on this machine.
// 2. allow: the prompt switch is off.
// 3. allow: the switch is on and this capability was granted.
// 4. refused: the switch is on and this capability was refused.
// 5. ask: the switch is on and this capability has no answer.

export type EgressCheckInput = Readonly<{
  vendorId: string;
  capability: string;
  host: string;
}>;

export interface EgressCheck {
  check(input: EgressCheckInput): Promise<EgressDecision>;
}

export type EgressSendKind =
  | "region_crop_and_candidates"
  | "rendered_page_image"
  | "text_to_translate"
  | "qa_context";

export type EgressConsentCapability = Readonly<{
  id: string;
  name: string;
  sends: readonly EgressSendKind[];
}>;

export type EgressConsentRequired = Readonly<{
  requestId: string;
  vendorId: string;
  providerName: string;
  capabilities: readonly EgressConsentCapability[];
  isAddition: boolean;
}>;

export type EgressConsentBadge = "granted" | "prompt_disabled" | "refused";

export type EgressDestination = Readonly<{
  vendorId: string;
  providerName: string;
  capabilities: readonly Readonly<{
    id: string;
    name: string;
    sends: readonly EgressSendKind[];
    status: EgressConsentBadge;
  }>[];
}>;

export type AnswerEgressConsentInput = Readonly<{
  requestId: string;
  granted: boolean | null;
}>;

export type AnswerEgressConsentError = Readonly<{ code: "unknown_request" }>;

export type WithdrawEgressConsentInput = Readonly<{ vendorId: string }>;

export type WithdrawEgressConsentError = Readonly<{
  code: "consent_not_granted";
}>;

export type SetEgressPromptEnabledInput = Readonly<{ enabled: boolean }>;

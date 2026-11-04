import { Type, type Static } from "@sinclair/typebox";

import type { IpcCommandResult } from "./descriptor.js";
import {
  CONSENT_NOT_GRANTED,
  UNKNOWN_REQUEST,
  ipcTransportErrors,
} from "./error-codes.js";

const closed = { additionalProperties: false } as const;

const egressSendKindSchema = Type.Union([
  Type.Literal("region_crop_and_candidates"),
  Type.Literal("rendered_page_image"),
  Type.Literal("text_to_translate"),
  Type.Literal("qa_context"),
]);

const egressConsentCapabilitySchema = Type.Object(
  {
    id: Type.String(),
    name: Type.String(),
    sends: Type.Array(egressSendKindSchema),
  },
  closed,
);

const egressConsentRequiredSchema = Type.Object(
  {
    requestId: Type.String(),
    vendorId: Type.String(),
    providerName: Type.String(),
    capabilities: Type.Array(egressConsentCapabilitySchema),
    isAddition: Type.Boolean(),
  },
  closed,
);

const destinationCapabilitySchema = Type.Object(
  {
    id: Type.String(),
    name: Type.String(),
    sends: Type.Array(egressSendKindSchema),
    status: Type.Union([
      Type.Literal("granted"),
      Type.Literal("prompt_disabled"),
      Type.Literal("refused"),
    ]),
  },
  closed,
);

const egressDestinationSchema = Type.Object(
  {
    vendorId: Type.String(),
    providerName: Type.String(),
    capabilities: Type.Array(destinationCapabilitySchema),
  },
  closed,
);

const vendorIdResponse = Type.Object({ vendorId: Type.String() }, closed);

const answerEgressConsentRequest = Type.Object(
  {
    requestId: Type.String(),
    granted: Type.Union([Type.Boolean(), Type.Null()]),
  },
  closed,
);

const withdrawEgressConsentRequest = Type.Object(
  { vendorId: Type.String() },
  closed,
);

const setEgressPromptEnabledRequest = Type.Object(
  { enabled: Type.Boolean() },
  closed,
);

const setEgressPromptEnabledResponse = Type.Object(
  { enabled: Type.Boolean() },
  closed,
);

const listEgressDestinationsResponse = Type.Array(egressDestinationSchema);

export const answerEgressConsent = {
  channel: "settings.answerEgressConsent" as const,
  kind: "command" as const,
  request: answerEgressConsentRequest,
  response: vendorIdResponse,
  errors: [
    { code: UNKNOWN_REQUEST, retryable: false as const },
    ...ipcTransportErrors,
  ] as const,
  idempotent: false as const,
  expose: false as const,
  transport: "invoke" as const,
};

export const withdrawEgressConsent = {
  channel: "settings.withdrawEgressConsent" as const,
  kind: "command" as const,
  request: withdrawEgressConsentRequest,
  response: vendorIdResponse,
  errors: [
    { code: CONSENT_NOT_GRANTED, retryable: false as const },
    ...ipcTransportErrors,
  ] as const,
  idempotent: false as const,
  expose: false as const,
  transport: "invoke" as const,
};

export const setEgressPromptEnabled = {
  channel: "settings.setEgressPromptEnabled" as const,
  kind: "command" as const,
  request: setEgressPromptEnabledRequest,
  response: setEgressPromptEnabledResponse,
  errors: ipcTransportErrors,
  idempotent: true as const,
  expose: false as const,
  transport: "invoke" as const,
};

export const listEgressDestinations = {
  channel: "settings.listEgressDestinations" as const,
  kind: "command" as const,
  response: listEgressDestinationsResponse,
  errors: ipcTransportErrors,
  idempotent: true as const,
  expose: false as const,
  transport: "invoke" as const,
};

export const onEgressConsentRequired = {
  channel: "settings.onEgressConsentRequired" as const,
  kind: "event" as const,
  payload: egressConsentRequiredSchema,
  errors: [] as const,
  expose: false as const,
  transport: "invoke" as const,
};

export const settingsIpc = [
  answerEgressConsent,
  withdrawEgressConsent,
  setEgressPromptEnabled,
  listEgressDestinations,
  onEgressConsentRequired,
] as const;

type SettingsCommand = Extract<
  (typeof settingsIpc)[number],
  { readonly kind: "command" }
>;

type SettingsOperation<Channel extends string> =
  Channel extends `settings.${infer Name}`
    ? Name extends `${string}.${string}`
      ? never
      : Name
    : never;

export type SettingsEgressCommands = {
  [Command in SettingsCommand as SettingsOperation<
    Command["channel"]
  >]: IpcCommandResult<Command>;
};

export type SettingsEgressChannel = (typeof settingsIpc)[number]["channel"];

export type SettingsEgressEventPayload = Static<
  (typeof onEgressConsentRequired)["payload"]
>;

/** ARCHITECTURE §7.4, PRD AC-103. Not a vendor type. Default is api. */
export type JevRoute = "api" | "local";

export type DefaultJevRoute = "api";

export type JevRouteSetting = Readonly<{
  route: JevRoute;
}>;

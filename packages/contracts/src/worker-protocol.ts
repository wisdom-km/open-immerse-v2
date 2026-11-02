import { Type, type Static, type TSchema } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";

const VERSION_PATTERN = "^(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)$";

const versionText = Type.String({ pattern: VERSION_PATTERN });

export const healthResponseSchema = Type.Object(
  {
    protocol: versionText,
    workerVersion: Type.String({ minLength: 1, pattern: "^\\S+$" }),
    mode: Type.Union([Type.Literal("local"), Type.Literal("server")]),
  },
  {
    additionalProperties: true,
    $id: "urn:oi-parse:1:health",
    title: "HealthResponse",
  },
);

export const unsupportedProtocolSchema = Type.Object(
  {
    supported: Type.Array(versionText, { minItems: 1 }),
  },
  {
    additionalProperties: true,
    $id: "urn:oi-parse:1:unsupported",
    title: "UnsupportedProtocol",
  },
);

export const protocolHeaderSchema = Type.Object(
  {
    header: versionText,
  },
  {
    additionalProperties: false,
    $id: "urn:oi-parse:1:protocol-header",
    title: "ProtocolHeader",
  },
);

export type HealthResponse = Static<typeof healthResponseSchema>;
export type UnsupportedProtocol = Static<typeof unsupportedProtocolSchema>;
export type ProtocolHeader = Static<typeof protocolHeaderSchema>;

export const protocolSchemas: readonly { name: string; schema: TSchema }[] = [
  { name: "health", schema: healthResponseSchema },
  { name: "unsupported", schema: unsupportedProtocolSchema },
  { name: "protocol_header", schema: protocolHeaderSchema },
];

export function readHealthResponse(document: unknown): HealthResponse | undefined {
  if (!Value.Check(healthResponseSchema, document)) {
    return undefined;
  }
  return {
    protocol: document.protocol,
    workerVersion: document.workerVersion,
    mode: document.mode,
  };
}

export function readUnsupportedProtocol(document: unknown): UnsupportedProtocol | undefined {
  if (!Value.Check(unsupportedProtocolSchema, document)) {
    return undefined;
  }
  return { supported: [...document.supported] };
}

export function readProtocolHeader(value: unknown): string | undefined {
  const document = { header: value };
  if (!Value.Check(protocolHeaderSchema, document)) {
    return undefined;
  }
  return document.header;
}

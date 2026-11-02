import { Type, type Static } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";

import { versionText } from "./version-text.js";

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

export type UnsupportedProtocol = Static<typeof unsupportedProtocolSchema>;

export function readUnsupportedProtocol(document: unknown): UnsupportedProtocol | undefined {
  if (!Value.Check(unsupportedProtocolSchema, document)) {
    return undefined;
  }
  return { supported: [...document.supported] };
}

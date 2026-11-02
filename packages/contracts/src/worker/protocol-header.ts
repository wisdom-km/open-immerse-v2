import { Type, type Static } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";

import { versionText } from "./version-text.js";

/** ARCHITECTURE §10.4：未知字段接受并忽略，与生成模型的 extra=ignore 一致。 */
export const protocolHeaderSchema = Type.Object(
  {
    header: versionText,
  },
  {
    additionalProperties: true,
    $id: "urn:oi-parse:1:protocol-header",
    title: "ProtocolHeader",
  },
);

export type ProtocolHeader = Static<typeof protocolHeaderSchema>;

export function readProtocolHeader(value: unknown): string | undefined {
  const document = { header: value };
  if (!Value.Check(protocolHeaderSchema, document)) {
    return undefined;
  }
  return document.header;
}

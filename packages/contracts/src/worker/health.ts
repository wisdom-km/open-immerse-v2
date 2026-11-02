import { Type, type Static } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";

import { versionText } from "./version-text.js";

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

export type HealthResponse = Static<typeof healthResponseSchema>;

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

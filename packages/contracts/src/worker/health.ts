import { Type, type Static } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";

import { versionText } from "./version-text.js";
import { workerVersionText } from "./worker-version.js";

export const healthResponseSchema = Type.Object(
  {
    protocol: versionText,
    workerVersion: workerVersionText,
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

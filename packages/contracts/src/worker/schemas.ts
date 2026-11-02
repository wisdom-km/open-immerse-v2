import type { TSchema } from "@sinclair/typebox";

import { healthResponseSchema } from "./health.js";
import { protocolHeaderSchema } from "./protocol-header.js";
import { unsupportedProtocolSchema } from "./unsupported.js";

export const protocolSchemas: readonly { name: string; schema: TSchema }[] = [
  { name: "health", schema: healthResponseSchema },
  { name: "unsupported", schema: unsupportedProtocolSchema },
  { name: "protocol_header", schema: protocolHeaderSchema },
];

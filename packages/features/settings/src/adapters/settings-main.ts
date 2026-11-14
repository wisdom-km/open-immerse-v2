import { fileURLToPath } from "node:url";

import type { AppStorage } from "@oi/platform-node";

import { createGetParseServiceStatus } from "../application/use-cases/get-parse-service-status.js";
import { createGetParseCapabilitiesHandler } from "./get-parse-capabilities-handler.js";
import { createSqliteParseServiceStore } from "./sqlite-parse-service-store.js";
import { createUnavailableSecretLookup } from "./unavailable-secret-lookup.js";

export { createGetParseCapabilitiesHandler } from "./get-parse-capabilities-handler.js";

export function settingsMigrationsDirectory(): string {
  return fileURLToPath(new URL("../../migrations", import.meta.url));
}

export function createSettingsParseCapabilities(storage: AppStorage) {
  return createGetParseCapabilitiesHandler({
    status: createGetParseServiceStatus({
      store: createSqliteParseServiceStore(storage),
      secrets: createUnavailableSecretLookup(),
    }),
  });
}

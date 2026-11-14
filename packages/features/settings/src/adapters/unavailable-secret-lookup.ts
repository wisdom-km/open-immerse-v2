import type { ParseSecretLookup } from "../application/ports/parse-secret-lookup.js";

export function createUnavailableSecretLookup(): ParseSecretLookup {
  return {
    lookup() {
      return "unavailable";
    },
  };
}

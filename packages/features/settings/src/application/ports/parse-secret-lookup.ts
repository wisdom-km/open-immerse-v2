import type { ParseSecretAnswer } from "../../domain/parse-record.js";

export type ParseSecretLookup = {
  lookup(slot: string): ParseSecretAnswer;
};

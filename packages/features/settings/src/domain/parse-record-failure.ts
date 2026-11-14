export type ParseRecordCode = "storage_corrupt" | "secret_unavailable";

export type ParseRecordFailure = {
  readonly code: ParseRecordCode;
};

export function parseRecordFailure(code: ParseRecordCode): ParseRecordFailure {
  return { code };
}

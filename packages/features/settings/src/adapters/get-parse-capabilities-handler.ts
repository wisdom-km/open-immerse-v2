import type { GetParseServiceStatus } from "../application/use-cases/get-parse-service-status.js";
import type { ParseRecordFailure } from "../domain/parse-record-failure.js";

export function createGetParseCapabilitiesHandler(deps: {
  readonly status: GetParseServiceStatus;
}) {
  return (input: Record<string, never>) =>
    Promise.resolve(translate(deps.status, input));
}

function translate(
  status: GetParseServiceStatus,
  input: Record<string, never>,
) {
  const result = status(input);
  if (result.ok) {
    return { ok: true, value: result.value };
  }
  return { ok: false, error: ipcError(result.error) };
}

function ipcError(error: ParseRecordFailure): {
  readonly code: ParseRecordFailure["code"];
  readonly retryable: false;
} {
  return { code: error.code, retryable: false };
}

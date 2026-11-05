import type { IpcPassThrough } from "./pass-through.js";
import { payloadMatches } from "./payload-schema.js";
import type { IpcJsonSchema } from "./registry.generated.js";

// Same codes and retryable flags as contracts `ipcTransportErrors`.
// Desktop main does not import `@oi/contracts` (preload plan §3.3).
const transportRetryable = {
  sender_rejected: false,
  invalid_payload: false,
  handler_threw: true,
} as const;

type TransportCode = keyof typeof transportRetryable;

type ErrorBody = {
  readonly code: string;
  readonly retryable: boolean;
};

export function acceptHandlerResult(
  response: IpcJsonSchema,
  produced: IpcPassThrough,
): IpcPassThrough {
  if (produced.ok) {
    return acceptValue(response, produced);
  }
  return acceptError(produced.error);
}

function acceptValue(
  response: IpcJsonSchema,
  produced: IpcPassThrough & { readonly ok: true },
): IpcPassThrough {
  // Schema mismatch is not retryable. Throws stay `handler_threw`.
  if (!payloadMatches(response, produced.value)) {
    return invalidPayload();
  }
  if (Object.keys(produced).length === 2) {
    return produced;
  }
  return { ok: true, value: produced.value };
}

function acceptError(error: ErrorBody): IpcPassThrough {
  if (isTransportCode(error.code)) {
    return transportError(error.code);
  }
  return businessError(error);
}

function isTransportCode(code: string): code is TransportCode {
  return (
    code === "sender_rejected" ||
    code === "invalid_payload" ||
    code === "handler_threw"
  );
}

function transportError(code: TransportCode): IpcPassThrough {
  return {
    ok: false,
    error: { code, retryable: transportRetryable[code] },
  };
}

function businessError(error: ErrorBody): IpcPassThrough {
  const code = error.code;
  const retryable = error.retryable;
  if (!hasDetail(error) || error.detail === undefined) {
    return { ok: false, error: { code, retryable } };
  }
  const body = { code, retryable, detail: error.detail };
  return { ok: false, error: body };
}

function hasDetail(error: object): error is { readonly detail: unknown } {
  return Object.hasOwn(error, "detail");
}

function invalidPayload(): IpcPassThrough {
  return {
    ok: false,
    error: { code: "invalid_payload", retryable: false },
  };
}

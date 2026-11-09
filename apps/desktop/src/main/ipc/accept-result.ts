import type { IpcErrorFields, IpcPassThrough } from "./pass-through.js";
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

function acceptError(error: IpcErrorFields): IpcPassThrough {
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

function businessError(error: IpcErrorFields): IpcPassThrough {
  const fields: Record<string, unknown> = {};
  copyBusinessFields(error, fields);
  if (isPlainObject(error.detail)) {
    copyBusinessFields(error.detail, fields);
  }
  return {
    ok: false,
    error: { code: error.code, retryable: error.retryable, ...fields },
  };
}

function copyBusinessFields(
  source: Readonly<Record<string, unknown>>,
  target: Record<string, unknown>,
): void {
  for (const key of Object.keys(source)) {
    if (isSkippedField(key) || Object.hasOwn(target, key)) {
      continue;
    }
    target[key] = source[key];
  }
}

function isSkippedField(key: string): boolean {
  // Assigning "__proto__" changes [[Prototype]]. It is not a business field.
  return (
    key === "code" ||
    key === "retryable" ||
    key === "message" ||
    key === "detail" ||
    key === "stack" ||
    key === "__proto__"
  );
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function invalidPayload(): IpcPassThrough {
  return {
    ok: false,
    error: { code: "invalid_payload", retryable: false },
  };
}

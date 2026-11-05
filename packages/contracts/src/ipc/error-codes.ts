/** Shared IPC codes referenced by slice descriptors. Not `contracts/src/errors.ts`. */

export const SENDER_REJECTED = "sender_rejected" as const;
export const INVALID_PAYLOAD = "invalid_payload" as const;
export const HANDLER_THREW = "handler_threw" as const;
export const UNKNOWN_REQUEST = "unknown_request" as const;
export const CONSENT_NOT_GRANTED = "consent_not_granted" as const;
/** #67 码表。ARCH §9.1 写过 `not-found`，契约用这个 snake_case。 */
export const NOT_FOUND = "not_found" as const;
/** #67 码表。用户取消对话框。 */
export const CANCELLED = "cancelled" as const;

/** Transport failures. No `detail`, no `message`. */
export const ipcTransportErrors = [
  { code: SENDER_REJECTED, retryable: false },
  { code: INVALID_PAYLOAD, retryable: false },
  { code: HANDLER_THREW, retryable: true },
] as const;

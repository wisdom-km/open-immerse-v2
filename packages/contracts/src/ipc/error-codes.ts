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
/**
 * 有配置记录，但记录损坏。不是 unconfigured。
 * 本常量不读存储。
 */
export const STORAGE_CORRUPT = "storage_corrupt" as const;
/**
 * 有配置记录，但所引用密钥缺失或解不开。不是 unconfigured。
 * 本常量不枚举密钥。
 */
export const SECRET_UNAVAILABLE = "secret_unavailable" as const;
/** 写入没有提交。成功体不会因此变成 configured。 */
export const SAVE_FAILED = "save_failed" as const;

/** Transport failures. No `detail`, no `message`. */
export const ipcTransportErrors = [
  { code: SENDER_REJECTED, retryable: false },
  { code: INVALID_PAYLOAD, retryable: false },
  { code: HANDLER_THREW, retryable: true },
] as const;

/** 读配置事实的错误。没有 save_failed。unconfigured 不是其中的码。 */
export const parseServiceReadErrors = [
  { code: STORAGE_CORRUPT, retryable: false as const },
  { code: SECRET_UNAVAILABLE, retryable: false as const },
  ...ipcTransportErrors,
] as const;

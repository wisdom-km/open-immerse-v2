export const STORAGE_APP_SCHEMA = 1;

export type StorageCode =
  | "storage.open_failed"
  | "storage.locked"
  | "storage.backup_failed"
  | "storage.migration_failed"
  | "storage.restore_failed"
  | "storage.readonly"
  | "storage.invalid_path"
  | "storage.json_rejected"
  | "storage.request_failed";

export type StorageFailure = {
  readonly code: StorageCode;
  readonly message: string;
  readonly cause?: unknown;
};

export function storageFailure(
  code: StorageCode,
  message: string,
  cause?: unknown,
): StorageFailure {
  if (cause === undefined) {
    return { code, message };
  }
  return { code, message, cause };
}

export class StorageError extends Error {
  readonly code: StorageCode;

  constructor(failure: StorageFailure) {
    super(failure.message);
    this.name = "StorageError";
    this.code = failure.code;
  }
}

export const STORAGE_APP_SCHEMA = 1;

export type StorageCode =
  | "storage.open_failed"
  | "storage.backup_failed"
  | "storage.migration_failed"
  | "storage.readonly"
  | "storage.invalid_path"
  | "storage.json_rejected"
  | "storage.request_failed";

export type StorageFailure = {
  readonly code: StorageCode;
  readonly message: string;
};

export function storageFailure(
  code: StorageCode,
  message: string,
): StorageFailure {
  return { code, message };
}

export class StorageError extends Error {
  readonly code: StorageCode;

  constructor(failure: StorageFailure) {
    super(failure.message);
    this.name = "StorageError";
    this.code = failure.code;
  }
}

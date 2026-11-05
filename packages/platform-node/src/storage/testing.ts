import type { Result } from "@oi/kernel";

import type { StorageFailure } from "./errors.js";
import type { AppStorage } from "./handle.js";
import {
  openAppStorageUsing,
  type OpenStorageOptions,
} from "./open-storage.js";
import { defaultStorageIo, type StorageIo } from "./storage-io.js";

export function openAppStorageForTests(
  options: OpenStorageOptions,
  io: Partial<StorageIo>,
): Result<AppStorage, StorageFailure> {
  const defaults = defaultStorageIo();
  return openAppStorageUsing(options, {
    readSnapshot: io.readSnapshot ?? defaults.readSnapshot,
    restoreSnapshot: io.restoreSnapshot ?? defaults.restoreSnapshot,
  });
}

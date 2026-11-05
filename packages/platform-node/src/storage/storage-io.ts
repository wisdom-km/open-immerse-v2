import type { Clock } from "@oi/kernel";

import type { DataRootLayout } from "./data-root.js";
import type { MigrationSource } from "./migrations.js";
import {
  readDatabaseSnapshot,
  restoreDatabaseSnapshot,
  type FileSnapshot,
} from "./snapshot.js";

export type StorageIo = {
  readonly readSnapshot: (databaseFile: string) => FileSnapshot;
  readonly restoreSnapshot: (
    databaseFile: string,
    snapshot: FileSnapshot,
  ) => void;
};

export type PreparedOpen = {
  readonly layout: DataRootLayout;
  readonly supportedAppSchema: number;
  readonly migrations: readonly MigrationSource[];
  readonly clock: Clock;
  readonly io: StorageIo;
};

export function defaultStorageIo(): StorageIo {
  return {
    readSnapshot: readDatabaseSnapshot,
    restoreSnapshot: restoreDatabaseSnapshot,
  };
}

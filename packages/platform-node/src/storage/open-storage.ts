import { DatabaseSync } from "node:sqlite";

import type { Clock, Result } from "@oi/kernel";

import {
  dataRootLayout,
  ensureDataRootDirectories,
  type DataRootLayout,
} from "./data-root.js";
import {
  STORAGE_APP_SCHEMA,
  storageFailure,
  type StorageFailure,
} from "./errors.js";
import { createHandle, readCurrentSchema, type AppStorage } from "./handle.js";
import {
  applyMigrations,
  migrationKey,
  sortMigrations,
  type MigrationSource,
} from "./migrations.js";
import { probeDatabase, type DatabaseProbe } from "./probe.js";
import {
  readDatabaseSnapshot,
  removeDatabaseFiles,
  restoreDatabaseSnapshot,
  writeSingleBackup,
} from "./snapshot.js";

export type OpenStorageOptions = {
  readonly dataRoot: string;
  readonly clock: Clock;
  readonly supportedAppSchema?: number;
  readonly migrations?: readonly MigrationSource[];
};

type PreparedOpen = {
  readonly layout: DataRootLayout;
  readonly supportedAppSchema: number;
  readonly migrations: readonly MigrationSource[];
  readonly clock: Clock;
};

export function openAppStorage(
  options: OpenStorageOptions,
): Result<AppStorage, StorageFailure> {
  const prepared = prepareOpen(options);
  if (!prepared.ok) {
    return prepared;
  }
  return openPrepared(prepared.value);
}

function prepareOpen(
  options: OpenStorageOptions,
): Result<PreparedOpen, StorageFailure> {
  const supported = resolveSupported(options.supportedAppSchema);
  const sorted = sortMigrations(options.migrations ?? []);
  if (supported === undefined || !validRoot(options.dataRoot) || !sorted.ok) {
    return {
      ok: false,
      error: storageFailure(
        sorted.ok ? "storage.open_failed" : sorted.error.code,
        sorted.ok ? "database could not be opened" : sorted.error.message,
      ),
    };
  }
  return {
    ok: true,
    value: {
      layout: dataRootLayout(options.dataRoot),
      supportedAppSchema: supported,
      migrations: sorted.value,
      clock: options.clock,
    },
  };
}

function openPrepared(
  prepared: PreparedOpen,
): Result<AppStorage, StorageFailure> {
  const probe = probeDatabase(prepared.layout.databaseFile);
  if (probe.kind === "failed") {
    return {
      ok: false,
      error: storageFailure(
        "storage.open_failed",
        "database could not be opened",
      ),
    };
  }
  if (probe.kind === "ready" && probe.appSchema > prepared.supportedAppSchema) {
    ensureDataRootDirectories(prepared.layout);
    return openReadonly(prepared.layout, probe.appSchema);
  }
  const pending = pendingMigrations(prepared.migrations, probe);
  ensureDataRootDirectories(prepared.layout);
  if (!needsMigration(probe, pending, prepared.supportedAppSchema)) {
    return openReadWrite(prepared.layout, probe);
  }
  if (probe.kind === "absent") {
    return createDatabase(prepared, pending);
  }
  return migrateDatabase(prepared, pending);
}

function pendingMigrations(
  migrations: readonly MigrationSource[],
  probe: DatabaseProbe,
): readonly MigrationSource[] {
  if (probe.kind !== "ready") {
    return migrations;
  }
  return migrations.filter(
    (migration) =>
      !probe.applied.has(migrationKey(migration.slice, migration.version)),
  );
}

function needsMigration(
  probe: DatabaseProbe,
  pending: readonly MigrationSource[],
  supportedAppSchema: number,
): boolean {
  if (probe.kind !== "ready") {
    return true;
  }
  return (
    probe.needsBootstrap ||
    pending.length > 0 ||
    probe.appSchema < supportedAppSchema
  );
}

function openReadonly(
  layout: DataRootLayout,
  appSchema: number,
): Result<AppStorage, StorageFailure> {
  try {
    const database = new DatabaseSync(layout.databaseFile, {
      readOnly: true,
      timeout: 0,
      enableForeignKeyConstraints: true,
    });
    return {
      ok: true,
      value: createHandle(database, layout, "read-only", appSchema),
    };
  } catch {
    return {
      ok: false,
      error: storageFailure(
        "storage.open_failed",
        "database could not be opened",
      ),
    };
  }
}

function openReadWrite(
  layout: DataRootLayout,
  probe: DatabaseProbe,
): Result<AppStorage, StorageFailure> {
  const appSchema = probe.kind === "ready" ? probe.appSchema : 0;
  try {
    const database = openWriter(layout.databaseFile);
    database.exec("PRAGMA journal_mode = WAL");
    return {
      ok: true,
      value: createHandle(database, layout, "read-write", appSchema),
    };
  } catch {
    return {
      ok: false,
      error: storageFailure(
        "storage.open_failed",
        "database could not be opened",
      ),
    };
  }
}

function createDatabase(
  prepared: PreparedOpen,
  pending: readonly MigrationSource[],
): Result<AppStorage, StorageFailure> {
  let database: DatabaseSync | undefined;
  try {
    database = openWriter(prepared.layout.databaseFile);
    runMigration(database, pending, prepared);
    return {
      ok: true,
      value: createHandle(
        database,
        prepared.layout,
        "read-write",
        readCurrentSchema(database),
      ),
    };
  } catch {
    database?.close();
    removeDatabaseFiles(prepared.layout.databaseFile);
    return {
      ok: false,
      error: storageFailure(
        "storage.migration_failed",
        "migration rolled back",
      ),
    };
  }
}

function migrateDatabase(
  prepared: PreparedOpen,
  pending: readonly MigrationSource[],
): Result<AppStorage, StorageFailure> {
  const snapshot = readDatabaseSnapshot(prepared.layout.databaseFile);
  try {
    writeSingleBackup(prepared.layout.stagingDirectory, snapshot.main);
  } catch {
    return {
      ok: false,
      error: storageFailure(
        "storage.open_failed",
        "database could not be opened",
      ),
    };
  }
  let database: DatabaseSync | undefined;
  try {
    database = openWriter(prepared.layout.databaseFile);
    runMigration(database, pending, prepared);
    return {
      ok: true,
      value: createHandle(
        database,
        prepared.layout,
        "read-write",
        readCurrentSchema(database),
      ),
    };
  } catch {
    database?.close();
    restoreDatabaseSnapshot(prepared.layout.databaseFile, snapshot);
    return {
      ok: false,
      error: storageFailure(
        "storage.migration_failed",
        "migration rolled back",
      ),
    };
  }
}

function runMigration(
  database: DatabaseSync,
  pending: readonly MigrationSource[],
  prepared: PreparedOpen,
): void {
  database.exec("PRAGMA journal_mode = WAL");
  database.exec("BEGIN IMMEDIATE");
  try {
    applyMigrations(
      database,
      pending,
      prepared.supportedAppSchema,
      new Date(prepared.clock.nowMs()).toISOString(),
    );
    database.exec("COMMIT");
  } catch (error) {
    rollbackQuietly(database);
    throw error;
  }
}

function openWriter(databaseFile: string): DatabaseSync {
  return new DatabaseSync(databaseFile, {
    readOnly: false,
    timeout: 0,
    enableForeignKeyConstraints: true,
  });
}

function rollbackQuietly(database: DatabaseSync): void {
  try {
    database.exec("ROLLBACK");
  } catch {
    return;
  }
}

function resolveSupported(value: number | undefined): number | undefined {
  if (value === undefined) {
    return STORAGE_APP_SCHEMA;
  }
  if (!Number.isInteger(value) || value < 0) {
    return undefined;
  }
  return value;
}

function validRoot(dataRoot: string): boolean {
  return dataRoot.length > 0 && !dataRoot.includes("\u0000");
}

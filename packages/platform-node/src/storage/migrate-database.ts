import { DatabaseSync } from "node:sqlite";

import type { Result } from "@oi/kernel";

import { storageFailure, type StorageFailure } from "./errors.js";
import { createHandle, readCurrentSchema, type AppStorage } from "./handle.js";
import { applyMigrations, type MigrationSource } from "./migrations.js";
import {
  removeDatabaseFiles,
  writeSingleBackup,
  type FileSnapshot,
} from "./snapshot.js";
import type { PreparedOpen } from "./storage-io.js";

export function createDatabase(
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
    return migrationFailed();
  }
}

export function migrateDatabase(
  prepared: PreparedOpen,
  pending: readonly MigrationSource[],
  snapshot: FileSnapshot,
): Result<AppStorage, StorageFailure> {
  try {
    writeSingleBackup(prepared.layout.stagingDirectory, snapshot);
  } catch {
    return failedRestore(prepared, snapshot) ?? backupFailed();
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
    return failedRestore(prepared, snapshot) ?? migrationFailed();
  }
}

export function openWriter(databaseFile: string): DatabaseSync {
  return new DatabaseSync(databaseFile, {
    readOnly: false,
    timeout: 0,
    enableForeignKeyConstraints: true,
  });
}

function failedRestore(
  prepared: PreparedOpen,
  snapshot: FileSnapshot,
): Result<AppStorage, StorageFailure> | undefined {
  try {
    prepared.io.restoreSnapshot(prepared.layout.databaseFile, snapshot);
    return undefined;
  } catch (error) {
    return {
      ok: false,
      error: storageFailure(
        "storage.restore_failed",
        "database snapshot could not be restored",
        error,
      ),
    };
  }
}

function backupFailed(): Result<AppStorage, StorageFailure> {
  return {
    ok: false,
    error: storageFailure(
      "storage.backup_failed",
      "database backup could not be written",
    ),
  };
}

function migrationFailed(): Result<AppStorage, StorageFailure> {
  return {
    ok: false,
    error: storageFailure("storage.migration_failed", "migration rolled back"),
  };
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

function rollbackQuietly(database: DatabaseSync): void {
  try {
    database.exec("ROLLBACK");
  } catch {
    return;
  }
}

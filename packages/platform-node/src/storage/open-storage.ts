import { existsSync } from "node:fs";

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
import { createHandle, type AppStorage } from "./handle.js";
import {
  migrationKey,
  sortMigrations,
  type MigrationSource,
} from "./migrations.js";
import {
  createDatabase,
  migrateDatabase,
  openWriter,
} from "./migrate-database.js";
import { probeDatabase, type DatabaseProbe } from "./probe.js";
import type { FileSnapshot } from "./snapshot.js";
import {
  defaultStorageIo,
  type PreparedOpen,
  type StorageIo,
} from "./storage-io.js";

export type OpenStorageOptions = {
  readonly dataRoot: string;
  readonly clock: Clock;
  readonly supportedAppSchema?: number;
  readonly migrations?: readonly MigrationSource[];
};

export function openAppStorage(
  options: OpenStorageOptions,
): Result<AppStorage, StorageFailure> {
  return openAppStorageUsing(options, defaultStorageIo());
}

export function openAppStorageUsing(
  options: OpenStorageOptions,
  io: StorageIo,
): Result<AppStorage, StorageFailure> {
  const prepared = prepareOpen(options, io);
  if (!prepared.ok) {
    return prepared;
  }
  return openPrepared(prepared.value);
}

function prepareOpen(
  options: OpenStorageOptions,
  io: StorageIo,
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
      io,
    },
  };
}

function openPrepared(
  prepared: PreparedOpen,
): Result<AppStorage, StorageFailure> {
  const databaseFile = prepared.layout.databaseFile;
  const prior = readPrior(databaseFile, prepared.io.readSnapshot);
  if (!prior.ok) {
    return prior;
  }
  const probe = probeDatabase(databaseFile);
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
  if (probe.kind === "absent" || prior.value === undefined) {
    return createDatabase(prepared, pending);
  }
  return migrateDatabase(prepared, pending, prior.value);
}

function readPrior(
  databaseFile: string,
  readSnapshot: StorageIo["readSnapshot"],
): Result<FileSnapshot | undefined, StorageFailure> {
  if (!existsSync(databaseFile)) {
    return { ok: true, value: undefined };
  }
  try {
    return { ok: true, value: readSnapshot(databaseFile) };
  } catch (error) {
    return { ok: false, error: snapshotReadFailure(error) };
  }
}

function snapshotReadFailure(error: unknown): StorageFailure {
  if (isLockOrDenied(error)) {
    return storageFailure("storage.locked", "被锁定或没有权限", error);
  }
  return storageFailure(
    "storage.open_failed",
    "database could not be opened",
    error,
  );
}

function isLockOrDenied(error: unknown): boolean {
  if (typeof error !== "object" || error === null || !("code" in error)) {
    return false;
  }
  return (
    error.code === "EBUSY" || error.code === "EPERM" || error.code === "EACCES"
  );
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

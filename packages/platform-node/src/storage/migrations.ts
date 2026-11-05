import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import type { DatabaseSync } from "node:sqlite";

import type { Result } from "@oi/kernel";

import { storageFailure, type StorageFailure } from "./errors.js";

export type MigrationSource = {
  readonly slice: string;
  readonly version: number;
  readonly id: string;
  readonly sql: string;
};

const SLICE_NAME = /^[a-z][a-z0-9-]{0,32}$/;
const MIGRATION_FILE = /^(\d{4})_([a-z0-9_]+)\.sql$/;

const BOOTSTRAP_SQL = `
CREATE TABLE IF NOT EXISTS app_meta (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  app_schema INTEGER NOT NULL CHECK (app_schema >= 0)
);
INSERT INTO app_meta (id, app_schema)
SELECT 1, 0
WHERE NOT EXISTS (SELECT 1 FROM app_meta WHERE id = 1);
CREATE TABLE IF NOT EXISTS schema_migrations (
  slice TEXT NOT NULL,
  version INTEGER NOT NULL,
  migration_id TEXT NOT NULL,
  applied_at TEXT NOT NULL,
  PRIMARY KEY (slice, version)
);
CREATE TRIGGER IF NOT EXISTS app_meta_schema_monotonic
BEFORE UPDATE OF app_schema ON app_meta
FOR EACH ROW
WHEN NEW.app_schema < OLD.app_schema
BEGIN
  SELECT RAISE(ABORT, 'app_schema decreased');
END;
`;

export function migrationKey(slice: string, version: number): string {
  return `${slice}\u0000${String(version)}`;
}

export function sortMigrations(
  migrations: readonly MigrationSource[],
): Result<readonly MigrationSource[], StorageFailure> {
  const seen = new Set<string>();
  for (const migration of migrations) {
    if (!validMigration(migration) || seen.has(keyOf(migration))) {
      return rejectedMigration();
    }
    seen.add(keyOf(migration));
  }
  return {
    ok: true,
    value: [...migrations].sort(compareMigrations),
  };
}

export function readSliceMigrations(
  slice: string,
  directory: string,
): Result<readonly MigrationSource[], StorageFailure> {
  if (!SLICE_NAME.test(slice)) {
    return rejectedMigration();
  }
  const names = migrationNames(directory);
  if (names === undefined) {
    return rejectedMigration();
  }
  const loaded: MigrationSource[] = [];
  for (const name of names) {
    const parsed = parseMigrationFile(slice, directory, name);
    if (!parsed.ok) {
      return parsed;
    }
    loaded.push(parsed.value);
  }
  return sortMigrations(loaded);
}

export function applyMigrations(
  database: DatabaseSync,
  pending: readonly MigrationSource[],
  supportedAppSchema: number,
  appliedAt: string,
): void {
  database.exec(BOOTSTRAP_SQL);
  const insert = database.prepare(
    "INSERT INTO schema_migrations (slice, version, migration_id, applied_at) VALUES (?, ?, ?, ?)",
  );
  for (const migration of pending) {
    database.exec(migration.sql);
    insert.run(migration.slice, migration.version, migration.id, appliedAt);
  }
  database
    .prepare(
      "UPDATE app_meta SET app_schema = ? WHERE id = 1 AND app_schema < ?",
    )
    .run(supportedAppSchema, supportedAppSchema);
}

function migrationNames(directory: string): string[] | undefined {
  try {
    return readdirSync(directory);
  } catch {
    return undefined;
  }
}

function parseMigrationFile(
  slice: string,
  directory: string,
  name: string,
): Result<MigrationSource, StorageFailure> {
  const match = MIGRATION_FILE.exec(name);
  const versionText = match?.[1];
  if (versionText === undefined) {
    return rejectedMigration();
  }
  const version = Number(versionText);
  if (!Number.isInteger(version) || version < 1) {
    return rejectedMigration();
  }
  try {
    return {
      ok: true,
      value: {
        slice,
        version,
        id: name,
        sql: readFileSync(path.join(directory, name), "utf8"),
      },
    };
  } catch {
    return rejectedMigration();
  }
}

function validMigration(migration: MigrationSource): boolean {
  return (
    SLICE_NAME.test(migration.slice) &&
    Number.isInteger(migration.version) &&
    migration.version >= 1 &&
    migration.id.length > 0
  );
}

function compareMigrations(
  left: MigrationSource,
  right: MigrationSource,
): number {
  const bySlice = left.slice.localeCompare(right.slice, "en");
  if (bySlice !== 0) {
    return bySlice;
  }
  return left.version - right.version;
}

function keyOf(migration: MigrationSource): string {
  return migrationKey(migration.slice, migration.version);
}

function rejectedMigration(): Result<never, StorageFailure> {
  return {
    ok: false,
    error: storageFailure("storage.migration_failed", "migration was rejected"),
  };
}

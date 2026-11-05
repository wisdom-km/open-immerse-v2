import { existsSync } from "node:fs";

import { DatabaseSync } from "node:sqlite";

import { migrationKey } from "./migrations.js";

export type DatabaseProbe =
  | { readonly kind: "absent" }
  | { readonly kind: "failed" }
  | {
      readonly kind: "ready";
      readonly appSchema: number;
      readonly applied: ReadonlySet<string>;
      readonly needsBootstrap: boolean;
    };

export function probeDatabase(databaseFile: string): DatabaseProbe {
  if (!existsSync(databaseFile)) {
    return { kind: "absent" };
  }
  let database: DatabaseSync | undefined;
  try {
    database = new DatabaseSync(databaseFile, {
      readOnly: true,
      timeout: 0,
      enableForeignKeyConstraints: true,
    });
    return readProbe(database);
  } catch {
    return { kind: "failed" };
  } finally {
    database?.close();
  }
}

function readProbe(database: DatabaseSync): DatabaseProbe {
  const names = tableNames(database);
  const hasMeta = names.has("app_meta");
  const hasMigrations = names.has("schema_migrations");
  return {
    kind: "ready",
    appSchema: hasMeta ? readAppSchema(database) : 0,
    applied: hasMigrations ? readApplied(database) : new Set<string>(),
    needsBootstrap: !hasMeta || !hasMigrations,
  };
}

function tableNames(database: DatabaseSync): Set<string> {
  const rows = database
    .prepare(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name IN ('app_meta', 'schema_migrations')",
    )
    .all();
  const names = new Set<string>();
  for (const row of rows) {
    if (typeof row.name === "string") {
      names.add(row.name);
    }
  }
  return names;
}

function readAppSchema(database: DatabaseSync): number {
  const row = database
    .prepare("SELECT app_schema FROM app_meta WHERE id = 1")
    .get();
  const value = row?.app_schema;
  if (typeof value === "number" && Number.isInteger(value) && value >= 0) {
    return value;
  }
  return 0;
}

function readApplied(database: DatabaseSync): Set<string> {
  const rows = database
    .prepare("SELECT slice, version FROM schema_migrations")
    .all();
  const applied = new Set<string>();
  for (const row of rows) {
    if (typeof row.slice === "string" && typeof row.version === "number") {
      applied.add(migrationKey(row.slice, row.version));
    }
  }
  return applied;
}

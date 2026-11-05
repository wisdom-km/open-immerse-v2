import type { DatabaseSync, StatementSync } from "node:sqlite";

import { StorageError, storageFailure, type StorageFailure } from "./errors.js";
import type { DataRootLayout } from "./data-root.js";

export type SqlValue = null | number | bigint | string | Uint8Array;

export type StorageMode = "read-write" | "read-only";

export type AppStorage = {
  readonly layout: DataRootLayout;
  readonly mode: StorageMode;
  readonly appSchema: number;
  readonly writes: number;
  query(
    sql: string,
    params?: readonly SqlValue[],
  ): Record<string, unknown> | undefined;
  queryAll(
    sql: string,
    params?: readonly SqlValue[],
  ): Record<string, unknown>[];
  execute(sql: string, params?: readonly SqlValue[]): void;
  transaction<T>(work: () => T): T;
  close(): void;
};

export function createHandle(
  database: DatabaseSync,
  layout: DataRootLayout,
  mode: StorageMode,
  appSchema: number,
): AppStorage {
  const counter = { count: 0 };
  return {
    layout,
    mode,
    appSchema,
    get writes() {
      return counter.count;
    },
    query(sql, params) {
      return oneRow(database, sql, params);
    },
    queryAll(sql, params) {
      return manyRows(database, sql, params);
    },
    execute(sql, params) {
      writeStatement(database, mode, counter, sql, params);
    },
    transaction(work) {
      return runTransaction(database, mode, work);
    },
    close() {
      database.close();
    },
  };
}

export function readCurrentSchema(database: DatabaseSync): number {
  const row = database
    .prepare("SELECT app_schema FROM app_meta WHERE id = 1")
    .get();
  const value = row?.app_schema;
  if (typeof value === "number" && Number.isInteger(value)) {
    return value;
  }
  return 0;
}

function oneRow(
  database: DatabaseSync,
  sql: string,
  params: readonly SqlValue[] | undefined,
): Record<string, unknown> | undefined {
  const row = withStatement(database, sql, (statement) =>
    params === undefined
      ? statement.get()
      : statement.get(...copyParams(params)),
  );
  if (row === undefined) {
    return undefined;
  }
  return { ...row };
}

function manyRows(
  database: DatabaseSync,
  sql: string,
  params: readonly SqlValue[] | undefined,
): Record<string, unknown>[] {
  const rows = withStatement(database, sql, (statement) =>
    params === undefined
      ? statement.all()
      : statement.all(...copyParams(params)),
  );
  return rows.map((row) => ({ ...row }));
}

function writeStatement(
  database: DatabaseSync,
  mode: StorageMode,
  counter: { count: number },
  sql: string,
  params: readonly SqlValue[] | undefined,
): void {
  refuseReadonly(mode);
  withStatement(database, sql, (statement) => {
    if (params === undefined) {
      statement.run();
      return;
    }
    statement.run(...copyParams(params));
  });
  counter.count += 1;
}

function runTransaction<T>(
  database: DatabaseSync,
  mode: StorageMode,
  work: () => T,
): T {
  refuseReadonly(mode);
  if (database.isTransaction) {
    throw new StorageError(
      storageFailure("storage.request_failed", "transaction is already open"),
    );
  }
  database.exec("BEGIN IMMEDIATE");
  try {
    const value = work();
    database.exec("COMMIT");
    return value;
  } catch (error) {
    rollbackQuietly(database);
    throw error;
  }
}

function withStatement<T>(
  database: DatabaseSync,
  sql: string,
  use: (statement: StatementSync) => T,
): T {
  try {
    return use(database.prepare(sql));
  } catch (error) {
    if (error instanceof StorageError) {
      throw error;
    }
    throw new StorageError(requestFailed());
  }
}

function refuseReadonly(mode: StorageMode): void {
  if (mode === "read-only") {
    throw new StorageError(
      storageFailure("storage.readonly", "database is read-only"),
    );
  }
}

function rollbackQuietly(database: DatabaseSync): void {
  try {
    database.exec("ROLLBACK");
  } catch {
    return;
  }
}

function copyParams(params: readonly SqlValue[]): SqlValue[] {
  return [...params];
}

function requestFailed(): StorageFailure {
  return storageFailure("storage.request_failed", "database request failed");
}

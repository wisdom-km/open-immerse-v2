import {
  existsSync,
  readFileSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

import { DatabaseSync } from "node:sqlite";

export type FileSnapshot = {
  readonly main: Buffer;
  readonly wal: Buffer | undefined;
  readonly shm: Buffer | undefined;
};

export function readDatabaseSnapshot(databaseFile: string): FileSnapshot {
  return {
    main: readFileSync(databaseFile),
    wal: readOptional(`${databaseFile}-wal`),
    shm: readOptional(`${databaseFile}-shm`),
  };
}

export function restoreDatabaseSnapshot(
  databaseFile: string,
  snapshot: FileSnapshot,
): void {
  writeFileSync(databaseFile, snapshot.main);
  restoreSide(`${databaseFile}-wal`, snapshot.wal);
  restoreSide(`${databaseFile}-shm`, snapshot.shm);
}

export function writeSingleBackup(
  stagingDirectory: string,
  snapshot: FileSnapshot,
): void {
  const copy = path.join(stagingDirectory, "oi.sqlite.ckpt");
  removeDatabaseFiles(copy);
  try {
    materialize(copy, snapshot);
    checkpointTruncate(copy);
    writeBackupFile(stagingDirectory, readFileSync(copy));
  } finally {
    removeDatabaseFiles(copy);
  }
}

export function removeDatabaseFiles(databaseFile: string): void {
  for (const suffix of ["", "-wal", "-shm"]) {
    const file = `${databaseFile}${suffix}`;
    if (existsSync(file)) {
      unlinkSync(file);
    }
  }
}

function readOptional(file: string): Buffer | undefined {
  if (!existsSync(file)) {
    return undefined;
  }
  return readFileSync(file);
}

function restoreSide(file: string, bytes: Buffer | undefined): void {
  if (bytes === undefined) {
    if (existsSync(file)) {
      unlinkSync(file);
    }
    return;
  }
  writeFileSync(file, bytes);
}

function materialize(databaseFile: string, snapshot: FileSnapshot): void {
  writeFileSync(databaseFile, snapshot.main);
  writeSide(`${databaseFile}-wal`, snapshot.wal);
  writeSide(`${databaseFile}-shm`, snapshot.shm);
}

function writeSide(file: string, bytes: Buffer | undefined): void {
  if (bytes !== undefined) {
    writeFileSync(file, bytes);
  }
}

function checkpointTruncate(databaseFile: string): void {
  const database = new DatabaseSync(databaseFile, {
    readOnly: false,
    timeout: 0,
    enableForeignKeyConstraints: true,
  });
  try {
    const row = database.prepare("PRAGMA wal_checkpoint(TRUNCATE)").get();
    if (!checkpointFinished(row)) {
      throw new Error("wal checkpoint did not finish");
    }
  } finally {
    database.close();
  }
}

function checkpointFinished(row: unknown): boolean {
  if (typeof row !== "object" || row === null || !("busy" in row)) {
    return false;
  }
  return row.busy === 0;
}

function writeBackupFile(stagingDirectory: string, main: Buffer): void {
  const finalName = path.join(stagingDirectory, "oi.sqlite.bak");
  const temporary = path.join(stagingDirectory, "oi.sqlite.bak.tmp");
  writeFileSync(temporary, main);
  renameSync(temporary, finalName);
}

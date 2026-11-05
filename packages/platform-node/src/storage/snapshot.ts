import {
  existsSync,
  readFileSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

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
  main: Buffer,
): void {
  const finalName = path.join(stagingDirectory, "oi.sqlite.bak");
  const temporary = path.join(stagingDirectory, "oi.sqlite.bak.tmp");
  writeFileSync(temporary, main);
  renameSync(temporary, finalName);
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

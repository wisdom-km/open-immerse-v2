import { mkdirSync } from "node:fs";
import path from "node:path";

import type { Result } from "@oi/kernel";

import { storageFailure, type StorageFailure } from "./errors.js";

export type DataRootLayout = {
  readonly root: string;
  readonly databaseDirectory: string;
  readonly databaseFile: string;
  readonly assetsDirectory: string;
  readonly stagingDirectory: string;
  readonly logsDirectory: string;
  readonly libraryDirectory: string;
  readonly secretsFile: string;
};

const SAFE_NAME = /^[A-Za-z0-9_-]{1,80}$/;
const SHA256_HEX = /^[0-9a-f]{64}$/;

export function dataRootLayout(dataRoot: string): DataRootLayout {
  return {
    root: dataRoot,
    databaseDirectory: path.join(dataRoot, "db"),
    databaseFile: path.join(dataRoot, "db", "oi.sqlite"),
    assetsDirectory: path.join(dataRoot, "assets"),
    stagingDirectory: path.join(dataRoot, "staging"),
    logsDirectory: path.join(dataRoot, "logs"),
    libraryDirectory: path.join(dataRoot, "library"),
    secretsFile: path.join(dataRoot, "secrets.bin"),
  };
}

export function ensureDataRootDirectories(layout: DataRootLayout): void {
  mkdirSync(layout.databaseDirectory, { recursive: true });
  mkdirSync(layout.assetsDirectory, { recursive: true });
  mkdirSync(layout.stagingDirectory, { recursive: true });
  mkdirSync(layout.logsDirectory, { recursive: true });
  mkdirSync(layout.libraryDirectory, { recursive: true });
}

export function assetFilePath(
  layout: DataRootLayout,
  sha256: string,
  assetId: string,
): Result<string, StorageFailure> {
  if (!SHA256_HEX.test(sha256) || !SAFE_NAME.test(assetId)) {
    return rejectedPath();
  }
  return {
    ok: true,
    value: path.join(layout.assetsDirectory, sha256.slice(0, 2), assetId),
  };
}

export function libraryEntryDirectory(
  layout: DataRootLayout,
  sha256: string,
): Result<string, StorageFailure> {
  if (!SHA256_HEX.test(sha256)) {
    return rejectedPath();
  }
  return {
    ok: true,
    value: path.join(layout.libraryDirectory, sha256),
  };
}

export function librarySourcePath(
  layout: DataRootLayout,
  sha256: string,
): Result<string, StorageFailure> {
  const directory = libraryEntryDirectory(layout, sha256);
  if (!directory.ok) {
    return directory;
  }
  return { ok: true, value: path.join(directory.value, "source.pdf") };
}

export function stagingFilePath(
  layout: DataRootLayout,
  name: string,
): Result<string, StorageFailure> {
  if (!SAFE_NAME.test(name)) {
    return rejectedPath();
  }
  return { ok: true, value: path.join(layout.stagingDirectory, name) };
}

export function dataRootPointerPath(
  anchorDirectory: string,
  fileName: string,
): Result<string, StorageFailure> {
  if (!SAFE_NAME.test(fileName)) {
    return rejectedPath();
  }
  return { ok: true, value: path.join(anchorDirectory, fileName) };
}

function rejectedPath(): Result<string, StorageFailure> {
  return {
    ok: false,
    error: storageFailure("storage.invalid_path", "path was rejected"),
  };
}

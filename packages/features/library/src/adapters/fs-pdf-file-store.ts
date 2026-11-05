import { createHash } from "node:crypto";
import {
  chmodSync,
  mkdirSync,
  readFileSync,
  rmSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

import {
  libraryEntryDirectory,
  librarySourcePath,
  stagingFilePath,
  type DataRootLayout,
} from "@oi/platform-node";

import {
  parseLibraryEntryId,
  type LibraryEntryId,
} from "../domain/document-identity.js";
import {
  libraryFailure,
  type LibraryFailure,
} from "../domain/library-failure.js";
import { parseFileName } from "../domain/library-record.js";
import type {
  InspectedPdf,
  PdfFileStore,
} from "../application/ports/pdf-file-store.js";

type Outcome<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: LibraryFailure };

export type PdfBytesIo = {
  readonly readFile: (filePath: string) => Uint8Array;
  readonly writeFile: (filePath: string, data: Uint8Array) => void;
};

export type FsPdfFileStoreOptions = {
  readonly layout: DataRootLayout;
  readonly io?: PdfBytesIo;
  readonly hashBytes?: (bytes: Uint8Array) => string;
};

const defaultIo: PdfBytesIo = {
  readFile(filePath) {
    return readFileSync(filePath);
  },
  writeFile(filePath, data) {
    writeFileSync(filePath, data);
  },
};

export function createFsPdfFileStore(
  options: FsPdfFileStoreOptions,
): PdfFileStore {
  const io = options.io ?? defaultIo;
  const hashBytes = options.hashBytes ?? sha256;
  return {
    inspect(sourcePath) {
      return inspectFile(io, hashBytes, sourcePath);
    },
    placeCopy(sourcePath, id) {
      return placeCopy(
        { layout: options.layout, io, hashBytes },
        sourcePath,
        id,
      );
    },
    removeCopy(id) {
      return removeCopy(options.layout, id);
    },
  };
}

function inspectFile(
  io: PdfBytesIo,
  hashBytes: (bytes: Uint8Array) => string,
  sourcePath: string,
): Outcome<InspectedPdf> {
  const bytes = readBytes(io, sourcePath);
  if (!bytes.ok) {
    return bytes;
  }
  if (!isPdf(bytes.value)) {
    return { ok: false, error: libraryFailure("not_pdf") };
  }
  const id = parseLibraryEntryId(hashBytes(bytes.value));
  const fileName = parseFileName(path.basename(sourcePath));
  if (id === undefined || fileName === undefined) {
    return { ok: false, error: libraryFailure("rejected") };
  }
  return { ok: true, value: { id, fileName } };
}

type ByteContext = {
  readonly layout: DataRootLayout;
  readonly io: PdfBytesIo;
  readonly hashBytes: (bytes: Uint8Array) => string;
};

function placeCopy(
  context: ByteContext,
  sourcePath: string,
  id: LibraryEntryId,
): Outcome<void> {
  const read = readBytes(context.io, sourcePath);
  if (!read.ok) {
    return read;
  }
  if (!isPdf(read.value)) {
    return { ok: false, error: libraryFailure("not_pdf") };
  }
  const sourceHash = context.hashBytes(read.value);
  if (sourceHash !== id) {
    return { ok: false, error: libraryFailure("hash_mismatch") };
  }
  const staged = stageBytes(context, id, read.value);
  if (!staged.ok) {
    return staged;
  }
  return commitStaged(context, id, staged.value, sourceHash);
}

function commitStaged(
  context: ByteContext,
  id: LibraryEntryId,
  stagedPath: string,
  sourceHash: string,
): Outcome<void> {
  const stagedRead = readBytes(context.io, stagedPath);
  if (!stagedRead.ok) {
    deleteFile(stagedPath);
    return stagedRead;
  }
  if (context.hashBytes(stagedRead.value) !== sourceHash) {
    deleteFile(stagedPath);
    return { ok: false, error: libraryFailure("hash_mismatch") };
  }
  return moveToLibrary(context.layout, id, stagedPath);
}

function stageBytes(
  context: ByteContext,
  id: LibraryEntryId,
  bytes: Uint8Array,
): Outcome<string> {
  const staged = stagingFilePath(context.layout, id);
  if (!staged.ok) {
    return { ok: false, error: libraryFailure("rejected") };
  }
  try {
    context.io.writeFile(staged.value, bytes);
    return { ok: true, value: staged.value };
  } catch {
    deleteFile(staged.value);
    return { ok: false, error: libraryFailure("rejected") };
  }
}

function moveToLibrary(
  layout: DataRootLayout,
  id: LibraryEntryId,
  stagedPath: string,
): Outcome<void> {
  const directory = libraryEntryDirectory(layout, id);
  const destination = librarySourcePath(layout, id);
  if (!directory.ok || !destination.ok) {
    deleteFile(stagedPath);
    return { ok: false, error: libraryFailure("rejected") };
  }
  try {
    mkdirSync(directory.value, { recursive: true });
    writeFileSync(destination.value, readFileSync(stagedPath));
    deleteFile(stagedPath);
    chmodSync(destination.value, 0o444);
    return { ok: true, value: undefined };
  } catch {
    deleteFile(stagedPath);
    rmSync(directory.value, { recursive: true, force: true });
    return { ok: false, error: libraryFailure("rejected") };
  }
}

function removeCopy(layout: DataRootLayout, id: LibraryEntryId): Outcome<void> {
  const directory = libraryEntryDirectory(layout, id);
  if (!directory.ok) {
    return { ok: false, error: libraryFailure("rejected") };
  }
  rmSync(directory.value, { recursive: true, force: true });
  return { ok: true, value: undefined };
}

function readBytes(io: PdfBytesIo, filePath: string): Outcome<Uint8Array> {
  try {
    return { ok: true, value: io.readFile(filePath) };
  } catch {
    return { ok: false, error: libraryFailure("rejected") };
  }
}

function deleteFile(filePath: string): void {
  try {
    unlinkSync(filePath);
  } catch {
    return;
  }
}

function isPdf(bytes: Uint8Array): boolean {
  return (
    bytes.length >= 5 &&
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46 &&
    bytes[4] === 0x2d
  );
}

function sha256(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

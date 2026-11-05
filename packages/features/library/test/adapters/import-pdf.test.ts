import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

import { expect, it } from "vitest";

import { dataRootLayout } from "@oi/platform-node";

import { createFsPdfFileStore } from "../../src/adapters/fs-pdf-file-store.js";
import { createSqliteLibraryRepository } from "../../src/adapters/sqlite-library-repository.js";
import {
  createImportPdf,
  createRelocateSource,
  libraryFailure,
  type ImportPdf,
  type LibraryRepository,
} from "../../src/index.js";
import { pathLeaks } from "../support/path-leaks.js";
import {
  withLibrary,
  type LibraryFixture,
} from "../support/library-fixture.js";

const ADDED = Date.parse("2026-11-05T04:00:00.000Z");

function pdf(label: string): Uint8Array {
  return new TextEncoder().encode(`%PDF-1.4\n% ${label}\n`);
}

function importer(
  fixture: LibraryFixture,
  ingest: { count: number },
  repository: LibraryRepository = createSqliteLibraryRepository(
    fixture.storage,
  ),
): ImportPdf {
  return createImportPdf({
    repository,
    files: createFsPdfFileStore({ layout: dataRootLayout(fixture.root) }),
    clock: { nowMs: () => ADDED },
    ingest: {
      openDocument() {
        ingest.count += 1;
      },
    },
  });
}

function libraryDirs(root: string): string[] {
  return readdirSync(path.join(root, "library"), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
}

it("AC-01 returns duplicate and keeps one copy when the same pdf is imported twice", () => {
  withLibrary((fixture) => {
    const source = path.join(fixture.root, "outside.pdf");
    writeFileSync(source, pdf("same"));
    const ingest = { count: 0 };
    const importPdf = importer(fixture, ingest);
    const first = importPdf(source);
    const second = importPdf(source);
    const id = first.ok ? first.value.entry.id : "";
    const copy = path.join(fixture.root, "library", id, "source.pdf");
    expect(first.ok && first.value.duplicate).toBe(false);
    expect(first.ok && first.value.entry.title).toBe("outside");
    expect(second.ok && second.value.duplicate).toBe(true);
    expect(second.ok && second.value.entry.id).toBe(id);
    expect(libraryDirs(fixture.root)).toEqual([id]);
    expect(rows(fixture)).toBe(1);
    expect(ingest.count).toBe(0);
    expect(readFileSync(copy).equals(readFileSync(source))).toBe(true);
    expect(statSync(copy).mode & 0o777).toBe(0o444);
    expect(pathLeaks(second, [fixture.root])).toEqual([]);
  });
});

it("returns not_pdf and leaves the library empty when the file is not a pdf", () => {
  withLibrary((fixture) => {
    const source = path.join(fixture.root, "notes.txt");
    writeFileSync(source, "hello");
    const result = importer(fixture, { count: 0 })(source);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("not_pdf");
    }
    expect(libraryDirs(fixture.root)).toEqual([]);
    expect(rows(fixture)).toBe(0);
    expect(pathLeaks(result, [fixture.root])).toEqual([]);
  });
});

it("leaves no library directory when the staged hash does not match", () => {
  withLibrary((fixture) => {
    const id = "ab".repeat(32);
    const other = "cd".repeat(32);
    const source = path.join(fixture.root, "paper.pdf");
    writeFileSync(source, pdf("mismatch"));
    const hashBytes = scripted([id, id, other]);
    const result = createImportPdf({
      repository: createSqliteLibraryRepository(fixture.storage),
      files: createFsPdfFileStore({
        layout: dataRootLayout(fixture.root),
        hashBytes,
      }),
      clock: { nowMs: () => ADDED },
      ingest: {
        openDocument() {
          return;
        },
      },
    })(source);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("hash_mismatch");
    }
    expect(libraryDirs(fixture.root)).toEqual([]);
    expect(existsSync(path.join(fixture.root, "staging", id))).toBe(false);
    expect(rows(fixture)).toBe(0);
    expect(pathLeaks(result, [fixture.root])).toEqual([]);
  });
});

it("removes the library directory when the insert fails after the copy", () => {
  withLibrary((fixture) => {
    const source = path.join(fixture.root, "paper.pdf");
    writeFileSync(source, pdf("rollback"));
    const real = createSqliteLibraryRepository(fixture.storage);
    const result = importer(fixture, { count: 0 }, failingInsert(real))(source);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toBe("文献库请求失败");
    }
    expect(libraryDirs(fixture.root)).toEqual([]);
    expect(rows(fixture)).toBe(0);
    expect(pathLeaks(result, [fixture.root])).toEqual([]);
  });
});

it("returns rejected and leaves no library directory when staging cannot be written", () => {
  withLibrary((fixture) => {
    const source = path.join(fixture.root, "paper.pdf");
    writeFileSync(source, pdf("nostage"));
    const result = createImportPdf({
      repository: createSqliteLibraryRepository(fixture.storage),
      files: createFsPdfFileStore({
        layout: dataRootLayout(fixture.root),
        io: {
          readFile: (filePath) => readFileSync(filePath),
          writeFile() {
            throw new Error(fixture.root);
          },
        },
      }),
      clock: { nowMs: () => ADDED },
      ingest: {
        openDocument() {
          return;
        },
      },
    })(source);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).not.toContain(fixture.root);
    }
    expect(libraryDirs(fixture.root)).toEqual([]);
    expect(rows(fixture)).toBe(0);
  });
});

it("updates originalPath and does not rewrite the library copy when relocate matches the sha", () => {
  withLibrary((fixture) => {
    const source = path.join(fixture.root, "paper.pdf");
    const renamed = path.join(fixture.root, "renamed.pdf");
    writeFileSync(source, pdf("relocate"));
    const imported = importer(fixture, { count: 0 })(source);
    const id = imported.ok ? imported.value.entry.id : "";
    const copy = path.join(fixture.root, "library", id, "source.pdf");
    const before = readFileSync(copy);
    mkdirSync(path.dirname(renamed), { recursive: true });
    writeFileSync(renamed, pdf("relocate"));
    const relocated = createRelocateSource({
      repository: createSqliteLibraryRepository(fixture.storage),
      files: createFsPdfFileStore({ layout: dataRootLayout(fixture.root) }),
    })({ id, filePath: renamed });
    const row = fixture.storage.query(
      "SELECT original_path, file_name FROM lib_entries WHERE id = ?",
      [id],
    );
    expect(relocated.ok && relocated.value.entry.fileName).toBe("renamed.pdf");
    expect(row?.original_path).toBe(renamed);
    expect(row?.file_name).toBe("renamed.pdf");
    expect(readFileSync(copy).equals(before)).toBe(true);
    expect(pathLeaks(relocated, [fixture.root])).toEqual([]);
  });
});

it("records the library migration and only the lib_ table when storage opens", () => {
  withLibrary((fixture) => {
    const migration = fixture.storage.query(
      "SELECT migration_id FROM schema_migrations WHERE slice = ? AND version = ?",
      ["library", 1],
    );
    const tables = fixture.storage
      .queryAll(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name LIKE 'lib_%'",
      )
      .map((row) => row.name);
    expect(migration?.migration_id).toBe("0001_lib_entries.sql");
    expect(tables).toEqual(["lib_entries"]);
  });
});

function rows(fixture: LibraryFixture): number {
  return fixture.storage.queryAll("SELECT id FROM lib_entries").length;
}

function scripted(values: readonly string[]): (bytes: Uint8Array) => string {
  const cursor = { index: 0 };
  return (bytes) => {
    cursor.index += bytes.byteLength >= 0 ? 1 : 0;
    return values[cursor.index - 1] ?? "";
  };
}

function failingInsert(real: LibraryRepository): LibraryRepository {
  return {
    findById(id) {
      return real.findById(id);
    },
    list() {
      return real.list();
    },
    insert(): { ok: false; error: ReturnType<typeof libraryFailure> } {
      return { ok: false, error: libraryFailure("rejected") };
    },
    updateSource(id, source) {
      return real.updateSource(id, source);
    },
    updateProgress(id, progress) {
      return real.updateProgress(id, progress);
    },
  };
}

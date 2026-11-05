import { existsSync } from "node:fs";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { expect, it } from "vitest";

import {
  assetFilePath,
  dataRootLayout,
  dataRootPointerPath,
  ensureDataRootDirectories,
  libraryEntryDirectory,
  librarySourcePath,
  stagingFilePath,
} from "../src/storage/data-root.js";

it("places database assets staging logs and secrets under the injected root when a layout is requested", () => {
  const layout = dataRootLayout(path.join("data-root", "reader"));
  expect(layout.databaseFile).toBe(
    path.join("data-root", "reader", "db", "oi.sqlite"),
  );
  expect(layout.assetsDirectory).toBe(
    path.join("data-root", "reader", "assets"),
  );
  expect(layout.stagingDirectory).toBe(
    path.join("data-root", "reader", "staging"),
  );
  expect(layout.logsDirectory).toBe(path.join("data-root", "reader", "logs"));
  expect(layout.libraryDirectory).toBe(
    path.join("data-root", "reader", "library"),
  );
  expect(layout.secretsFile).toBe(
    path.join("data-root", "reader", "secrets.bin"),
  );
  expect(
    layout.secretsFile.startsWith(`${layout.databaseDirectory}${path.sep}`),
  ).toBe(false);
});

it("creates the layout directories including library and leaves secrets.bin absent when directories are ensured", () => {
  const root = mkdtempSync(path.join(tmpdir(), "oitest-layout-"));
  try {
    const layout = dataRootLayout(root);
    ensureDataRootDirectories(layout);
    expect(existsSync(layout.databaseDirectory)).toBe(true);
    expect(existsSync(layout.assetsDirectory)).toBe(true);
    expect(existsSync(layout.stagingDirectory)).toBe(true);
    expect(existsSync(layout.logsDirectory)).toBe(true);
    expect(existsSync(layout.libraryDirectory)).toBe(true);
    expect(existsSync(layout.secretsFile)).toBe(false);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

it("rejects library sha values that leave the data root when the sha is unsafe", () => {
  const layout = dataRootLayout("data-root");
  const sha = "ab".padEnd(64, "0");
  const source = librarySourcePath(layout, sha);
  expect(libraryEntryDirectory(layout, sha).ok).toBe(true);
  expect(source).toEqual({
    ok: true,
    value: path.join("data-root", "library", sha, "source.pdf"),
  });
  expect(libraryEntryDirectory(layout, "..").ok).toBe(false);
  expect(libraryEntryDirectory(layout, "a/b").ok).toBe(false);
  expect(libraryEntryDirectory(layout, "a\\b").ok).toBe(false);
  expect(librarySourcePath(layout, "AB".padEnd(64, "0")).ok).toBe(false);
  expect(librarySourcePath(layout, "ab").ok).toBe(false);
  expect(librarySourcePath(layout, `${sha}0`).ok).toBe(false);
});

it("rejects asset and staging names that leave the data root when the name is unsafe", () => {
  const layout = dataRootLayout("data-root");
  const sha = "ab".padEnd(64, "0");
  expect(assetFilePath(layout, sha, "../outside").ok).toBe(false);
  expect(assetFilePath(layout, "AB".padEnd(64, "0"), "crop").ok).toBe(false);
  expect(stagingFilePath(layout, "a/b").ok).toBe(false);
  expect(dataRootPointerPath(layout.root, "..").ok).toBe(false);
  const asset = assetFilePath(layout, sha, "crop-1");
  expect(asset.ok && asset.value).toBe(
    path.join("data-root", "assets", "ab", "crop-1"),
  );
});

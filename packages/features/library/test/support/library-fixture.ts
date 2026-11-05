import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  openAppStorage,
  readSliceMigrations,
  type AppStorage,
} from "@oi/platform-node";

export type LibraryFixture = {
  readonly root: string;
  readonly storage: AppStorage;
};

export function withLibrary(run: (fixture: LibraryFixture) => void): void {
  const root = mkdtempSync(path.join(tmpdir(), "oitest-library-"));
  const opened = openLibrary(root);
  try {
    run({ root, storage: opened });
  } finally {
    opened.close();
    rmSync(root, { recursive: true, force: true });
  }
}

function openLibrary(root: string): AppStorage {
  const migrations = readSliceMigrations(
    "library",
    fileURLToPath(new URL("../../migrations", import.meta.url)),
  );
  if (!migrations.ok) {
    throw new Error(migrations.error.code);
  }
  const opened = openAppStorage({
    dataRoot: root,
    clock: { nowMs: () => 1_700_000_000_000 },
    migrations: migrations.value,
  });
  if (!opened.ok) {
    throw new Error(opened.error.code);
  }
  return opened.value;
}

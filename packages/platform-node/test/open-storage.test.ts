import {
  existsSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { DatabaseSync } from "node:sqlite";
import { expect, it } from "vitest";

import {
  openAppStorage,
  readSliceMigrations,
  type AppStorage,
} from "@oi/platform-node";

import { dataRootLayout } from "../src/storage/data-root.js";

const BUSINESS_PREFIXES = [
  "lib_",
  "doc_",
  "job_",
  "fsrc_",
  "tr_",
  "md_",
  "note_",
  "qa_",
  "voice_",
  "set_",
  "bud_",
  "diag_",
  "ing_",
  "wr_",
];

function clock(nowMs: number): { nowMs: () => number } {
  return { nowMs: () => nowMs };
}

function withRoot(run: (root: string) => void): void {
  const root = mkdtempSync(path.join(tmpdir(), "oitest-storage-"));
  try {
    run(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

function mustOpen(
  storage: { ok: true; value: AppStorage } | { ok: false },
): AppStorage {
  expect(storage.ok).toBe(true);
  if (!storage.ok) {
    throw new Error("expected the database to open");
  }
  return storage.value;
}

it("AC-66 keeps the original database bytes when a migration fails", () => {
  withRoot((root) => {
    const opened = mustOpen(
      openAppStorage({ dataRoot: root, clock: clock(0) }),
    );
    opened.execute("CREATE TABLE kept (note TEXT)");
    opened.execute("INSERT INTO kept (note) VALUES (?)", ["sentinel"]);
    opened.close();
    const databaseFile = dataRootLayout(root).databaseFile;
    const before = readFileSync(databaseFile);
    const failed = openAppStorage({
      dataRoot: root,
      clock: clock(1),
      migrations: [
        {
          slice: "probe",
          version: 1,
          id: "0001_bad.sql",
          sql: "SELECT missing_column FROM kept",
        },
      ],
    });
    expect(failed.ok).toBe(false);
    if (!failed.ok) {
      expect(failed.error.message.includes(root)).toBe(false);
    }
    expect(readFileSync(databaseFile).equals(before)).toBe(true);
    const again = mustOpen(openAppStorage({ dataRoot: root, clock: clock(2) }));
    expect(again.query("SELECT note FROM kept")?.note).toBe("sentinel");
    again.close();
  });
});

it("AC-66 opens a higher app schema as read-only and writes nothing", () => {
  withRoot((root) => {
    const databaseFile = dataRootLayout(root).databaseFile;
    mkdirSync(path.dirname(databaseFile), { recursive: true });
    const seeded = new DatabaseSync(databaseFile);
    seeded.exec(
      "CREATE TABLE app_meta (id INTEGER PRIMARY KEY, app_schema INTEGER NOT NULL)",
    );
    seeded.exec("INSERT INTO app_meta (id, app_schema) VALUES (1, 9)");
    seeded.exec("CREATE TABLE kept (note TEXT)");
    seeded.exec("INSERT INTO kept (note) VALUES ('sentinel')");
    seeded.close();
    const before = readFileSync(databaseFile);
    const opened = mustOpen(
      openAppStorage({
        dataRoot: root,
        clock: clock(0),
        supportedAppSchema: 1,
      }),
    );
    expect(opened.mode).toBe("read-only");
    expect(opened.appSchema).toBe(9);
    expect(opened.writes).toBe(0);
    expect(() => {
      opened.execute("INSERT INTO kept (note) VALUES ('x')");
    }).toThrow(/read-only/);
    expect(opened.writes).toBe(0);
    expect(opened.query("SELECT note FROM kept")?.note).toBe("sentinel");
    opened.close();
    expect(readFileSync(databaseFile).equals(before)).toBe(true);
  });
});

it("records slice migrations in slice then version order and leaves the sql files unchanged", () => {
  withRoot((root) => {
    const alpha = path.join(root, "alpha");
    const beta = path.join(root, "beta");
    mkdirSync(alpha);
    mkdirSync(beta);
    const alphaSql = "CREATE TABLE alpha_mark (id INTEGER);";
    const betaSql = "CREATE TABLE beta_mark (id INTEGER);";
    writeFileSync(path.join(alpha, "0002_second.sql"), alphaSql);
    writeFileSync(
      path.join(alpha, "0001_first.sql"),
      "CREATE TABLE alpha_first (id INTEGER);",
    );
    writeFileSync(path.join(beta, "0001_only.sql"), betaSql);
    const alphaSecond = readFileSync(path.join(alpha, "0002_second.sql"));
    const alphaFirst = readFileSync(path.join(alpha, "0001_first.sql"));
    const betaOnly = readFileSync(path.join(beta, "0001_only.sql"));
    const alphaMigrations = readSliceMigrations("alpha", alpha);
    const betaMigrations = readSliceMigrations("beta", beta);
    expect(alphaMigrations.ok && betaMigrations.ok).toBe(true);
    if (!alphaMigrations.ok || !betaMigrations.ok) {
      return;
    }
    const opened = mustOpen(
      openAppStorage({
        dataRoot: root,
        clock: clock(0),
        migrations: [...alphaMigrations.value, ...betaMigrations.value],
      }),
    );
    const rows = opened.queryAll(
      "SELECT slice, version FROM schema_migrations ORDER BY slice, version",
    );
    expect(rows).toEqual([
      { slice: "alpha", version: 1 },
      { slice: "alpha", version: 2 },
      { slice: "beta", version: 1 },
    ]);
    opened.close();
    expect(
      readFileSync(path.join(alpha, "0002_second.sql")).equals(alphaSecond),
    ).toBe(true);
    expect(
      readFileSync(path.join(alpha, "0001_first.sql")).equals(alphaFirst),
    ).toBe(true);
    expect(
      readFileSync(path.join(beta, "0001_only.sql")).equals(betaOnly),
    ).toBe(true);
  });
});

it("keeps only the newest backup when a later migration succeeds", () => {
  withRoot((root) => {
    const first = mustOpen(openAppStorage({ dataRoot: root, clock: clock(0) }));
    first.close();
    const databaseFile = dataRootLayout(root).databaseFile;
    const second = mustOpen(
      openAppStorage({
        dataRoot: root,
        clock: clock(1),
        migrations: [
          {
            slice: "probe",
            version: 1,
            id: "0001_mark.sql",
            sql: "CREATE TABLE mark_one (id INTEGER);",
          },
        ],
      }),
    );
    second.close();
    const beforeThird = readFileSync(databaseFile);
    const third = mustOpen(
      openAppStorage({
        dataRoot: root,
        clock: clock(2),
        migrations: [
          {
            slice: "probe",
            version: 1,
            id: "0001_mark.sql",
            sql: "CREATE TABLE mark_one (id INTEGER);",
          },
          {
            slice: "probe",
            version: 2,
            id: "0002_mark.sql",
            sql: "CREATE TABLE mark_two (id INTEGER);",
          },
        ],
      }),
    );
    third.close();
    const staging = dataRootLayout(root).stagingDirectory;
    expect(
      readdirSync(staging).filter((name) => name.includes("oi.sqlite")),
    ).toEqual(["oi.sqlite.bak"]);
    expect(
      readFileSync(path.join(staging, "oi.sqlite.bak")).equals(beforeThird),
    ).toBe(true);
  });
});

it("refuses to lower app_schema and creates no business tables when storage opens", () => {
  withRoot((root) => {
    const opened = mustOpen(
      openAppStorage({ dataRoot: root, clock: clock(0) }),
    );
    expect(opened.appSchema).toBe(1);
    expect(opened.writes).toBe(0);
    expect(() => {
      opened.execute("UPDATE app_meta SET app_schema = 0 WHERE id = 1");
    }).toThrow(/database request failed/);
    expect(
      opened.query("SELECT app_schema FROM app_meta WHERE id = 1")?.app_schema,
    ).toBe(1);
    const names = opened
      .queryAll("SELECT name FROM sqlite_master WHERE type = 'table'")
      .map((row) => row.name);
    for (const prefix of BUSINESS_PREFIXES) {
      expect(
        names.some(
          (name) => typeof name === "string" && name.startsWith(prefix),
        ),
      ).toBe(false);
    }
    expect(existsSync(dataRootLayout(root).secretsFile)).toBe(false);
    const journal = opened.query("PRAGMA journal_mode");
    expect(journal?.journal_mode).toBe("wal");
    opened.close();
  });
});

it("deletes a new database when the first migration fails", () => {
  withRoot((root) => {
    const failed = openAppStorage({
      dataRoot: root,
      clock: clock(0),
      migrations: [
        {
          slice: "probe",
          version: 1,
          id: "0001_bad.sql",
          sql: "THIS IS NOT SQL",
        },
      ],
    });
    expect(failed.ok).toBe(false);
    expect(existsSync(dataRootLayout(root).databaseFile)).toBe(false);
  });
});

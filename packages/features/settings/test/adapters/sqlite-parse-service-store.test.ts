import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import {
  openAppStorage,
  readSliceMigrations,
  type AppStorage,
} from "@oi/platform-node";
import { expect, it } from "vitest";

import { createSqliteParseServiceStore } from "../../src/adapters/sqlite-parse-service-store.js";
import {
  createSettingsParseCapabilities,
  settingsMigrationsDirectory,
} from "../../src/adapters/settings-main.js";
import { createUnavailableSecretLookup } from "../../src/adapters/unavailable-secret-lookup.js";
import { createGetParseServiceStatus } from "../../src/index.js";
import type { ParseSecretLookup } from "../../src/application/ports/parse-secret-lookup.js";

const INSERT =
  "INSERT INTO set_providers (vendor_id, format, base_url, model_id, allowed_hosts, purpose, credential_slot) VALUES (?, ?, ?, ?, ?, ?, ?)";

const CLOCK = { nowMs: () => 1_700_000_000_000 };

async function withSettings(
  run: (storage: AppStorage) => Promise<void> | void,
  migrate = true,
): Promise<void> {
  const root = mkdtempSync(path.join(tmpdir(), "oitest-settings-"));
  const storage = openSettings(root, migrate);
  try {
    await run(storage);
  } finally {
    storage.close();
    rmSync(root, { recursive: true, force: true });
  }
}

function openSettings(root: string, migrate: boolean): AppStorage {
  const opened = openAppStorage({
    dataRoot: root,
    clock: CLOCK,
    ...(migrate ? { migrations: requiredMigrations() } : {}),
  });
  if (!opened.ok) {
    throw new Error(opened.error.code);
  }
  return opened.value;
}

function requiredMigrations() {
  const migrations = readSliceMigrations(
    "settings",
    settingsMigrationsDirectory(),
  );
  if (!migrations.ok) {
    throw new Error(migrations.error.code);
  }
  return migrations.value;
}

function insert(
  storage: AppStorage,
  credentialSlot: string,
  allowedHosts = '["example.test"]',
  purpose = "parse",
): void {
  storage.execute(INSERT, [
    "vendor",
    "openai",
    "https://example.test",
    "model",
    allowedHosts,
    purpose,
    credentialSlot,
  ]);
}

function expectCorrupt(setup: (storage: AppStorage) => void): Promise<void> {
  return withSettings((storage) => {
    setup(storage);
    expect(read(storage)).toEqual({
      ok: false,
      error: { code: "storage_corrupt" },
    });
  });
}

function read(
  storage: AppStorage,
  secrets: ParseSecretLookup = createUnavailableSecretLookup(),
) {
  return createGetParseServiceStatus({
    store: createSqliteParseServiceStore(storage),
    secrets,
  })({});
}

it("returns unconfigured when no parse row exists and leaves app_schema at 1", () =>
  withSettings((storage) => {
    insert(storage, "slot-1", '["example.test"]', "chat");
    expect(storage.appSchema).toBe(1);
    expect(read(storage)).toEqual({
      ok: true,
      value: { state: "unconfigured" },
    });
    expect(existsSync(storage.layout.secretsFile)).toBe(false);
  }));

it("returns storage_corrupt when credential_slot is an empty string", () =>
  withSettings((storage) => {
    insert(storage, "");
    const calls: string[] = [];
    const result = read(storage, {
      lookup(slot) {
        calls.push(slot);
        return "usable";
      },
    });
    expect(result).toEqual({
      ok: false,
      error: { code: "storage_corrupt" },
    });
    expect(calls).toEqual([]);
  }));

it("returns storage_corrupt for a row that was read but is not valid", async () => {
  await expectCorrupt((storage) => {
    insert(storage, "slot-1", "{");
  });
  await expectCorrupt((storage) => {
    storage.execute(INSERT, [
      "",
      "openai",
      "https://example.test",
      "model",
      '["example.test"]',
      "parse",
      "slot-1",
    ]);
  });
});

it("returns storage_corrupt when a stored column is not text", () =>
  expectCorrupt((storage) => {
    storage.execute(INSERT, [
      "vendor",
      "openai",
      "https://example.test",
      new Uint8Array([1]),
      '["example.test"]',
      "parse",
      "slot-1",
    ]);
  }));

it("keeps one parse row and rejects a second", () =>
  withSettings((storage) => {
    insert(storage, "slot-1");
    expect(() => {
      insert(storage, "slot-2");
    }).toThrow();
    expect(read(storage)).toEqual({
      ok: false,
      error: { code: "secret_unavailable" },
    });
  }));

it("throws when set_providers is absent", () =>
  withSettings((storage) => {
    expect(() => {
      createSqliteParseServiceStore(storage).readMetadata();
    }).toThrow();
  }, false));

it("never reports configured from the production adapter and does not read a secret file", () =>
  withSettings(async (storage) => {
    insert(storage, "slot-1");
    const body = await createSettingsParseCapabilities(storage)({});
    expect(body).toEqual({
      ok: false,
      error: { code: "secret_unavailable", retryable: false },
    });
    expect(JSON.stringify(body)).not.toContain("slot-1");
    expect(JSON.stringify(body)).not.toContain("secretRef");
    expect(existsSync(storage.layout.secretsFile)).toBe(false);
  }));

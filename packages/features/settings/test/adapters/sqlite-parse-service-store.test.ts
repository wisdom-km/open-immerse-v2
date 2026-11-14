import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

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

async function withSettings(
  run: (storage: AppStorage) => Promise<void> | void,
): Promise<void> {
  const root = mkdtempSync(path.join(tmpdir(), "oitest-settings-"));
  const storage = openSettings(root);
  try {
    await run(storage);
  } finally {
    storage.close();
    rmSync(root, { recursive: true, force: true });
  }
}

function openSettings(root: string): AppStorage {
  const migrations = readSliceMigrations(
    "settings",
    settingsMigrationsDirectory(),
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

it("returns storage_corrupt for bad JSON and for an empty text column", async () => {
  await withSettings((storage) => {
    insert(storage, "slot-1", "{");
    expect(read(storage)).toEqual({
      ok: false,
      error: { code: "storage_corrupt" },
    });
  });
  await withSettings((storage) => {
    storage.execute(INSERT, [
      "",
      "openai",
      "https://example.test",
      "model",
      '["example.test"]',
      "parse",
      "slot-1",
    ]);
    expect(read(storage)).toEqual({
      ok: false,
      error: { code: "storage_corrupt" },
    });
  });
});

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

it("never reports configured from the production adapter and does not read a secret file", () => {
  const source = readFileSync(
    fileURLToPath(
      new URL(
        "../../src/adapters/unavailable-secret-lookup.ts",
        import.meta.url,
      ),
    ),
    "utf8",
  );
  expect(source.includes("secrets.bin")).toBe(false);
  expect(source.includes("node:fs")).toBe(false);
  return withSettings(async (storage) => {
    insert(storage, "slot-1");
    const body = await createSettingsParseCapabilities(storage)({});
    expect(body).toEqual({
      ok: false,
      error: { code: "secret_unavailable", retryable: false },
    });
    expect(JSON.stringify(body)).not.toContain("slot-1");
    expect(JSON.stringify(body)).not.toContain("secretRef");
    expect(existsSync(storage.layout.secretsFile)).toBe(false);
  });
});

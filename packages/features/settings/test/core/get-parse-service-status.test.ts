import { expect, it } from "vitest";

import { createGetParseServiceStatus } from "../../src/index.js";
import type { ParseMetadata } from "../../src/pure.js";
import { createFakeParseServiceStore } from "../../src/testing/fake-parse-service-store.js";
import type { ParseSecretAnswer } from "../../src/pure.js";

const metadata: ParseMetadata = {
  vendorId: "vendor",
  format: "openai",
  baseUrl: "https://example.test",
  modelId: "model",
  allowedHosts: ["example.test"],
  credentialSlot: "slot-1",
};

function secrets(answer: ParseSecretAnswer, calls: string[]) {
  return {
    lookup(slot: string): ParseSecretAnswer {
      calls.push(slot);
      return answer;
    },
  };
}

it("does not consult the secret port when the store has no parse row", () => {
  const calls: string[] = [];
  const read = createGetParseServiceStatus({
    store: createFakeParseServiceStore({ ok: true, value: null }),
    secrets: secrets("usable", calls),
  })({});
  expect(read).toEqual({ ok: true, value: { state: "unconfigured" } });
  expect(calls).toEqual([]);
});

it("does not consult the secret port when the store reports storage_corrupt", () => {
  const calls: string[] = [];
  const read = createGetParseServiceStatus({
    store: createFakeParseServiceStore({
      ok: false,
      error: { code: "storage_corrupt" },
    }),
    secrets: secrets("usable", calls),
  })({});
  expect(read).toEqual({ ok: false, error: { code: "storage_corrupt" } });
  expect(calls).toEqual([]);
});

it("asks the secret port with the slot and keeps the slot out of the result", () => {
  const calls: string[] = [];
  const read = createGetParseServiceStatus({
    store: createFakeParseServiceStore({ ok: true, value: metadata }),
    secrets: secrets("unavailable", calls),
  })({});
  expect(read).toEqual({
    ok: false,
    error: { code: "secret_unavailable" },
  });
  expect(calls).toEqual(["slot-1"]);
  expect(JSON.stringify(read)).not.toContain("slot-1");
  expect(JSON.stringify(read)).not.toContain("secretRef");
});

it("returns configured when the test double says the slot is usable", () => {
  const calls: string[] = [];
  const read = createGetParseServiceStatus({
    store: createFakeParseServiceStore({ ok: true, value: metadata }),
    secrets: secrets("usable", calls),
  })({});
  expect(read).toEqual({ ok: true, value: { state: "configured" } });
  expect(Object.keys(read.ok ? read.value : {})).toEqual(["state"]);
});

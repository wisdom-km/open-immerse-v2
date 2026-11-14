import { expect, it } from "vitest";

import {
  classifyParseRecord,
  type ParseMetadata,
  type ParseSecretAnswer,
} from "../../src/pure.js";

function row(overrides: Partial<ParseMetadata> = {}): ParseMetadata {
  return {
    vendorId: "vendor",
    format: "openai",
    baseUrl: "https://example.test",
    modelId: "model",
    allowedHosts: ["example.test"],
    credentialSlot: "slot-1",
    ...overrides,
  };
}

function lookup(answer: ParseSecretAnswer, calls: string[]) {
  return (slot: string): ParseSecretAnswer => {
    calls.push(slot);
    return answer;
  };
}

it("returns unconfigured and does not ask when the parse row is absent", () => {
  const calls: string[] = [];
  const result = classifyParseRecord(null, lookup("usable", calls));
  expect(result).toEqual({ ok: true, value: { state: "unconfigured" } });
  expect(calls).toEqual([]);
});

it("returns storage_corrupt when credential_slot is an empty string", () => {
  const calls: string[] = [];
  const result = classifyParseRecord(
    row({ credentialSlot: "" }),
    lookup("usable", calls),
  );
  expect(result).toEqual({
    ok: false,
    error: { code: "storage_corrupt" },
  });
  expect(calls).toEqual([]);
});

it("returns storage_corrupt for any other empty text column", () => {
  const fields = ["vendorId", "format", "baseUrl", "modelId"] as const;
  for (const field of fields) {
    const calls: string[] = [];
    const result = classifyParseRecord(
      row({ [field]: "" }),
      lookup("usable", calls),
    );
    expect(result).toEqual({
      ok: false,
      error: { code: "storage_corrupt" },
    });
    expect(calls).toEqual([]);
  }
});

it("returns storage_corrupt when allowed hosts are not a non-empty string list", () => {
  const calls: string[] = [];
  const empty = classifyParseRecord(
    row({ allowedHosts: [] }),
    lookup("usable", calls),
  );
  const blank = classifyParseRecord(
    row({ allowedHosts: [""] }),
    lookup("usable", calls),
  );
  expect(empty).toEqual({ ok: false, error: { code: "storage_corrupt" } });
  expect(blank).toEqual({ ok: false, error: { code: "storage_corrupt" } });
  expect(calls).toEqual([]);
});

it("returns secret_unavailable when the referenced slot cannot be used", () => {
  const calls: string[] = [];
  const result = classifyParseRecord(row(), lookup("unavailable", calls));
  expect(result).toEqual({
    ok: false,
    error: { code: "secret_unavailable" },
  });
  expect(calls).toEqual(["slot-1"]);
});

it("returns configured only when the referenced slot is usable", () => {
  const calls: string[] = [];
  const result = classifyParseRecord(row(), lookup("usable", calls));
  expect(result).toEqual({ ok: true, value: { state: "configured" } });
  expect(calls).toEqual(["slot-1"]);
  expect(JSON.stringify(result)).not.toContain("slot-1");
});

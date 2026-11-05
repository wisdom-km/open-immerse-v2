import { expect, it } from "vitest";

import {
  readJsonDocument,
  writeJsonDocument,
} from "../src/storage/json-document.js";

it("AC-66 keeps unknown fields when a json document is written back", () => {
  const raw = JSON.stringify({
    schemaVersion: 1,
    title: "a",
    futureField: { n: 2, label: "keep" },
  });
  const read = readJsonDocument(raw, 1);
  expect(read.ok).toBe(true);
  if (!read.ok) {
    return;
  }
  expect(read.value.mode).toBe("read-write");
  const written = writeJsonDocument(read.value, { title: "b" });
  expect(written.writes).toBe(1);
  const again: unknown = JSON.parse(written.text);
  expect(again).toMatchObject({
    schemaVersion: 1,
    title: "b",
    futureField: { n: 2, label: "keep" },
  });
});

it("AC-66 writes nothing when a json document major version is higher", () => {
  const raw = '{ "schemaVersion": 4, "futureField": 1, "title": "a" }';
  const read = readJsonDocument(raw, 1);
  expect(read.ok).toBe(true);
  if (!read.ok) {
    return;
  }
  expect(read.value.mode).toBe("read-only");
  const written = writeJsonDocument(read.value, { title: "b", extra: true });
  expect(written.writes).toBe(0);
  expect(written.text).toBe(raw);
});

it("rejects a json document when schemaVersion is missing", () => {
  expect(readJsonDocument('{"title":"a"}', 1).ok).toBe(false);
  expect(readJsonDocument("[]", 1).ok).toBe(false);
  expect(readJsonDocument("{", 1).ok).toBe(false);
});

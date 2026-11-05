import { setZoom } from "@oi/contracts";
import { expect, it } from "vitest";

import { createReaderIpcHandlers } from "../../src/adapters/ipc-handlers.js";
import {
  createOpenReaderSession,
  createSetZoom,
  readerFailure,
} from "../../src/index.js";
import { parseReaderDocumentId } from "../../src/pure.js";
import { createFakePdfDocuments } from "../../src/testing/fake-pdf-documents.js";
import { createFakeReaderState } from "../../src/testing/fake-reader-state.js";
import { pathLeaks } from "../support/path-leaks.js";

const ID = "a".repeat(64);
const OTHER = "c".repeat(64);
const PDF = new TextEncoder().encode("%PDF-1.4");

function harness() {
  const state = createFakeReaderState();
  const open = createOpenReaderSession({
    documents: createFakePdfDocuments(),
    state,
  });
  const handlers = createReaderIpcHandlers({
    setZoom: createSetZoom(state),
  });
  return { open, handlers };
}

function documentId(value: string) {
  const id = parseReaderDocumentId(value);
  if (id === undefined) {
    throw new Error("id");
  }
  return id;
}

it("exposes only setZoom when the reader handlers are created", () => {
  const { handlers } = harness();
  expect(Object.keys(handlers)).toEqual(["setZoom"]);
  expect(setZoom.expose).toBe(false);
  expect(setZoom.idempotent).toBe(true);
  expect(setZoom.channel).toBe("reader.setZoom");
});

it("returns invalid_payload when the level is 24", async () => {
  const { open, handlers } = harness();
  await open({ id: ID, title: "paper", fileName: "paper.pdf", bytes: PDF });
  const result = await handlers.setZoom({
    id: documentId(ID),
    level: 24,
  });
  expect(result).toEqual({
    ok: false,
    error: { code: "invalid_payload", retryable: false },
  });
  expect(pathLeaks(result, [])).toEqual([]);
});

it("returns invalid_payload when the level is 401", async () => {
  const { open, handlers } = harness();
  await open({ id: ID, title: "paper", fileName: "paper.pdf", bytes: PDF });
  const result = await handlers.setZoom({
    id: documentId(ID),
    level: 401,
  });
  expect(result).toEqual({
    ok: false,
    error: { code: "invalid_payload", retryable: false },
  });
});

it("returns not_found when setZoom targets an id that was not opened", async () => {
  const { handlers } = harness();
  const result = await handlers.setZoom({
    id: documentId(OTHER),
    level: 100,
  });
  expect(result).toEqual({
    ok: false,
    error: { code: "not_found", retryable: false },
  });
  if (!result.ok) {
    expect(Object.keys(result.error)).toEqual(["code", "retryable"]);
  }
});

it("returns the same level when setZoom is repeated", async () => {
  const { open, handlers } = harness();
  await open({ id: ID, title: "paper", fileName: "paper.pdf", bytes: PDF });
  const first = await handlers.setZoom({
    id: documentId(ID),
    level: 125,
  });
  const second = await handlers.setZoom({
    id: documentId(ID),
    level: 125,
  });
  expect(second).toEqual(first);
  expect(second).toEqual({ ok: true, value: { level: 125 } });
});

it("maps not_pdf to handler_threw when the use case rejects the bytes", async () => {
  const handlers = createReaderIpcHandlers({
    setZoom: () => ({ ok: false, error: readerFailure("not_pdf") }),
  });
  const result = await handlers.setZoom({
    id: documentId(ID),
    level: 100,
  });
  expect(result).toEqual({
    ok: false,
    error: { code: "handler_threw", retryable: true },
  });
});

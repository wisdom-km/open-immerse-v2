import { expect, it } from "vitest";

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
const OTHER = "b".repeat(64);
const PDF = new TextEncoder().encode("%PDF-1.4");

function opened() {
  const documents = createFakePdfDocuments();
  const state = createFakeReaderState();
  const open = createOpenReaderSession({ documents, state });
  const setZoom = createSetZoom(state);
  return { documents, state, open, setZoom };
}

function documentId(value: string) {
  const id = parseReaderDocumentId(value);
  if (id === undefined) {
    throw new Error("id");
  }
  return id;
}

it("AC-11 returns a session when pdf bytes open without a parse service", async () => {
  const { open } = opened();
  const result = await open({
    id: ID,
    title: "paper",
    fileName: "paper.pdf",
    bytes: PDF,
  });
  expect(result.ok && result.value.pageCount).toBe(2);
  expect(result.ok && result.value.currentPage).toBe(1);
  expect(result.ok && result.value.zoomPercent).toBe(100);
  expect(result.ok && result.value.viewMode).toBe("original");
  expect(pathLeaks(result, [])).toEqual([]);
});

it("AC-01 returns a session when opening bytes for an existing id", async () => {
  const { open } = opened();
  const result = await open({
    id: ID,
    title: "paper",
    fileName: "paper.pdf",
    bytes: PDF,
  });
  expect(result.ok && result.value.id).toBe(ID);
  expect(result.ok && Object.keys(result.value)).not.toContain("path");
});

it("returns not_pdf when the bytes are not a pdf header", async () => {
  const { documents, open } = opened();
  const result = await open({
    id: ID,
    title: "paper",
    fileName: "paper.pdf",
    bytes: new TextEncoder().encode("hello"),
  });
  expect(result).toEqual({ ok: false, error: readerFailure("not_pdf") });
  expect(documents.openCount()).toBe(0);
});

it("returns not_found when the id is not 64 lowercase hex", async () => {
  const { documents, open } = opened();
  const result = await open({
    id: "nope",
    title: "paper",
    fileName: "paper.pdf",
    bytes: PDF,
  });
  expect(result).toEqual({ ok: false, error: readerFailure("not_found") });
  expect(documents.openCount()).toBe(0);
});

it("returns rejected when the file name contains a slash", async () => {
  const { open } = opened();
  const result = await open({
    id: ID,
    title: "paper",
    fileName: "dir/paper.pdf",
    bytes: PDF,
  });
  expect(result).toEqual({ ok: false, error: readerFailure("rejected") });
});

it("keeps the remembered percent when the same id is opened again", async () => {
  const { open, setZoom } = opened();
  await open({ id: ID, title: "paper", fileName: "paper.pdf", bytes: PDF });
  setZoom({ id: ID, level: 150 });
  const again = await open({
    id: ID,
    title: "paper",
    fileName: "paper.pdf",
    bytes: PDF,
  });
  expect(again.ok && again.value.zoomPercent).toBe(150);
  expect(again.ok && again.value.viewMode).toBe("original");
});

it("rejects the zoom when the level is 24", async () => {
  const { open, setZoom } = opened();
  await open({ id: ID, title: "paper", fileName: "paper.pdf", bytes: PDF });
  expect(setZoom({ id: ID, level: 24 })).toEqual({
    ok: false,
    error: readerFailure("invalid_level"),
  });
});

it("rejects the zoom when the level is 401", async () => {
  const { open, setZoom } = opened();
  await open({ id: ID, title: "paper", fileName: "paper.pdf", bytes: PDF });
  expect(setZoom({ id: ID, level: 401 })).toEqual({
    ok: false,
    error: readerFailure("invalid_level"),
  });
});

it("returns not_found when setZoom is called for an id that was not opened", () => {
  const { setZoom } = opened();
  expect(setZoom({ id: OTHER, level: 100 })).toEqual({
    ok: false,
    error: readerFailure("not_found"),
  });
});

it("keeps the same level when setZoom is repeated for that id", async () => {
  const { open, setZoom, state } = opened();
  await open({ id: ID, title: "paper", fileName: "paper.pdf", bytes: PDF });
  const first = setZoom({ id: ID, level: "fit-width" });
  const second = setZoom({ id: ID, level: "fit-width" });
  expect(second).toEqual(first);
  expect(second).toEqual({ ok: true, value: { level: "fit-width" } });
  const stored = state.find(documentId(ID));
  expect(stored?.zoom).toEqual({ kind: "fit-width" });
  expect(stored?.zoomPercent).toBe(100);
});

it("remembers a numeric zoom for one id when another id stays at 100", async () => {
  const { open, setZoom, state } = opened();
  await open({ id: ID, title: "paper", fileName: "paper.pdf", bytes: PDF });
  await open({
    id: OTHER,
    title: "other",
    fileName: "other.pdf",
    bytes: PDF,
  });
  expect(setZoom({ id: ID, level: 200 }).ok).toBe(true);
  expect(state.find(documentId(ID))?.zoomPercent).toBe(200);
  expect(state.find(documentId(OTHER))?.zoomPercent).toBe(100);
});

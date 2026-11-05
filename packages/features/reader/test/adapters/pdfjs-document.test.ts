import { expect, it } from "vitest";

import {
  createPdfjsDocuments,
  pdfjsInitParameters,
} from "../../src/adapters/pdfjs-document.js";
import { createMemoryReaderState } from "../../src/adapters/memory-reader-state.js";
import { createOpenReaderSession } from "../../src/index.js";
import { parseReaderDocumentId } from "../../src/pure.js";
import { minimalPdf } from "../support/minimal-pdf.js";
import { pathLeaks } from "../support/path-leaks.js";

const ID = "d".repeat(64);

function documentId() {
  const id = parseReaderDocumentId(ID);
  if (id === undefined) {
    throw new Error("id");
  }
  return id;
}

it("sets isEvalSupported to false when init parameters are built", () => {
  expect(pdfjsInitParameters(minimalPdf()).isEvalSupported).toBe(false);
});

it("returns page geometry when a minimal pdf is opened", async () => {
  const documents = createPdfjsDocuments();
  const opened = await documents.open(documentId(), minimalPdf(), {
    aborted: false,
  });
  expect(opened.ok).toBe(true);
  if (!opened.ok) {
    return;
  }
  expect(opened.value.pageCount).toBeGreaterThanOrEqual(1);
  expect(opened.value.firstPage.width).toBeGreaterThan(0);
  expect(opened.value.firstPage.height).toBeGreaterThan(0);
  const page = await documents.readPage(documentId(), 1, { aborted: false });
  expect(page.ok && page.value.width).toBe(opened.value.firstPage.width);
  expect(page.ok && page.value.height).toBe(opened.value.firstPage.height);
  expect(pathLeaks(opened, [])).toEqual([]);
  expect(pathLeaks(page, [])).toEqual([]);
});

it("returns not_pdf when the bytes are not a pdf", async () => {
  const documents = createPdfjsDocuments();
  const opened = await documents.open(
    documentId(),
    new TextEncoder().encode("hello"),
    { aborted: false },
  );
  expect(opened.ok).toBe(false);
  if (!opened.ok) {
    expect(opened.error.code).toBe("not_pdf");
    expect(opened.error.message).not.toMatch(/\/|\\/);
  }
});

it("AC-11 returns a session when pdf.js opens the bytes", async () => {
  const documents = createPdfjsDocuments();
  const open = createOpenReaderSession({
    documents,
    state: createMemoryReaderState(),
  });
  const result = await open({
    id: ID,
    title: "paper",
    fileName: "paper.pdf",
    bytes: minimalPdf(),
  });
  expect(result.ok && result.value.pageCount).toBeGreaterThanOrEqual(1);
  expect(result.ok && result.value.viewMode).toBe("original");
  expect(result.ok && result.value.zoomPercent).toBe(100);
  expect(pathLeaks(result, [])).toEqual([]);
});

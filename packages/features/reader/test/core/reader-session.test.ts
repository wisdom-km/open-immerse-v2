import type { LibraryEntryId, ReaderSession } from "@oi/contracts";
import { expect, it } from "vitest";

import {
  buildReaderSession,
  parseReaderDocumentId,
  READER_VIEW_MODE_ORIGINAL,
} from "../../src/pure.js";
import { pathLeaks } from "../support/path-leaks.js";

const ID = "a".repeat(64);

function id(): LibraryEntryId {
  const parsed = parseReaderDocumentId(ID);
  if (parsed === undefined) {
    throw new Error("id");
  }
  return parsed;
}

function session(): ReaderSession | undefined {
  return buildReaderSession({
    id: id(),
    title: "TCP/IP",
    fileName: "paper.pdf",
    pageCount: 3,
    currentPage: 9,
    zoomPercent: 100,
    viewMode: READER_VIEW_MODE_ORIGINAL,
  });
}

function sessionWithPaths(): ReaderSession | undefined {
  const input = {
    id: id(),
    title: "TCP/IP",
    fileName: "paper.pdf",
    pageCount: 3,
    currentPage: 1,
    zoomPercent: 100,
    viewMode: READER_VIEW_MODE_ORIGINAL,
    path: "/tmp/paper.pdf",
    originalPath: "/tmp/paper.pdf",
    filePath: "/tmp/paper.pdf",
  };
  return buildReaderSession(input);
}

it("clamps currentPage when the request is past pageCount", () => {
  const built = session();
  expect(built?.currentPage).toBe(3);
  expect(built?.pageCount).toBe(3);
});

it("omits path keys when the input also carries absolute paths", () => {
  const built = sessionWithPaths();
  expect(built && Object.keys(built).sort()).toEqual([
    "currentPage",
    "fileName",
    "id",
    "pageCount",
    "title",
    "viewMode",
    "zoomPercent",
  ]);
  expect(pathLeaks(built, ["/tmp"])).toEqual([]);
});

it("returns undefined when the file name is an absolute path", () => {
  expect(
    buildReaderSession({
      id: id(),
      title: "paper",
      fileName: "/tmp/paper.pdf",
      pageCount: 1,
      currentPage: 1,
      zoomPercent: 100,
      viewMode: "original",
    }),
  ).toBeUndefined();
});

it("returns undefined when the zoom percent is 24", () => {
  expect(
    buildReaderSession({
      id: id(),
      title: "paper",
      fileName: "paper.pdf",
      pageCount: 1,
      currentPage: 1,
      zoomPercent: 24,
      viewMode: "original",
    }),
  ).toBeUndefined();
});

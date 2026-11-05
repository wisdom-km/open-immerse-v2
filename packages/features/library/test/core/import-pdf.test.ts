import type { Clock } from "@oi/kernel";

import { expect, it } from "vitest";

import {
  createImportPdf,
  libraryFailure,
  type ImportPdfDeps,
} from "../../src/index.js";
import {
  createFakeLibraryRepository,
  type FakeLibraryRepository,
} from "../../src/testing/fake-library-repository.js";
import {
  createFakePdfFileStore,
  inspectedPdf,
} from "../../src/testing/fake-pdf-file-store.js";
import { pathLeaks } from "../support/path-leaks.js";

const ID_A = "a".repeat(64);
const ADDED = Date.parse("2026-11-05T04:00:00.000Z");

function clock(): Clock {
  return { nowMs: () => ADDED };
}

function harness(options?: {
  readonly failInsert?: boolean;
  readonly place?: ReturnType<typeof libraryFailure> | undefined;
  readonly inspected?: ReturnType<typeof inspectedPdf>;
}): {
  readonly deps: ImportPdfDeps;
  readonly repository: FakeLibraryRepository;
  readonly placed: () => number;
  readonly removed: () => number;
  readonly ingestCalls: () => number;
} {
  const ingest = { count: 0 };
  const repository = createFakeLibraryRepository(
    options?.failInsert === undefined
      ? undefined
      : { failInsert: options.failInsert },
  );
  const place =
    options?.place === undefined
      ? undefined
      : { ok: false as const, error: options.place };
  const files = createFakePdfFileStore({
    inspected: options?.inspected ?? inspectedPdf(ID_A, "Attention.PDF"),
    ...(place === undefined ? {} : { place }),
  });
  const deps: ImportPdfDeps = {
    repository,
    files,
    clock: clock(),
    ingest: {
      openDocument() {
        ingest.count += 1;
      },
    },
  };
  return {
    deps,
    repository,
    placed: () => files.counts().placed,
    removed: () => files.counts().removed,
    ingestCalls: () => ingest.count,
  };
}

it("AC-01 returns the existing entry and does not place another copy when the sha already exists", () => {
  const ctx = harness();
  const importPdf = createImportPdf(ctx.deps);
  const first = importPdf("/papers/Attention.PDF");
  const second = importPdf("/other/Attention.PDF");
  expect(first.ok && first.value.duplicate).toBe(false);
  expect(first.ok && first.value.entry.title).toBe("Attention");
  expect(first.ok && first.value.entry.fileName).toBe("Attention.PDF");
  expect(first.ok && first.value.entry.openedAt).toBeNull();
  expect(second.ok && second.value.duplicate).toBe(true);
  expect(second.ok && second.value.entry.id).toBe(
    first.ok ? first.value.entry.id : "",
  );
  expect(ctx.placed()).toBe(1);
  expect(ctx.repository.records()).toHaveLength(1);
  expect(ctx.ingestCalls()).toBe(0);
  expect(Object.keys(second.ok ? second.value.entry : {})).toEqual([
    "id",
    "fileName",
    "title",
    "addedAt",
    "openedAt",
  ]);
  expect(pathLeaks(second, ["/papers", "/other"])).toEqual([]);
});

it("returns not_pdf and does not place a copy when the file is not a pdf", () => {
  const ctx = harness({
    inspected: { ok: false, error: libraryFailure("not_pdf") },
  });
  const result = createImportPdf(ctx.deps)("/tmp/notes.txt");
  expect(result.ok).toBe(false);
  if (!result.ok) {
    expect(result.error).toEqual(libraryFailure("not_pdf"));
  }
  expect(ctx.placed()).toBe(0);
  expect(ctx.repository.records()).toHaveLength(0);
  expect(ctx.ingestCalls()).toBe(0);
  expect(pathLeaks(result, ["/tmp"])).toEqual([]);
});

it("removes the placed copy when the insert fails", () => {
  const ctx = harness({ failInsert: true });
  const result = createImportPdf(ctx.deps)("/papers/Attention.PDF");
  expect(result.ok).toBe(false);
  if (!result.ok) {
    expect(result.error.code).toBe("rejected");
    expect(result.error.message).toBe("文献库请求失败");
  }
  expect(ctx.placed()).toBe(1);
  expect(ctx.removed()).toBe(1);
  expect(ctx.repository.records()).toHaveLength(0);
  expect(pathLeaks(result, ["/papers"])).toEqual([]);
});

it("does not insert a row when the staged hash does not match", () => {
  const ctx = harness({ place: libraryFailure("hash_mismatch") });
  const result = createImportPdf(ctx.deps)("/papers/Attention.PDF");
  expect(result.ok).toBe(false);
  if (!result.ok) {
    expect(result.error.code).toBe("hash_mismatch");
  }
  expect(ctx.removed()).toBe(0);
  expect(ctx.repository.records()).toHaveLength(0);
  expect(ctx.ingestCalls()).toBe(0);
});

import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import type { DiagEvent } from "@oi/contracts";
import { expect, it } from "vitest";

import {
  createFileLogger,
  openAppStorage,
  StorageError,
  type StorageFailure,
} from "@oi/platform-node";

import { REDACTED } from "../src/logging/value-guard.js";
import { openAppStorageForTests } from "../src/storage/testing.js";

const LOCKED_MESSAGE = "被锁定或没有权限";
const WINDOWS_PATH = "C:\\Users\\x\\oi\\db\\oi.sqlite";
const POSIX_PATH = "/home/x/oi/db/oi.sqlite";

function clock(nowMs: number): { nowMs: () => number } {
  return { nowMs: () => nowMs };
}

function withRoot(run: (root: string) => void): void {
  const root = mkdtempSync(path.join(tmpdir(), "oitest-storage-"));
  try {
    run(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

function coded(code: string, message: string): Error {
  return Object.assign(new Error(message), { code });
}

function readFailure(root: string, cause: Error): StorageFailure {
  const seeded = openAppStorage({ dataRoot: root, clock: clock(0) });
  expect(seeded.ok).toBe(true);
  if (seeded.ok) {
    seeded.value.close();
  }
  let opened: ReturnType<typeof openAppStorageForTests> | undefined;
  expect(() => {
    opened = openAppStorageForTests(
      { dataRoot: root, clock: clock(1) },
      {
        readSnapshot: () => {
          throw cause;
        },
      },
    );
  }).not.toThrow();
  expect(opened?.ok).toBe(false);
  if (opened === undefined || opened.ok) {
    throw new Error("expected the database open to fail");
  }
  return opened.error;
}

function assertNoPath(text: string, root: string): void {
  expect(text.includes(WINDOWS_PATH)).toBe(false);
  expect(text.includes(POSIX_PATH)).toBe(false);
  expect(text.includes("C:\\Users\\x")).toBe(false);
  expect(text.includes("/home/x/oi")).toBe(false);
  expect(text.includes(root)).toBe(false);
}

function pipeline(errorClass: string): DiagEvent {
  return {
    ts: "2026-11-05T03:41:00.000Z",
    level: "error",
    feature: "storage",
    event: "pipeline.run",
    run_id: "run-locked",
    route: "storage",
    step: "open",
    status: "failed",
    error_class: errorClass,
    duration_ms: 1,
  };
}

function logLocked(failure: StorageFailure, causeMessage: string): string {
  const root = mkdtempSync(path.join(tmpdir(), "oitest-log-"));
  try {
    const nowMs = Date.parse("2026-11-05T03:41:00.000Z");
    const logger = createFileLogger({
      appDataDirectory: root,
      clock: { nowMs: () => nowMs },
    });
    logger.setDebugMode({ enabled: true });
    logger.log(pipeline(failure.code));
    logger.log(pipeline(failure.message));
    logger.log(pipeline(causeMessage));
    const withCause = {
      ...pipeline(failure.code),
      cause: failure.cause,
    } as unknown as DiagEvent;
    logger.log(withCause);
    const day = "2026-11-05.jsonl";
    const product = readFileSync(path.join(root, "diagnostics", day), "utf8");
    const debug = readFileSync(path.join(root, "debug", day), "utf8");
    return `${product}\n${debug}`;
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

it("returns open_failed when the snapshot read fails without a lock or permission code", () => {
  const causes = [
    coded("EISDIR", "EISDIR: illegal operation on a directory"),
    new Error("snapshot read failed"),
  ];
  for (const cause of causes) {
    withRoot((root) => {
      const failure = readFailure(root, cause);
      expect(failure.code).toBe("storage.open_failed");
      expect(failure.message).toBe("database could not be opened");
      expect(failure.cause).toBe(cause);
      expect(failure.message.includes(root)).toBe(false);
    });
  }
});

it("returns locked when the snapshot read fails with a lock or permission code", () => {
  for (const code of ["EACCES", "EPERM", "EBUSY"]) {
    withRoot((root) => {
      const cause = coded(code, `${code}: denied`);
      const failure = readFailure(root, cause);
      expect(failure.code).toBe("storage.locked");
      expect(failure.message).toBe(LOCKED_MESSAGE);
      expect(failure.cause).toBe(cause);
      expect(failure.message.includes(root)).toBe(false);
    });
  }
});

it("returns locked when a wal or shm read fails with a lock or permission code", () => {
  const cases = [
    { code: "EACCES", suffix: "-wal" },
    { code: "EPERM", suffix: "-shm" },
    { code: "EBUSY", suffix: "-shm" },
  ] as const;
  for (const item of cases) {
    withRoot((root) => {
      const cause = coded(
        item.code,
        `${item.code}: operation not permitted, open '${root}/db/oi.sqlite${item.suffix}'`,
      );
      const failure = readFailure(root, cause);
      expect(failure.code).toBe("storage.locked");
      expect(failure.message).toBe(LOCKED_MESSAGE);
      expect(failure.cause).toBe(cause);
      assertNoPath(failure.message, root);
      expect(failure.message.includes(item.suffix)).toBe(false);
    });
  }
});

it("keeps absolute paths out of the locked message, StorageError, and logs", () => {
  const cases = [
    {
      code: "EPERM",
      text: `EPERM: operation not permitted, open '${WINDOWS_PATH}'`,
    },
    {
      code: "EACCES",
      text: `EACCES: permission denied, open '${POSIX_PATH}'`,
    },
  ] as const;
  for (const item of cases) {
    withRoot((root) => {
      const cause = coded(item.code, item.text);
      const failure = readFailure(root, cause);
      expect(failure.message).toBe(LOCKED_MESSAGE);
      assertNoPath(failure.message, root);
      const err = new StorageError(failure);
      assertNoPath(err.message, root);
      assertNoPath(String(err), root);
      assertNoPath(JSON.stringify(err), root);
      const logged = logLocked(failure, cause.message);
      assertNoPath(logged, root);
      expect(logged.includes(cause.message)).toBe(false);
      expect(logged).toContain(failure.code);
      expect(logged).toContain(REDACTED);
    });
  }
});

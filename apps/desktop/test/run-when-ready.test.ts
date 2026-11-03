import process from "node:process";

import { expect, it } from "vitest";

import { runWhenReady } from "../src/main/run-when-ready.js";

async function drain(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

it("reports the thrown error when the ready callback throws", async () => {
  const errors: unknown[] = [];
  const unhandled: unknown[] = [];
  const failure = new Error("disk");
  process.on("unhandledRejection", recordUnhandled);
  try {
    runWhenReady(
      Promise.resolve(),
      () => {
        throw failure;
      },
      (error: unknown) => {
        errors.push(error);
      },
    );
    await drain();
    expect(errors).toEqual([failure]);
    expect(unhandled).toEqual([]);
  } finally {
    process.off("unhandledRejection", recordUnhandled);
  }

  function recordUnhandled(reason: unknown): void {
    unhandled.push(reason);
  }
});

it("leaves the error handler idle when startup finishes", async () => {
  const errors: unknown[] = [];
  let started = false;
  runWhenReady(
    Promise.resolve(),
    () => {
      started = true;
    },
    (error: unknown) => {
      errors.push(error);
    },
  );
  await drain();
  expect(started).toBe(true);
  expect(errors).toEqual([]);
});

it("reports the rejection when ready itself rejects", async () => {
  const errors: unknown[] = [];
  const unhandled: unknown[] = [];
  const failure = new Error("ready");
  let started = false;
  process.on("unhandledRejection", recordUnhandled);
  try {
    runWhenReady(
      Promise.reject(failure),
      () => {
        started = true;
      },
      (error: unknown) => {
        errors.push(error);
      },
    );
    await drain();
    expect(started).toBe(false);
    expect(errors).toEqual([failure]);
    expect(unhandled).toEqual([]);
  } finally {
    process.off("unhandledRejection", recordUnhandled);
  }

  function recordUnhandled(reason: unknown): void {
    unhandled.push(reason);
  }
});

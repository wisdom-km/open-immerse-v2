import { Worker } from "node:worker_threads";

import { expect, it } from "vitest";

const register = new URL("./register-ts.mjs", import.meta.url).href;

function parseInWorker(source: string): Promise<number> {
  const worker = new Worker(
    new URL("../support/parse-guard.worker.ts", import.meta.url),
    {
      workerData: { source },
      execArgv: ["--experimental-strip-types", "--import", register],
    },
  );
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      worker.terminate().then(() => {
        reject(new Error("parse exceeded 8000ms"));
      }, reject);
    }, 8000);
    worker.once("message", (message: { blocks?: number }) => {
      clearTimeout(timer);
      worker.terminate().then(() => {
        resolve(message.blocks ?? 0);
      }, reject);
    });
    worker.once("error", (error) => {
      clearTimeout(timer);
      worker.terminate().then(() => {
        reject(error);
      }, reject);
    });
  });
}

it("parses nested quotes, a long dollar run, and an unclosed tag in a worker", async () => {
  const nested = `${">".repeat(200)} a`;
  const dollars = "$".repeat(4000);
  const unclosed = "<div><span>未闭合";
  expect(await parseInWorker(nested)).toBeGreaterThan(0);
  expect(await parseInWorker(dollars)).toBeGreaterThan(0);
  expect(await parseInWorker(unclosed)).toBeGreaterThan(0);
});

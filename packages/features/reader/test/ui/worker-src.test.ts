import { expect, it } from "vitest";

import {
  assignWorkerSrc,
  PDF_WASM_URL,
  PDF_WORKER_SRC,
} from "../../src/ui/worker-src.js";

it("points the worker at the same-origin js copy", () => {
  const url = new URL(PDF_WORKER_SRC);
  expect(url.protocol).toBe("oi-app:");
  expect(url.host).toBe("app");
  expect(url.pathname).toBe("/pdf.worker.js");
  expect(PDF_WORKER_SRC.includes("blob:")).toBe(false);
  expect(PDF_WORKER_SRC.endsWith(".mjs")).toBe(false);
  const options = { workerSrc: "" };
  assignWorkerSrc({ GlobalWorkerOptions: options });
  expect(options.workerSrc).toBe(PDF_WORKER_SRC);
});

it("points image fallbacks at the same origin without wasm", () => {
  const url = new URL(PDF_WASM_URL);
  expect(url.protocol).toBe("oi-app:");
  expect(url.host).toBe("app");
  expect(url.pathname).toBe("/");
  expect(PDF_WASM_URL.endsWith("/")).toBe(true);
  expect(PDF_WASM_URL.includes("blob:")).toBe(false);
  expect(PDF_WASM_URL.includes(".wasm")).toBe(false);
  expect(PDF_WASM_URL.includes(".mjs")).toBe(false);
});

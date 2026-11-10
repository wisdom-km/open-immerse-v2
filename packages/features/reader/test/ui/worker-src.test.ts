import { expect, it } from "vitest";

import { assignWorkerSrc, PDF_WORKER_SRC } from "../../src/ui/worker-src.js";

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

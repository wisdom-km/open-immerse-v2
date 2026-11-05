import { parentPort, workerData } from "node:worker_threads";

import { renderMarkdown } from "../../src/index.js";

function readSource(data: unknown): string {
  if (typeof data !== "object" || data === null || !("source" in data)) {
    return "";
  }
  return typeof data.source === "string" ? data.source : "";
}

const source = readSource(workerData);
const doc = renderMarkdown(source, "note");
parentPort?.postMessage({ blocks: doc.blocks.length });

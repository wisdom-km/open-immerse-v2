import { copyFileSync, mkdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { argv } from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";

const desktop = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const reader = path.resolve(desktop, "../../packages/features/reader");

export const pdfWorkerFileName = "pdf.worker.js";
export const pdfWorkerDest = path.join(
  desktop,
  "src/renderer",
  pdfWorkerFileName,
);

export function pdfWorkerSource() {
  const require = createRequire(path.join(reader, "package.json"));
  return require.resolve("pdfjs-dist/legacy/build/pdf.worker.mjs");
}

export function pdfjsDistVersion() {
  const packageJson = path.join(
    path.dirname(pdfWorkerSource()),
    "../../package.json",
  );
  const parsed = JSON.parse(readFileSync(packageJson, "utf8"));
  if (typeof parsed.version !== "string") {
    throw new Error("pdfjs-dist version missing");
  }
  return parsed.version;
}

export function copyPdfWorker(dest = pdfWorkerDest) {
  const source = pdfWorkerSource();
  mkdirSync(path.dirname(dest), { recursive: true });
  copyFileSync(source, dest);
  return { source, dest };
}

export const imageFallbackFileNames = [
  "openjpeg_nowasm_fallback.js",
  "jbig2_nowasm_fallback.js",
];

export const imageFallbackDir = path.join(desktop, "src/renderer");

export function imageFallbackSource(fileName) {
  if (!imageFallbackFileNames.includes(fileName)) {
    throw new Error(`pdf image fallback is not a js file: ${fileName}`);
  }
  const require = createRequire(path.join(reader, "package.json"));
  return require.resolve(`pdfjs-dist/wasm/${fileName}`);
}

export function copyPdfImageFallbacks(dir = imageFallbackDir) {
  return imageFallbackFileNames.map((fileName) => {
    const source = imageFallbackSource(fileName);
    const dest = path.join(dir, fileName);
    mkdirSync(path.dirname(dest), { recursive: true });
    copyFileSync(source, dest);
    return { source, dest };
  });
}

const invoked = argv[1];
if (invoked && import.meta.url === pathToFileURL(invoked).href) {
  copyPdfWorker();
  copyPdfImageFallbacks();
}

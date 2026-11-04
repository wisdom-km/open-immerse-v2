import path from "node:path";

const CONTENT_TYPES: Readonly<Record<string, string>> = Object.freeze({
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
});

const OCTET_STREAM = "application/octet-stream";

export function contentTypeFor(filePath: string): string {
  const found = CONTENT_TYPES[path.extname(filePath).toLowerCase()];
  return found ?? OCTET_STREAM;
}

import { readFileSync, realpathSync } from "node:fs";
import path from "node:path";

import { contentTypeFor } from "./mime-types.js";

export type StaticResult =
  | {
      readonly kind: "file";
      readonly body: Uint8Array;
      readonly contentType: string;
    }
  | { readonly kind: "missing" }
  | { readonly kind: "method" };

export function resolveStaticFile(
  root: string,
  requestUrl: string,
  method: string,
): StaticResult {
  if (method !== "GET" && method !== "HEAD") {
    return { kind: "method" };
  }
  const filePath = resolveInsideRoot(root, requestUrl);
  if (filePath === null) {
    return { kind: "missing" };
  }
  return {
    kind: "file",
    body: readBytes(filePath),
    contentType: contentTypeFor(filePath),
  };
}

export function bodyForMethod(
  method: string,
  body: Uint8Array,
): Uint8Array | null {
  if (method === "HEAD") {
    return null;
  }
  return body;
}

export function resolveInsideRoot(
  root: string,
  requestUrl: string,
): string | null {
  const url = parseAppUrl(requestUrl);
  if (url === null || !acceptedOrigin(url)) {
    return null;
  }
  const relative = relativePath(url.pathname);
  if (relative === null) {
    return null;
  }
  return realInside(root, relative);
}

function parseAppUrl(requestUrl: string): URL | null {
  try {
    return new URL(requestUrl);
  } catch {
    return null;
  }
}

function acceptedOrigin(url: URL): boolean {
  return (
    url.protocol === "oi-app:" &&
    url.hostname === "app" &&
    url.username === "" &&
    url.password === "" &&
    url.port === ""
  );
}

function relativePath(pathname: string): string | null {
  const decoded = decodePath(pathname);
  if (decoded === null || decoded.includes("\0")) {
    return null;
  }
  const stripped = decoded.replace(/^[/\\]+/, "");
  if (stripped.length === 0 || !isHtmlDocument(stripped)) {
    return null;
  }
  const segments = stripped.split(/[/\\]/);
  if (
    segments.some(
      (segment) => segment === "" || segment === "." || segment === "..",
    )
  ) {
    return null;
  }
  return segments.join(path.sep);
}

function isHtmlDocument(relative: string): boolean {
  return relative.toLowerCase().endsWith(".html");
}

function decodePath(pathname: string): string | null {
  try {
    return decodeURIComponent(pathname);
  } catch {
    return null;
  }
}

function realInside(root: string, relative: string): string | null {
  const rootReal = existingPath(root);
  if (rootReal === null) {
    return null;
  }
  const fileReal = existingPath(path.resolve(rootReal, relative));
  if (fileReal === null) {
    return null;
  }
  const fromRoot = path.relative(rootReal, fileReal);
  if (
    fromRoot.startsWith(`..${path.sep}`) ||
    fromRoot === ".." ||
    path.isAbsolute(fromRoot)
  ) {
    return null;
  }
  return fileReal;
}

function existingPath(candidate: string): string | null {
  try {
    return realpathSync(candidate);
  } catch {
    return null;
  }
}

function readBytes(filePath: string): Uint8Array {
  const data: unknown = readFileSync(filePath);
  if (!(data instanceof Uint8Array)) {
    throw new Error("static file is not bytes");
  }
  return data;
}

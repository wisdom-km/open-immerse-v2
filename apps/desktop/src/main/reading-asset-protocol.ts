import { readFileSync, realpathSync } from "node:fs";
import path from "node:path";

import { schemeResponse } from "./scheme-response.js";
import { bodyForMethod } from "./static-file.js";

export type ReadingAssetPort = (assetId: string) => string | undefined;

export type ReadingAssetRegistrar = (
  scheme: string,
  handler: (request: {
    readonly url: string;
    readonly method: string;
  }) => Response,
) => void;

const SCHEME = "oi-asset";
const PDF_TYPE = "application/pdf";
const PLAIN_TYPE = "text/plain; charset=utf-8";
const NOSNIFF = "nosniff";
const ALLOW_ORIGIN = "oi-app://app";

export function handleReadingAssetProtocol(
  port: ReadingAssetPort,
  register: ReadingAssetRegistrar,
): void {
  register(SCHEME, (request) =>
    respondToReadingAsset(request.url, request.method, port),
  );
}

export function respondToReadingAsset(
  requestUrl: string,
  method: string,
  port: ReadingAssetPort,
): Response {
  if (method !== "GET" && method !== "HEAD") {
    return emptyResponse(405);
  }
  const assetId = assetIdFrom(requestUrl);
  if (assetId === undefined) {
    return emptyResponse(404);
  }
  const filePath = port(assetId);
  if (filePath === undefined) {
    return emptyResponse(404);
  }
  const bytes = readSourcePdf(filePath);
  if (bytes === undefined) {
    return emptyResponse(404);
  }
  return pdfResponse(method, bytes);
}

function assetIdFrom(requestUrl: string): string | undefined {
  if (
    requestUrl.includes("..") ||
    requestUrl.toLowerCase().includes("%2e%2e")
  ) {
    return undefined;
  }
  const url = parseUrl(requestUrl);
  if (url === null || !isAssetUrl(url)) {
    return undefined;
  }
  return oneSegment(url.pathname);
}

function parseUrl(requestUrl: string): URL | null {
  try {
    return new URL(requestUrl);
  } catch {
    return null;
  }
}

function isAssetUrl(url: URL): boolean {
  return (
    url.protocol === `${SCHEME}:` &&
    url.username === "" &&
    url.password === "" &&
    url.port === "" &&
    url.search === "" &&
    url.hash === "" &&
    url.hostname === "asset"
  );
}

function oneSegment(pathname: string): string | undefined {
  if (!pathname.startsWith("/") || pathname.length < 2) {
    return undefined;
  }
  const segment = pathname.slice(1);
  if (segment.includes("/") || segment === "." || segment === "..") {
    return undefined;
  }
  return segment;
}

function readSourcePdf(filePath: string): Uint8Array | undefined {
  const real = pdfInsideEntry(filePath);
  if (real === undefined) {
    return undefined;
  }
  const bytes = readBytes(real);
  if (bytes === undefined || !hasPdfHeader(bytes)) {
    return undefined;
  }
  return bytes;
}

function pdfInsideEntry(filePath: string): string | undefined {
  const entryName = path.basename(path.dirname(filePath));
  if (!isEntryName(entryName) || path.basename(filePath) !== "source.pdf") {
    return undefined;
  }
  const libraryReal = existingPath(path.dirname(path.dirname(filePath)));
  const fileReal = existingPath(filePath);
  if (libraryReal === null || fileReal === null) {
    return undefined;
  }
  if (
    path.relative(libraryReal, fileReal) !== path.join(entryName, "source.pdf")
  ) {
    return undefined;
  }
  return fileReal;
}

function isEntryName(name: string): boolean {
  return name !== "" && name !== "." && name !== "..";
}

function existingPath(candidate: string): string | null {
  try {
    return realpathSync(candidate);
  } catch {
    return null;
  }
}

function readBytes(filePath: string): Uint8Array | undefined {
  try {
    const data: unknown = readFileSync(filePath);
    if (!(data instanceof Uint8Array)) {
      return undefined;
    }
    return data;
  } catch {
    return undefined;
  }
}

function hasPdfHeader(bytes: Uint8Array): boolean {
  return (
    bytes.length >= 5 &&
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46 &&
    bytes[4] === 0x2d
  );
}

function assetHeaders(contentType: string): Record<string, string> {
  return {
    "Content-Type": contentType,
    "X-Content-Type-Options": NOSNIFF,
    "Access-Control-Allow-Origin": ALLOW_ORIGIN,
  };
}

function pdfResponse(method: string, bytes: Uint8Array): Response {
  return schemeResponse(bodyForMethod(method, bytes), {
    status: 200,
    headers: assetHeaders(PDF_TYPE),
  }) as Response;
}

function emptyResponse(status: 404 | 405): Response {
  return schemeResponse(null, {
    status,
    headers: assetHeaders(PLAIN_TYPE),
  }) as Response;
}

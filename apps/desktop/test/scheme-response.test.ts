import { expect, it } from "vitest";

import { CONTENT_SECURITY_POLICY } from "../src/main/security/csp.js";
import { schemeResponse } from "../src/main/scheme-response.js";

it("sets the CSP header on the scheme response", async () => {
  const response = schemeResponse(new Uint8Array([60]), {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Security-Policy": CONTENT_SECURITY_POLICY,
    },
  });
  expect(readStatus(response)).toBe(200);
  expect(await readHeader(response, "content-security-policy")).toBe(CONTENT_SECURITY_POLICY);
});

function readStatus(value: object): number {
  if (!("status" in value) || typeof value.status !== "number") {
    throw new Error("missing status");
  }
  return value.status;
}

async function readHeader(value: object, name: string): Promise<string> {
  const found: unknown = await headerLookup(value).get(name);
  if (typeof found !== "string") {
    throw new Error("missing header");
  }
  return found;
}

function headerLookup(value: object): { get: (name: string) => unknown } {
  if (!("headers" in value) || typeof value.headers !== "object" || value.headers === null) {
    throw new Error("missing headers");
  }
  if (!("get" in value.headers) || typeof value.headers.get !== "function") {
    throw new Error("missing header lookup");
  }
  return value.headers as { get: (name: string) => unknown };
}

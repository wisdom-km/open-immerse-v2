import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { expect, it } from "vitest";

import {
  readHealthResponse,
  readProtocolHeader,
  readUnsupportedProtocol,
} from "../../packages/contracts/src/worker-protocol.js";

const directory = path.resolve("fixtures/protocol/versions");

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function load(file: string): Record<string, unknown> {
  const parsed: unknown = JSON.parse(readFileSync(path.join(directory, file), "utf8"));
  if (!isRecord(parsed)) {
    throw new Error(file);
  }
  return parsed;
}

function assertHealth(fixture: Record<string, unknown>): void {
  const read = readHealthResponse(fixture.document);
  if (fixture.expect === "accept") {
    expect(read).toEqual(fixture.parsed);
    return;
  }
  expect(fixture.expect).toBe("reject");
  expect(read).toBeUndefined();
}

function assertUnsupported(fixture: Record<string, unknown>): void {
  const read = readUnsupportedProtocol(fixture.document);
  if (fixture.expect === "accept") {
    expect(read).toEqual(fixture.parsed);
    return;
  }
  expect(fixture.expect).toBe("reject");
  expect(read).toBeUndefined();
}

function assertExchange(fixture: Record<string, unknown>): void {
  expect(fixture.jobsSubmitted).toBe(0);
  expect(fixture.expectStatus).toBe(426);
  expect(readProtocolHeader(fixture.header)).toBe(fixture.header);
  const body = fixture.body;
  expect(isRecord(body) && !("jobId" in body)).toBe(true);
  expect(readUnsupportedProtocol(body)).toEqual(body);
}

it("reads AC-66 protocol fixtures when the sample is loaded", () => {
  const files = readdirSync(directory)
    .filter((name) => name.endsWith(".json"))
    .sort();
  expect(files.length).toBeGreaterThan(0);
  for (const file of files) {
    const fixture = load(file);
    if (fixture.kind === "health") {
      assertHealth(fixture);
    } else if (fixture.kind === "unsupported") {
      assertUnsupported(fixture);
    } else if (fixture.kind === "exchange") {
      assertExchange(fixture);
    } else {
      throw new Error(file);
    }
  }
});

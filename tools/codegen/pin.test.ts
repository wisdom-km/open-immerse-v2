import { readFileSync } from "node:fs";
import { expect, it } from "vitest";

function pinVersion(): string {
  const parsed: unknown = JSON.parse(readFileSync("tools/codegen/pin.json", "utf8"));
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("pin");
  }
  if (!("datamodelCodeGenerator" in parsed)) {
    throw new Error("pin");
  }
  const version = parsed.datamodelCodeGenerator;
  if (typeof version !== "string" || version === "") {
    throw new Error("pin");
  }
  return version;
}

it("pins datamodel-code-generator when the worker dev extra is installed", () => {
  const project = readFileSync("workers/parser/pyproject.toml", "utf8");
  expect(project).toContain(`datamodel-code-generator==${pinVersion()}`);
});

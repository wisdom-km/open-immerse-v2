import path from "node:path";
import { expect, it } from "vitest";

import {
  claimOutput,
  commonDirectory,
  relativeOutput,
} from "./schema-output-name.mjs";

it("rejects a second source when the output path is already claimed", () => {
  const claimed = new Map<string, string>();
  claimOutput("/src/left/item.ts", "same.codegen.mjs", claimed);
  expect(() =>
    claimOutput("/src/right/item.ts", "same.codegen.mjs", claimed),
  ).toThrow(/^schema output collision: /);
});

it("rejects a source path that climbs out of the root", () => {
  expect(() =>
    relativeOutput("/tmp/oi-root", "/tmp/oi-root/../outside.ts"),
  ).toThrow(/^schema output outside root: /);
});

it("rejects a source path outside the root", () => {
  expect(() => relativeOutput("/tmp/oi-root", "/tmp/oi-other/file.ts")).toThrow(
    /^schema output outside root: /,
  );
});

it("accepts a Windows source when the drive letter case differs", () => {
  const root = commonDirectory(
    ["c:\\work\\a.ts", "C:\\work\\b.ts"],
    path.win32,
  );
  expect(root).toBe("C:\\work");
  expect(relativeOutput(root, "c:\\work\\a.ts", path.win32)).toBe(
    "a.codegen.mjs",
  );
  expect(relativeOutput("c:\\work", "C:\\work\\b.ts", path.win32)).toBe(
    "b.codegen.mjs",
  );
});

it("places sources under the drive root when only the drive letter is shared", () => {
  const root = commonDirectory(
    ["c:\\left\\a.ts", "C:\\right\\b.ts"],
    path.win32,
  );
  expect(root).toBe("C:\\");
  expect(relativeOutput(root, "c:\\left\\a.ts", path.win32)).toBe(
    path.win32.join("left", "a.codegen.mjs"),
  );
  expect(relativeOutput(root, "C:\\right\\b.ts", path.win32)).toBe(
    path.win32.join("right", "b.codegen.mjs"),
  );
});

it("rejects Windows sources when the drives differ", () => {
  expect(() =>
    commonDirectory(["C:\\left\\a.ts", "D:\\right\\b.ts"], path.win32),
  ).toThrow(/^schema output outside root$/);
});

it("returns the posix root when sources only share /", () => {
  expect(commonDirectory(["/a/x.ts", "/b/y.ts"], path.posix)).toBe("/");
  expect(relativeOutput("/", "/a/x.ts", path.posix)).toBe(
    path.posix.join("a", "x.codegen.mjs"),
  );
  expect(relativeOutput("/", "/b/y.ts", path.posix)).toBe(
    path.posix.join("b", "y.codegen.mjs"),
  );
});

it("returns the shared directory when sources share more than the root", () => {
  expect(
    commonDirectory(["/repo/left/a.ts", "/repo/right/b.ts"], path.posix),
  ).toBe("/repo");
});

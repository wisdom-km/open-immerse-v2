import { expect, it } from "vitest";

import { applySpecifiers, readSpecifiers } from "./schema-specifiers.mjs";

const href = "file:///tmp/oi-schema/leaf.codegen.mjs";

it("leaves an ordinary string unchanged when it matches a specifier", () => {
  const code = 'import { a } from "./a.js";\nconst text = "./a.js";\n';
  const next = applySpecifiers(code, new Map([["./a.js", href]]));
  expect(next).toContain(`from ${JSON.stringify(href)}`);
  expect(next).toContain('const text = "./a.js"');
});

it("rewrites both single-quoted and double-quoted imports", () => {
  const code = "import { a } from \"./a.js\";\nimport { b } from './a.js';\n";
  const next = applySpecifiers(code, new Map([["./a.js", href]]));
  expect(next).not.toContain('"./a.js"');
  expect(next).not.toContain("'./a.js'");
  expect(next.match(new RegExp(href, "g"))).toHaveLength(2);
});

it("rewrites export star and named re-exports", () => {
  const code = 'export * from "./leaf.js";\nexport { x } from "./leaf.js";\n';
  const next = applySpecifiers(code, new Map([["./leaf.js", href]]));
  expect(next).toBe(
    `export * from ${JSON.stringify(href)};\nexport { x } from ${JSON.stringify(href)};\n`,
  );
});

it("rejects a dynamic import", () => {
  expect(() =>
    readSpecifiers('export const pending = import("./leaf.js");\n', "entry.ts"),
  ).toThrow(/^dynamic import: /);
});

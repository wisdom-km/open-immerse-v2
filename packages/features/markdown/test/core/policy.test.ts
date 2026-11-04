import { expect, it } from "vitest";

import {
  calloutType,
  formulaBlocked,
  headingSlug,
  overFormulaBudget,
  toHtmlBlocked,
} from "../../src/index.js";

it("keeps raw HTML text and does not classify by tag name", () => {
  const script = toHtmlBlocked("<script>alert(1)</script>", {
    start: 0,
    end: 25,
  });
  const styled = toHtmlBlocked('<b onclick="x">粗</b>', { start: 0, end: 20 });
  expect(script.t).toBe("html_blocked");
  expect(script.raw).toBe("<script>alert(1)</script>");
  expect(styled.raw).toBe('<b onclick="x">粗</b>');
});

it("blocks untrusted commands and tex past the shared character cap", () => {
  expect(formulaBlocked("\\href{https://example.com}{x}")).toBe(
    "untrusted_command",
  );
  expect(formulaBlocked("x")).toBeNull();
  expect(formulaBlocked("y".repeat(8001))).toBe("too_long");
});

it("leaves the document formula budget off when both limits are null", () => {
  const formulas = Array.from({ length: 40 }, () => ({
    tex: "x".repeat(200),
  }));
  expect(
    overFormulaBudget(formulas, { maxFormulas: null, maxTexChars: null }),
  ).toBe(false);
  expect(
    overFormulaBudget(formulas, { maxFormulas: 1, maxTexChars: null }),
  ).toBe(true);
});

it("builds a stable heading slug and numbers duplicates from 2", () => {
  const used = new Set<string>();
  const first = headingSlug("Hello, 标题", used);
  used.add(first);
  const second = headingSlug("Hello, 标题", used);
  expect(first).toBe("hello-标题");
  expect(second).toBe("hello-标题-2");
  expect(headingSlug("   ", used)).toBe("section");
});

it("reads an Obsidian callout type and leaves highlight text alone", () => {
  expect(calloutType("[!note] Title")).toBe("note");
  expect(calloutType("[!WARNING]- folded")).toBe("WARNING");
  expect(calloutType("plain quote")).toBeNull();
  expect(calloutType("==高亮==")).toBeNull();
});

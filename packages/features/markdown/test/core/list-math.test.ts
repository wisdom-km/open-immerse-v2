import { expect, it } from "vitest";

import { renderMarkdown, serialize } from "../../src/index.js";

it("keeps a display formula inside the preceding list item", () => {
  const source = "1. 第一\n\n$$\na\n$$\n2. 第二";
  const doc = renderMarkdown(source, "note");
  expect(serialize(doc, source)).toBe(source);
  expect(doc.blocks).toHaveLength(1);
  const list = doc.blocks[0];
  expect(list?.t).toBe("list");
  if (list?.t !== "list") {
    return;
  }
  expect(list.items).toHaveLength(2);
  expect(list.start).toBeUndefined();
  expect(list.items[0]?.blocks.map((block) => block.t)).toContain("math");
  expect(list.items[1]?.blocks.map((block) => block.t)).not.toContain("math");
});

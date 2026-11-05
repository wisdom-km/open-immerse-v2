import {
  array,
  assert,
  constantFrom,
  oneof,
  property,
  string,
} from "fast-check";
import { expect, it } from "vitest";

import type { MdContext } from "@oi/contracts";

import { renderMarkdown, serialize } from "../../src/index.js";

const contexts: readonly MdContext[] = ["note", "translation", "answer"];

const syntax = constantFrom(
  "# 标题\n\n",
  "**粗** ",
  "*斜* ",
  "~~删~~ ",
  "`$5` ",
  "```\n$5\n```\n\n",
  "$x$ ",
  "$$\ny\n$$\n\n",
  "$\\href{https://example.com}{x}$ ",
  "[文档](https://example.com/$a$) ",
  "https://x.com/$b$ ",
  "- [ ] 待办\n",
  "- [x] 完成\n",
  "1. 第一\n",
  "> [!note] 注意\n> 正文\n\n",
  "| 左 | 右 |\n| --- | ---: |\n| 1 | 2 |\n\n",
  "[[目标#标题|别名]] ",
  "![[图.png]] ",
  "==高亮== ",
  '<b onclick="x">粗</b> ',
  "文字[^1]\n\n[^1]: 注\n\n",
  "😀 ",
  "\n\n",
  "$",
  "$$ ",
);

const markdown = oneof(
  { weight: 1, arbitrary: string({ maxLength: 40, unit: "binary" }) },
  {
    weight: 4,
    arbitrary: array(syntax, { minLength: 1, maxLength: 6 }).map((parts) =>
      parts.join(""),
    ),
  },
);

it("round-trips a display formula that crosses a blank line", () => {
  const source = "$$ # 标题\n\n$$\ny\n$$\n\n";
  for (const context of contexts) {
    expect(serialize(renderMarkdown(source, context), source)).toBe(source);
  }
});

it("round-trips generated markdown in every context", () => {
  assert(
    property(markdown, constantFrom(...contexts), (source, context) => {
      expect(serialize(renderMarkdown(source, context), source)).toBe(source);
    }),
    { numRuns: 40 },
  );
});

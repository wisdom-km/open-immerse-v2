export const KATEX_SAFE_OPTIONS = {
  throwOnError: true,
  trust: false,
  strict: "ignore",
  output: "html",
  maxSize: 20,
  maxExpand: 1000,
} as const;

export const FORMULA_MAX_CHARS = 8000 as const;

export const UNTRUSTED_LATEX_COMMANDS = [
  "\\href",
  "\\url",
  "\\includegraphics",
  "\\htmlClass",
  "\\htmlId",
  "\\htmlStyle",
  "\\htmlData",
] as const;

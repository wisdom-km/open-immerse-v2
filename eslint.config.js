import js from "@eslint/js";
import tseslint from "typescript-eslint";

const coreFiles = [
  "packages/contracts/**/*.{ts,tsx}",
  "packages/kernel/**/*.{ts,tsx}",
  "packages/features/**/src/domain/**/*.{ts,tsx}",
  "packages/features/**/src/application/**/*.{ts,tsx}",
  "packages/features/**/src/index.ts",
  "packages/features/**/src/pure.ts",
  "tools/tsconfig-core/**/*.ts",
];

export default tseslint.config(
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      "coverage/**",
      "tools/gate-fixtures/**",
      "workers/parser/.venv/**",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked.map((config) => ({
    ...config,
    files: ["**/*.{ts,tsx}"],
  })),
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ["tools/**/*.mjs"],
    languageOptions: {
      globals: {
        console: "readonly",
        process: "readonly",
      },
    },
  },
  {
    files: ["**/*.{js,mjs,cjs,ts,tsx}"],
    rules: {
      complexity: ["error", 15],
      "max-lines-per-function": [
        "error",
        { max: 80, skipBlankLines: false, skipComments: false },
      ],
      "no-restricted-globals": ["error", "chrome"],
    },
  },
  {
    files: coreFiles,
    rules: {
      "no-restricted-globals": [
        "error",
        "chrome",
        "window",
        "document",
        "navigator",
        "location",
        "history",
        "localStorage",
        "sessionStorage",
        "requestAnimationFrame",
      ],
    },
  },
  {
    files: ["packages/features/**/src/domain/**/*.{ts,tsx}"],
    rules: {
      "max-lines-per-function": "off",
    },
  },
  {
    files: ["**/*.{js,mjs,cjs,ts,tsx}"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "Program > VariableDeclaration[kind='let']",
          message: "F-06: module-level let is forbidden",
        },
      ],
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "katex",
              message: "G2: katex only in ui-kit math and formula katex-renderer",
            },
            {
              name: "markdown-it",
              message: "G2: markdown parser only in features/markdown/src/domain/parse",
            },
            {
              name: "micromark",
              message: "G2: markdown parser only in features/markdown/src/domain/parse",
            },
            {
              name: "mdast",
              message: "G2: markdown parser only in features/markdown/src/domain/parse",
            },
          ],
          patterns: [
            {
              group: ["katex/*"],
              message: "G2: katex only in ui-kit math and formula katex-renderer",
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      "packages/ui-kit/src/markdown/math.tsx",
      "packages/features/formula/src/adapters/katex-renderer.ts",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "markdown-it",
              message: "G2: markdown parser only in features/markdown/src/domain/parse",
            },
            {
              name: "micromark",
              message: "G2: markdown parser only in features/markdown/src/domain/parse",
            },
            {
              name: "mdast",
              message: "G2: markdown parser only in features/markdown/src/domain/parse",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["packages/features/markdown/src/domain/parse/**/*.{js,mjs,cjs,ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "katex",
              message: "G2: katex only in ui-kit math and formula katex-renderer",
            },
          ],
          patterns: [
            {
              group: ["katex/*"],
              message: "G2: katex only in ui-kit math and formula katex-renderer",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["packages/features/markdown/src/adapters/**/*.{js,mjs,cjs,ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "katex",
              message: "G2: katex only in ui-kit math and formula katex-renderer",
            },
            {
              name: "markdown-it",
              message: "G2: markdown parser only in features/markdown/src/domain/parse",
            },
            {
              name: "micromark",
              message: "G2: markdown parser only in features/markdown/src/domain/parse",
            },
            {
              name: "mdast",
              message: "G2: markdown parser only in features/markdown/src/domain/parse",
            },
            {
              name: "node:fs",
              importNames: [
                "writeFile",
                "appendFile",
                "rename",
                "unlink",
                "rm",
                "mkdir",
                "copyFile",
                "createWriteStream",
              ],
              message: "G2: markdown adapters must not import fs write APIs",
            },
            {
              name: "node:fs/promises",
              importNames: [
                "writeFile",
                "appendFile",
                "rename",
                "unlink",
                "rm",
                "mkdir",
                "copyFile",
              ],
              message: "G2: markdown adapters must not import fs write APIs",
            },
          ],
          patterns: [
            {
              group: ["katex/*"],
              message: "G2: katex only in ui-kit math and formula katex-renderer",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["apps/desktop/src/renderer/**/*.{js,jsx,ts,tsx}"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "Program > VariableDeclaration[kind='let']",
          message: "F-06: module-level let is forbidden",
        },
        {
          selector: "JSXAttribute[name.name='dangerouslySetInnerHTML']",
          message: "G2: react/no-danger, renderer must not set HTML",
        },
      ],
    },
  },
);

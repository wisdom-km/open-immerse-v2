import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

const root = path.dirname(fileURLToPath(import.meta.url));

/** G8、G16。core 用例与工具夹具都在 Node 环境。没有 core 文件时工具夹具仍让套件非空。 */
export default defineConfig({
  resolve: {
    alias: {
      "@oi/kernel": path.join(root, "packages/kernel/src/index.ts"),
      "@oi/contracts": path.join(root, "packages/contracts/src/index.ts"),
      "@oi/platform-node": path.join(
        root,
        "packages/platform-node/src/index.ts",
      ),
    },
  },
  test: {
    environment: "node",
    include: [
      "tools/**/*.test.ts",
      "packages/features/*/test/core/**/*.ts",
      "packages/features/*/test/adapters/**/*.ts",
      "packages/contracts/**/*.test.ts",
      "packages/kernel/**/*.test.ts",
      "packages/platform-node/test/**/*.test.ts",
      "apps/desktop/test/**/*.test.ts",
    ],
    typecheck: {
      enabled: true,
      checker: "tsc",
      include: [
        "packages/contracts/**/*.test.ts",
        "packages/kernel/**/*.test.ts",
      ],
      tsconfig: "./tsconfig.core.json",
    },
    exclude: [
      "tools/gate-fixtures/**",
      "node_modules/**",
      "**/node_modules/**",
    ],
    passWithNoTests: false,
  },
});

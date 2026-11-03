import { defineConfig } from "vitest/config";

/** G8、G16。core 用例与工具夹具都在 Node 环境。没有 core 文件时工具夹具仍让套件非空。 */
export default defineConfig({
  test: {
    environment: "node",
    include: [
      "tools/**/*.test.ts",
      "packages/features/*/test/core/**/*.ts",
      "packages/contracts/**/*.test.ts",
      "packages/kernel/**/*.test.ts",
      "packages/platform-node/**/*.test.ts",
      "apps/desktop/test/**/*.test.ts",
    ],
    typecheck: {
      enabled: true,
      checker: "tsc",
      include: ["packages/contracts/**/*.test.ts", "packages/kernel/**/*.test.ts"],
      tsconfig: "./tsconfig.core.json",
    },
    exclude: ["tools/gate-fixtures/**", "node_modules/**"],
    passWithNoTests: false,
  },
});

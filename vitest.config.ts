import { defineConfig } from "vitest/config";

/** G8、G16。core 用例与工具夹具都在 Node 环境。没有 core 文件时工具夹具仍让套件非空。 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["tools/**/*.test.ts", "packages/features/*/test/core/**/*.ts"],
    exclude: ["tools/gate-fixtures/**", "node_modules/**"],
    passWithNoTests: false,
  },
});

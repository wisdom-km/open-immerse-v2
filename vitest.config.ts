import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    passWithNoTests: false,
    projects: [
      {
        test: {
          name: "tools",
          environment: "node",
          include: ["tools/**/*.test.ts"],
          exclude: ["tools/gate-fixtures/**", "node_modules/**"],
        },
      },
      {
        test: {
          name: "core",
          environment: "node",
          include: ["packages/features/*/test/core/**/*.ts"],
          passWithNoTests: true,
        },
      },
    ],
  },
});

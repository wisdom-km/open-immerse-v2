import { defineConfig } from "vitest/config";

/** 不在 CONFIG_NAMES 里。只有显式 --config 才会加载。 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["apps/desktop/native-windows/**/*.test.ts"],
    passWithNoTests: false,
  },
});

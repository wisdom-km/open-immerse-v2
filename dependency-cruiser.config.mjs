import path from "node:path";
import { fileURLToPath } from "node:url";

import { forbiddenRules } from "./tools/check-deps/build-rules.mjs";

const root = path.dirname(fileURLToPath(import.meta.url));

/** G5、G13、G15、G16。type-only 导入也算依赖（tsPreCompilationDeps）。 */
export default {
  forbidden: forbiddenRules(),
  options: {
    tsPreCompilationDeps: true,
    tsConfig: {
      fileName: path.join(root, "tools/check-deps/tsconfig.paths.json"),
    },
    doNotFollow: { path: "node_modules" },
    exclude: {
      path: "(^|/)tools/gate-fixtures/|(^|/)dist/|(^|/)coverage/",
    },
    enhancedResolveOptions: {
      exportsFields: ["exports"],
      conditionNames: ["import", "require", "node", "default"],
    },
  },
};

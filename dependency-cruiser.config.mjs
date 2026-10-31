import { forbiddenRules } from "./tools/check-deps/build-rules.mjs";

/** G5、G13、G15、G16。type-only 导入也算依赖（tsPreCompilationDeps）。 */
export default {
  forbidden: forbiddenRules(),
  options: {
    tsPreCompilationDeps: true,
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

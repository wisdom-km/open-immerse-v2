import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const contracts = new globalThis.URL(
  "../../../../contracts/src/index.ts",
  import.meta.url,
);

export async function resolve(specifier, context, nextResolve) {
  if (context.parentURL?.includes("/node_modules/")) {
    return nextResolve(specifier, context);
  }
  if (specifier === "@oi/contracts") {
    return nextResolve(contracts.href, context);
  }
  if (
    specifier.endsWith(".js") &&
    !specifier.includes("node_modules") &&
    (specifier.startsWith("./") || specifier.startsWith("../"))
  ) {
    const tsSpecifier = specifier.slice(0, -3) + ".ts";
    const resolved = await nextResolve(tsSpecifier, context);
    const file = fileURLToPath(resolved.url);
    if (existsSync(file)) {
      return resolved;
    }
  }
  return nextResolve(specifier, context);
}

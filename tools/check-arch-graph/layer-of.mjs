const packageLayers = {
  "@oi/platform-node": "PN",
  "@oi/worker-client": "WC",
  "@oi/providers": "PV",
  "@oi/ui-kit": "UK",
  "@oi/contracts": "C",
  "@oi/kernel": "K",
};

function norm(ref) {
  return String(ref).replaceAll("\\", "/");
}

function isExcluded(name) {
  if (name.includes("/node_modules/")) {
    return true;
  }
  if (
    name.includes("/test/") ||
    name.includes("/tests/") ||
    name.includes("/__tests__/")
  ) {
    return true;
  }
  if (name.includes("/e2e/") || name.startsWith("e2e/")) {
    return true;
  }
  if (/(^|\/)[^/]+\.(test|spec)\.[cm]?[jt]sx?$/.test(name)) {
    return true;
  }
  return (
    name.endsWith("/playwright.config.ts") || name === "playwright.config.ts"
  );
}

function featureLayer(name) {
  if (name.includes("/src/ui/")) {
    return "UI";
  }
  if (name.includes("/src/adapters/")) {
    return "ADP";
  }
  if (name.includes("/src/application/")) {
    return "APP";
  }
  if (name.includes("/src/domain/")) {
    return "DOM";
  }
  if (name.endsWith("/src/pure.ts")) {
    return "DOM";
  }
  if (name.endsWith("/src/index.ts")) {
    return "SEAM";
  }
  return null;
}

function layerOfPath(name) {
  if (name.startsWith("apps/desktop/src/renderer/")) {
    return "UI";
  }
  if (name.startsWith("apps/desktop/src/preload/")) {
    return "PRE";
  }
  if (name.startsWith("apps/desktop/src/main/")) {
    return "MAIN";
  }
  if (name.startsWith("packages/platform-node/")) {
    return "PN";
  }
  if (name.startsWith("packages/worker-client/")) {
    return "WC";
  }
  if (name.startsWith("packages/providers/")) {
    return "PV";
  }
  if (name.startsWith("packages/ui-kit/")) {
    return "UK";
  }
  if (name.startsWith("packages/contracts/")) {
    return "C";
  }
  if (name.startsWith("packages/kernel/")) {
    return "K";
  }
  if (name.startsWith("workers/parser/")) {
    return "PY";
  }
  if (name.startsWith("packages/features/")) {
    return featureLayer(name);
  }
  return null;
}

export function layerOf(ref) {
  const name = norm(ref);
  if (isExcluded(name)) {
    return { kind: "excluded" };
  }
  const pkg = packageLayers[name];
  if (pkg) {
    return { kind: "layer", id: pkg };
  }
  if (name.startsWith("@oi/feature-")) {
    return { kind: "seam" };
  }
  const id = layerOfPath(name);
  if (id === "SEAM") {
    return { kind: "seam" };
  }
  if (id) {
    return { kind: "layer", id };
  }
  if (name.startsWith("@") || name.startsWith("node:")) {
    return { kind: "external" };
  }
  return { kind: "unmapped" };
}

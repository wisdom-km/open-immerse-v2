import { featureEdges } from "./feature-edges.mjs";

function rule(name, from, to) {
  return { name, severity: "error", from, to };
}

function pkg(name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return `^${escaped}$|(^|/)node_modules/${escaped}(/|$)`;
}

function prefix(name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return `^${escaped}|(^|/)node_modules/${escaped}`;
}

const uiTargets = [
  pkg("react"),
  pkg("react-dom"),
  pkg("react/jsx-runtime"),
  prefix("react-router"),
  "^@tanstack/[^/]*router|(^|/)node_modules/@tanstack/[^/]*router",
  pkg("wouter"),
  pkg("styled-components"),
  prefix("@emotion/"),
  prefix("@vanilla-extract/"),
  prefix("@testing-library/"),
  pkg("jsdom"),
  pkg("happy-dom"),
  pkg("electron"),
  pkg("pdfjs-dist"),
  pkg("@oi/ui-kit"),
  "\\.(css|scss|sass|less)$",
  "^packages/features/[^/]+/src/ui/",
  "^apps/desktop/src/(renderer|preload)/",
].join("|");

const shellIo = [
  pkg("better-sqlite3"),
  pkg("sqlite3"),
  "^node:",
  "^(fs|path|child_process)$",
  "^packages/platform-node/",
  "^packages/worker-client/",
  "^packages/providers/",
  pkg("@oi/providers"),
  pkg("electron"),
].join("|");

const coreFrom =
  "^packages/(contracts|kernel)/|^packages/features/[^/]+/src/(domain|application)/|^packages/features/[^/]+/src/(index|pure)\\.ts$";

function matrixRules() {
  const known = Object.keys(featureEdges).join("|");
  const rules = Object.entries(featureEdges).map(([name, targets]) => {
    const allowed = [name, ...targets]
      .map((target) => `^packages/features/${target}/src/index\\.ts$`)
      .join("|");
    return rule(
      "feature-dependency-matrix",
      { path: `^packages/features/${name}/` },
      {
        path: "^packages/features/[^/]+/src/index\\.ts$",
        pathNot: allowed,
      },
    );
  });
  rules.push(
    rule(
      "feature-dependency-matrix",
      { path: `^packages/features/(?!(?:${known})/)([^/]+)/` },
      {
        path: "^packages/features/[^/]+/src/index\\.ts$",
        pathNot: "^packages/features/$1/src/index\\.ts$",
      },
    ),
  );
  return rules;
}

function layerRules() {
  return [
    rule(
      "layer-direction",
      { path: "^packages/features/[^/]+/src/domain/" },
      { path: `^packages/features/[^/]+/src/(application|adapters|ui)/|${shellIo}` },
    ),
    rule(
      "layer-direction",
      { path: "^packages/features/[^/]+/src/application/" },
      { path: `^packages/features/[^/]+/src/(adapters|ui)/|${shellIo}` },
    ),
    rule(
      "layer-direction",
      { path: "^packages/features/[^/]+/src/adapters/" },
      { path: "^packages/features/[^/]+/src/ui/" },
    ),
    rule(
      "layer-direction",
      { path: "^packages/(kernel|contracts)/" },
      { path: "^packages/(features|platform-node|worker-client|providers)/" },
    ),
    rule(
      "layer-direction",
      { path: "^packages/platform-node/" },
      { path: "^packages/features/" },
    ),
  ];
}

function boundaryRules() {
  return [
    rule("no-circular", {}, { circular: true }),
    rule(
      "no-cross-feature-internals",
      { path: "^packages/features/([^/]+)/" },
      {
        path: "^packages/features/",
        pathNot: "^packages/features/$1/|^packages/features/[^/]+/src/index\\.ts$",
      },
    ),
    rule(
      "renderer-isolation",
      { path: "^apps/desktop/src/renderer/" },
      { path: `^node:|^fs$|${shellIo}` },
    ),
    rule(
      "electron-only-in-desktop",
      { pathNot: "^apps/desktop/" },
      { path: pkg("electron") },
    ),
    rule(
      "contracts-is-leaf",
      { path: "^packages/contracts/" },
      {
        path: "^packages/(features|kernel|platform-node|providers|worker-client|ui-kit)/|^apps/",
      },
    ),
    rule(
      "providers-boundary",
      { pathNot: "^packages/features/[^/]+/src/adapters/|^apps/desktop/src/main/" },
      { path: `^packages/providers/|${pkg("@oi/providers")}` },
    ),
    rule(
      "providers-boundary",
      { path: "^packages/providers/" },
      { path: `^packages/features/|^apps/|${pkg("electron")}|${uiTargets}` },
    ),
  ];
}

function seamRules() {
  const uiFrom = "^packages/features/[^/]+/src/ui/|^apps/desktop/src/renderer/";
  return [
    rule("core-no-ui", { path: coreFrom }, { path: uiTargets }),
    rule(
      "ui-through-seam",
      { path: uiFrom },
      {
        path: `^packages/features/[^/]+/src/(domain|application|adapters)/|^packages/features/[^/]+/src/index\\.ts$|${shellIo}|^workers/`,
      },
    ),
    rule(
      "pure-seam-stays-pure",
      { path: "^packages/features/[^/]+/src/pure\\.ts$" },
      {
        path: `^packages/features/[^/]+/src/(application|adapters)/|${shellIo}`,
        reachable: true,
      },
    ),
    rule(
      "markdown-parser-not-in-renderer",
      { path: `${uiFrom}|^packages/features/[^/]+/src/pure\\.ts$` },
      {
        path: `^packages/features/markdown/src/domain/parse/|${pkg("markdown-it")}|${pkg("micromark")}|${pkg("mdast")}`,
        reachable: true,
      },
    ),
    rule(
      "core-test-through-seam",
      { path: "^packages/features/([^/]+)/test/core/" },
      {
        path: "^packages/features/$1/src/",
        pathNot: "^packages/features/$1/src/((index|pure)\\.ts$|testing/)",
      },
    ),
    rule(
      "core-test-through-seam",
      { path: "^packages/features/[^/]+/test/core/" },
      {
        path: `${pkg("react")}|${prefix("@testing-library/")}|${pkg("jsdom")}|${pkg("happy-dom")}|${pkg("@oi/ui-kit")}|/src/ui/`,
      },
    ),
  ];
}

export function forbiddenRules() {
  return [...matrixRules(), ...layerRules(), ...boundaryRules(), ...seamRules()];
}

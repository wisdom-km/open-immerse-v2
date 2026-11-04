import { readFileSync } from "node:fs";

import { expect, it } from "vitest";

import { parseMermaid, type MermaidEdge } from "./parse-mermaid.mjs";

const solid = (from: string, to: string): MermaidEdge => ({
  from,
  to,
  kind: "solid",
  label: null,
});

const labeled = (
  from: string,
  to: string,
  kind: MermaidEdge["kind"],
  label: string,
): MermaidEdge => ({ from, to, kind, label });

const drawn: readonly MermaidEdge[] = [
  solid("UI", "UK"),
  labeled("UI", "DOM", "solid", "只经 src/pure.ts"),
  solid("UI", "C"),
  solid("PRE", "C"),
  solid("MAIN", "ADP"),
  solid("MAIN", "APP"),
  solid("MAIN", "PN"),
  solid("MAIN", "PV"),
  solid("ADP", "APP"),
  solid("ADP", "DOM"),
  solid("ADP", "PN"),
  solid("ADP", "WC"),
  solid("ADP", "PV"),
  solid("APP", "DOM"),
  solid("APP", "C"),
  solid("DOM", "C"),
  solid("DOM", "K"),
  solid("APP", "K"),
  solid("PN", "K"),
  solid("PN", "C"),
  solid("WC", "C"),
  solid("PV", "PN"),
  solid("PV", "C"),
  solid("PV", "K"),
  labeled("ADP", "PY", "dashed", "HTTP（oi-parse/1）"),
  labeled("PY", "C", "dashed", "生成的协议模型"),
  labeled("C", "K", "solid", "仅 type-only"),
];

it("reads 23 plain solids, 2 labeled solids, and 2 dashed edges from §5.1", () => {
  const graph = parseMermaid(readFileSync("docs/arch/05-01.md", "utf8"));
  expect(graph.edges).toEqual(drawn);
  expect(
    graph.edges.filter((edge) => edge.kind === "solid" && edge.label === null),
  ).toHaveLength(23);
  expect(
    graph.edges.filter((edge) => edge.kind === "solid" && edge.label !== null),
  ).toHaveLength(2);
  expect(graph.edges.filter((edge) => edge.kind === "dashed")).toHaveLength(2);
  expect(graph.nodes).toEqual([
    "ADP",
    "APP",
    "C",
    "DOM",
    "K",
    "MAIN",
    "PN",
    "PRE",
    "PV",
    "PY",
    "UI",
    "UK",
    "WC",
  ]);
});

it("ignores a split-header comment that contains an arrow", () => {
  const graph = parseMermaid(
    "<!-- oi-split-header -->\n<!-- /oi-split-header -->\n```mermaid\nUI --> C\n```\n",
  );
  expect(graph.edges).toEqual([solid("UI", "C")]);
});

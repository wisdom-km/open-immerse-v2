import type { MermaidEdge } from "./parse-mermaid.mjs";
import type { ReducedEdge, UnmappedEdge } from "./reduce.mjs";

export interface UndocumentedEdge {
  readonly from: string;
  readonly to: string;
  readonly example: string;
  readonly reason: "missing" | "value-import" | "bypasses-pure";
}

export interface PlannedEdge {
  readonly from: string;
  readonly to: string;
}

export interface GraphReport {
  readonly undocumented: readonly UndocumentedEdge[];
  readonly planned: readonly PlannedEdge[];
  readonly unmapped: readonly UnmappedEdge[];
}

export function compareGraph(
  drawn: { readonly edges: readonly MermaidEdge[] },
  reduced: {
    readonly edges: readonly ReducedEdge[];
    readonly unmapped: readonly UnmappedEdge[];
  },
): GraphReport;

export function renderReport(result: GraphReport): string;

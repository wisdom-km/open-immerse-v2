export interface MermaidEdge {
  readonly from: string;
  readonly to: string;
  readonly kind: "solid" | "dashed";
  readonly label: string | null;
}

export function parseMermaid(markdown: string): {
  readonly nodes: readonly string[];
  readonly edges: readonly MermaidEdge[];
};

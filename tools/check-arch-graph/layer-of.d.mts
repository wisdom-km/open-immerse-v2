export type LayerHit =
  | { readonly kind: "layer"; readonly id: string }
  | { readonly kind: "seam" }
  | { readonly kind: "excluded" }
  | { readonly kind: "external" }
  | { readonly kind: "unmapped" };

export function layerOf(ref: string): LayerHit;

export interface CruiseDependency {
  readonly module?: string;
  readonly resolved?: string;
  readonly dependencyTypes?: readonly string[];
  readonly coreModule?: boolean;
  readonly couldNotResolve?: boolean;
}

export interface CruiseModule {
  readonly source: string;
  readonly dependencies?: readonly CruiseDependency[];
}

export interface CruiseResult {
  readonly modules?: readonly CruiseModule[];
}

export interface ReducedEdge {
  readonly from: string;
  readonly to: string;
  readonly typeOnly: boolean;
  readonly viaPure: boolean;
  readonly example: string;
}

export interface UnmappedEdge {
  readonly from: string;
  readonly to: string;
  readonly example: string;
}

export function reduceCruise(
  cruise: CruiseResult,
  readText: (rel: string) => string,
): {
  readonly edges: readonly ReducedEdge[];
  readonly unmapped: readonly UnmappedEdge[];
};

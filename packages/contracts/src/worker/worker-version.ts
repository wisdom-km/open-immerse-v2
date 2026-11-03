import { Type, type TString } from "@sinclair/typebox";

// pattern and maxLength live only on this schema. Callers read those keywords.
export const workerVersionText: TString = Type.String({
  minLength: 1,
  pattern: "^\\S+$",
});

export type WorkerVersionLimits = {
  readonly minLength?: number;
  readonly maxLength?: number;
  readonly pattern?: string;
};

type LimitSource = {
  readonly minLength?: number;
  readonly maxLength?: number;
  readonly pattern?: string;
};

export function workerVersionLimits(schema: LimitSource): WorkerVersionLimits {
  const minLength = schema.minLength;
  const maxLength = schema.maxLength;
  const pattern = schema.pattern;
  return {
    ...(minLength === undefined ? {} : { minLength }),
    ...(maxLength === undefined ? {} : { maxLength }),
    ...(pattern === undefined ? {} : { pattern }),
  };
}

export function matchesWorkerVersion(value: string): boolean {
  const limits = workerVersionLimits(workerVersionText);
  if (limits.minLength !== undefined && value.length < limits.minLength) {
    return false;
  }
  if (limits.maxLength !== undefined && value.length > limits.maxLength) {
    return false;
  }
  if (limits.pattern !== undefined && !new RegExp(limits.pattern).test(value)) {
    return false;
  }
  return true;
}

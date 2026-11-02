import type { Result } from "./result.js";
import type { JobId, ReservationId } from "./ids.js";

export type BudgetAccount = Readonly<{
  vendorId: string;
  capability: string;
}>;

export type BudgetLimitKind = "amount" | "requests" | "pages" | "tokens";

export type BudgetRefusal =
  | Readonly<{
      code: "budget_exhausted";
      account: BudgetAccount;
      limitKind: BudgetLimitKind;
    }>
  | Readonly<{
      code: "budget_cap_unset";
      account: BudgetAccount;
    }>;

export type UsageAmount = number | "unknown";

export type UsageReport = Readonly<{
  requests: UsageAmount;
  pages: UsageAmount;
  tokens: UsageAmount;
}>;

export type BudgetEnvelope = Readonly<{
  maxRequests: number;
  maxTokens?: number;
}>;

export type ReserveRequest = Readonly<{
  vendorId: string;
  capability: string;
  jobId: JobId;
  requests: number;
  pages: number;
  tokens: number;
}>;

export type Reservation = Readonly<{
  id: ReservationId;
}>;

export interface BudgetGate {
  reserve(req: ReserveRequest): Promise<Result<Reservation, BudgetRefusal>>;
  settle(id: ReservationId, usage: UsageReport): Promise<void>;
  release(id: ReservationId): Promise<void>;
}

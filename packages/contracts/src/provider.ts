import type { UsageReport } from "./budget.js";
import type { AssetId } from "./ids.js";
import type { Result } from "./result.js";

declare const apiFormatBrand: unique symbol;
export type ApiFormat = string & { readonly [apiFormatBrand]: "ApiFormat" };

export type ModelCapabilities = Readonly<{
  chat: boolean;
  vision: boolean;
  ocr: boolean;
  scoring: boolean;
  streaming: boolean;
}>;

export type ModelPreset = Readonly<{
  modelId: string;
  displayName?: string;
  capabilities: ModelCapabilities;
  billingUnit: "token" | "request" | "page" | "unknown";
  contextTokens?: number;
}>;

export type ProviderDescriptor = Readonly<{
  vendorId: string;
  format: ApiFormat;
  baseUrl: string;
  modelId: string;
  capabilities: ModelCapabilities;
  credentialSlot: string;
}>;

export type ChatPart =
  | Readonly<{ type: "text"; text: string }>
  | Readonly<{ type: "image"; assetId: AssetId; mediaType: "image/png" | "image/jpeg" }>;

export type ChatRequest = Readonly<{
  messages: ReadonlyArray<
    Readonly<{ role: "system" | "user" | "assistant"; parts: readonly ChatPart[] }>
  >;
  maxOutputTokens: number;
  stream: boolean;
}>;

export type ChatChunk = Readonly<{
  textDelta: string;
  done: boolean;
  usage?: UsageReport;
}>;

export type OcrRequest = Readonly<{
  assetId: AssetId;
}>;

export type OcrResult = Readonly<{
  lines: readonly Readonly<{ text: string }>[];
}>;

export type ProviderFailure = Readonly<{
  kind:
    | "auth"
    | "quota"
    | "rate_limited"
    | "invalid_request"
    | "too_large"
    | "service_failed"
    | "timeout";
  retryable: boolean;
  retryAfterMs: number | null;
  httpStatus: number | null;
  vendorCode: string | null;
  requestId: string | null;
}>;

export interface ProviderAuthorizer {
  authorize(
    req: Readonly<{ vendorId: string; host: string; slot: string }>,
  ): Promise<Result<Readonly<Record<string, string>>, "host_not_allowed" | "secret_missing">>;
}

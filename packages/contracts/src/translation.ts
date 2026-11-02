import type { AssetId, BlockId, DocumentId, PageRevisionId } from "./ids.js";

export type StoredTranslationBlock = Readonly<{
  documentId: DocumentId;
  revisionId: PageRevisionId;
  sourceBlockId: BlockId;
  blockKind: "paragraph" | "heading" | "caption" | "footnote" | "list_item" | "quote";
  version: number;
  status: "success" | "failed" | "retranslating";
  failureKind: "check_failed" | "network" | "model_error" | null;
  markdown: string | null;
  crops: readonly FormulaCropRef[];
  formatVersion: "oi-md/1";
  model: Readonly<{ providerId: string; modelId: string }>;
  targetLang: "zh-CN";
  cacheKey: string;
  formulaDigest: string;
  check: Readonly<{ result: "passed" | "failed" | "not_run"; codes: readonly string[] }>;
  updatedAt: string;
}>;

export type FormulaCropRef =
  | Readonly<{
      fragmentId: string;
      at: number;
      display: "inline" | "block";
      kind: "crop";
      assetId: AssetId;
    }>
  | Readonly<{
      fragmentId: string;
      at: number;
      display: "inline" | "block";
      kind: "page_link";
      page: number;
    }>;

export type TranslationBlockChanged = Readonly<{
  documentId: DocumentId;
  revisionId: PageRevisionId;
  sourceBlockId: BlockId;
  status: StoredTranslationBlock["status"];
  version: number;
  failureKind: StoredTranslationBlock["failureKind"];
}>;

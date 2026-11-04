import type { AssetId } from "./ids.js";
import type { Result } from "./result.js";

export type FormulaCropDisplay = "inline" | "block";

export type MdFormulaCrop =
  | Readonly<{
      type: "formula_crop";
      display: FormulaCropDisplay;
      assetId: AssetId;
      fragmentId: string;
    }>
  | Readonly<{
      type: "formula_crop";
      display: FormulaCropDisplay;
      kind: "page_link";
      page: number;
      fragmentId: string;
    }>;

export type SourceSpan = Readonly<{
  start: number;
  end: number;
}>;

export type MdContext = "note" | "translation" | "answer";

export type MdMathBlocked = "untrusted_command" | "too_long";

export type MdHeading = Readonly<{
  id: string;
  level: 1 | 2 | 3 | 4 | 5 | 6;
  text: string;
  src: SourceSpan;
}>;

export type MdImageRef = Readonly<{
  alt: string;
  destination: string;
  assetId: null;
}>;

export type MdInline =
  | Readonly<{ t: "text"; v: string; src: SourceSpan }>
  | Readonly<{
      t: "em" | "strong" | "del";
      c: readonly MdInline[];
      src: SourceSpan;
    }>
  | Readonly<{ t: "code"; v: string; src: SourceSpan }>
  | Readonly<{
      t: "math";
      tex: string;
      src: SourceSpan;
      blocked?: MdMathBlocked;
    }>
  | Readonly<{
      t: "link";
      destination: string;
      c: readonly MdInline[];
      src: SourceSpan;
    }>
  | Readonly<{ t: "image"; image: MdImageRef; src: SourceSpan }>
  | Readonly<{ t: "br"; src: SourceSpan }>
  | Readonly<{
      t: "wikilink";
      target: string;
      embed: boolean;
      src: SourceSpan;
      alias?: string;
      heading?: string;
    }>
  | Readonly<{ t: "footnote_ref"; identifier: string; src: SourceSpan }>
  | Readonly<{ t: "html_blocked"; raw: string; src: SourceSpan }>;

export type MdListItem = Readonly<{
  blocks: readonly MdBlock[];
  src: SourceSpan;
  checked?: boolean;
}>;

export type MdTableAlign = "l" | "c" | "r" | null;

export type MdBlock =
  | Readonly<{
      t: "heading";
      level: 1 | 2 | 3 | 4 | 5 | 6;
      id: string;
      inline: readonly MdInline[];
      src: SourceSpan;
    }>
  | Readonly<{ t: "paragraph"; inline: readonly MdInline[]; src: SourceSpan }>
  | Readonly<{
      t: "list";
      ordered: boolean;
      items: readonly MdListItem[];
      src: SourceSpan;
      start?: number;
    }>
  | Readonly<{
      t: "quote";
      blocks: readonly MdBlock[];
      src: SourceSpan;
      callout?: string;
    }>
  | Readonly<{
      t: "code";
      lang: string | null;
      code: string;
      src: SourceSpan;
    }>
  | Readonly<{
      t: "math";
      tex: string;
      src: SourceSpan;
      blocked?: MdMathBlocked;
    }>
  | Readonly<{
      t: "table";
      align: readonly MdTableAlign[];
      head: readonly (readonly MdInline[])[];
      rows: readonly (readonly (readonly MdInline[])[])[];
      src: SourceSpan;
    }>
  | Readonly<{ t: "image"; image: MdImageRef; src: SourceSpan }>
  | Readonly<{ t: "hr"; src: SourceSpan }>
  | Readonly<{ t: "html_blocked"; raw: string; src: SourceSpan }>
  | Readonly<{
      t: "footnote_def";
      identifier: string;
      blocks: readonly MdBlock[];
      src: SourceSpan;
    }>
  | Readonly<{ t: "formula_crop"; crop: MdFormulaCrop; src: SourceSpan }>;

export type MdDocument = Readonly<{
  fileId: string | null;
  title: string;
  revision: string;
  blocks: readonly MdBlock[];
  headings: readonly MdHeading[];
  links: readonly [];
  truncated: boolean;
}>;

export type MdDocumentWindow = Readonly<{
  fileId: string | null;
  revision: string;
  blockCount: number;
  outline: readonly MdHeading[];
  from: number;
  blocks: readonly MdBlock[];
}>;

export type MdFileId = string;
export type MdVaultId = string;

export type MdSource =
  | Readonly<{ kind: "file"; fileId: MdFileId }>
  | Readonly<{ kind: "vault"; vaultId: MdVaultId; fileId: MdFileId }>;

export type MdEdit = Readonly<{
  src: SourceSpan;
  insert: string;
}>;

export type MdWriteErrorCode =
  | "write_disabled"
  | "revision_conflict"
  | "outside_vault"
  | "read_only_fs";

export type MdWriteError = Readonly<{
  code: MdWriteErrorCode;
  message: string;
}>;

export type WriteFileInput = Readonly<{
  source: MdSource;
  baseRevision: string;
  edits: readonly MdEdit[];
}>;

export type WriteFileResult = Result<
  Readonly<{ revision: string; doc: MdDocument }>,
  MdWriteError
>;

export type MdCapabilities = Readonly<{
  canWrite: boolean;
}>;

export type MdWriteSignal = Readonly<{
  readonly aborted: boolean;
}>;

export type MdFileWriter = Readonly<{
  write: (
    path: string,
    text: string,
    signal: MdWriteSignal,
  ) => Promise<Result<void, MdWriteError>>;
}>;

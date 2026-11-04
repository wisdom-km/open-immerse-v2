import { expectTypeOf, it } from "vitest";

import type { Result } from "../src/result.js";
import type {
  MdBlock,
  MdCapabilities,
  MdDocument,
  MdDocumentWindow,
  MdEdit,
  MdFileWriter,
  MdFormulaCrop,
  MdInline,
  MdMathBlocked,
  MdWriteError,
  MdWriteErrorCode,
  SourceSpan,
  WriteFileInput,
  WriteFileResult,
} from "../src/markdown.js";

type Quote = Extract<MdBlock, { t: "quote" }>;
type FootnoteDef = Extract<MdBlock, { t: "footnote_def" }>;
type FootnoteRef = Extract<MdInline, { t: "footnote_ref" }>;
type CropBlock = Extract<MdBlock, { t: "formula_crop" }>;
type MathInline = Extract<MdInline, { t: "math" }>;
type HasTag<Tag extends string> = Tag extends MdBlock["t"] | MdInline["t"]
  ? true
  : false;

it("gives every quote an optional callout type and a source span", () => {
  expectTypeOf<Quote["callout"]>().toEqualTypeOf<string | undefined>();
  expectTypeOf<Quote["src"]>().toEqualTypeOf<SourceSpan>();
  expectTypeOf<HasTag<"highlight">>().toEqualTypeOf<false>();
});

it("types footnote references and definitions", () => {
  expectTypeOf<FootnoteRef["identifier"]>().toEqualTypeOf<string>();
  expectTypeOf<FootnoteDef["blocks"]>().toEqualTypeOf<readonly MdBlock[]>();
});

it("wraps a formula crop with a source span and leaves the crop type intact", () => {
  expectTypeOf<CropBlock["crop"]>().toEqualTypeOf<MdFormulaCrop>();
  expectTypeOf<CropBlock["src"]>().toEqualTypeOf<SourceSpan>();
});

it("limits math blocking to untrusted commands and length", () => {
  expectTypeOf<MathInline["blocked"]>().toEqualTypeOf<
    MdMathBlocked | undefined
  >();
});

it("keeps resolved links empty until link resolution exists", () => {
  expectTypeOf<MdDocument["links"]>().toEqualTypeOf<readonly []>();
  expectTypeOf<MdDocument["fileId"]>().toEqualTypeOf<string | null>();
});

it("types a block window without a byte budget", () => {
  expectTypeOf<MdDocumentWindow["from"]>().toEqualTypeOf<number>();
  expectTypeOf<MdDocumentWindow["blockCount"]>().toEqualTypeOf<number>();
  expectTypeOf<MdDocumentWindow["blocks"]>().toEqualTypeOf<
    readonly MdBlock[]
  >();
});

it("reserves write types and the write_disabled code", () => {
  expectTypeOf<WriteFileInput["baseRevision"]>().toEqualTypeOf<string>();
  expectTypeOf<WriteFileInput["edits"][number]>().toEqualTypeOf<MdEdit>();
  type HasDisabled = "write_disabled" extends MdWriteErrorCode ? true : false;
  expectTypeOf<HasDisabled>().toEqualTypeOf<true>();
  expectTypeOf<WriteFileResult>().toEqualTypeOf<
    Result<Readonly<{ revision: string; doc: MdDocument }>, MdWriteError>
  >();
  expectTypeOf<MdCapabilities["canWrite"]>().toEqualTypeOf<boolean>();
  expectTypeOf<MdFileWriter["write"]>().toBeFunction();
});

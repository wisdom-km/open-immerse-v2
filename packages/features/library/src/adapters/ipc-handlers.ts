import type {
  LibraryIpcDeps,
  LibraryIpcHandlers,
} from "../application/library-ipc.js";
import type { ImportPdf } from "../application/use-cases/import-pdf.js";
import type { RelocateSource } from "../application/use-cases/relocate-source.js";

type HandlerResult<Name extends keyof LibraryIpcHandlers> = Awaited<
  ReturnType<LibraryIpcHandlers[Name]>
>;

export function createLibraryIpcHandlers(
  deps: LibraryIpcDeps,
): LibraryIpcHandlers {
  return {
    import(input) {
      return Promise.resolve(runImport(deps, input));
    },
    importDropped(absolutePath) {
      return Promise.resolve(runDropped(deps, absolutePath));
    },
    list(input) {
      return Promise.resolve(runList(deps, input));
    },
    relocate(input) {
      return Promise.resolve(runRelocate(deps, input));
    },
  };
}

function runImport(
  deps: LibraryIpcDeps,
  input: Parameters<LibraryIpcHandlers["import"]>[0],
): HandlerResult<"import"> {
  if (!isPayload(input)) {
    return threw();
  }
  const picked = deps.pickPdf.pick();
  if (picked.kind === "cancelled") {
    return deny("cancelled");
  }
  return mapImport(deps.importPdf(picked.filePath));
}

function runDropped(
  deps: LibraryIpcDeps,
  absolutePath: string,
): HandlerResult<"importDropped"> {
  return mapDropped(deps.importPdf(absolutePath));
}

function runList(
  deps: LibraryIpcDeps,
  input: Parameters<LibraryIpcHandlers["list"]>[0],
): HandlerResult<"list"> {
  const listed = deps.listLibrary(input);
  if (!listed.ok) {
    return threw();
  }
  return { ok: true, value: listed.value };
}

function runRelocate(
  deps: LibraryIpcDeps,
  input: Parameters<LibraryIpcHandlers["relocate"]>[0],
): HandlerResult<"relocate"> {
  const picked = deps.pickPdf.pick();
  if (picked.kind === "cancelled") {
    return deny("cancelled");
  }
  return mapRelocate(
    deps.relocateSource({ id: input.id, filePath: picked.filePath }),
  );
}

function mapImport(imported: ReturnType<ImportPdf>): HandlerResult<"import"> {
  if (imported.ok) {
    return { ok: true, value: imported.value };
  }
  switch (imported.error.code) {
    case "cancelled":
    case "not_pdf":
    case "hash_mismatch":
      return deny(imported.error.code);
    case "not_found":
    case "rejected":
      return threw();
    default:
      return assertNever(imported.error.code);
  }
}

function mapDropped(
  imported: ReturnType<ImportPdf>,
): HandlerResult<"importDropped"> {
  if (imported.ok) {
    return { ok: true, value: imported.value };
  }
  switch (imported.error.code) {
    case "not_pdf":
    case "hash_mismatch":
      return deny(imported.error.code);
    case "cancelled":
    case "not_found":
    case "rejected":
      return threw();
    default:
      return assertNever(imported.error.code);
  }
}

function mapRelocate(
  relocated: ReturnType<RelocateSource>,
): HandlerResult<"relocate"> {
  if (relocated.ok) {
    return { ok: true, value: relocated.value };
  }
  switch (relocated.error.code) {
    case "not_found":
    case "cancelled":
    case "not_pdf":
    case "hash_mismatch":
      return deny(relocated.error.code);
    case "rejected":
      return threw();
    default:
      return assertNever(relocated.error.code);
  }
}

function deny<Code extends string>(
  code: Code,
): {
  readonly ok: false;
  readonly error: { readonly code: Code; readonly retryable: false };
} {
  return { ok: false, error: { code, retryable: false } };
}

function threw(): {
  readonly ok: false;
  readonly error: { readonly code: "handler_threw"; readonly retryable: true };
} {
  return { ok: false, error: { code: "handler_threw", retryable: true } };
}

function isPayload(input: unknown): boolean {
  return typeof input === "object" && input !== null;
}

function assertNever(value: never): never {
  throw new Error(typeof value);
}

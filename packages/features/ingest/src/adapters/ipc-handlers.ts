import type {
  IngestIpcDeps,
  IngestIpcHandlers,
} from "../application/ingest-ipc.js";

type HandlerResult = Awaited<ReturnType<IngestIpcHandlers["openDocument"]>>;

export function createIngestIpcHandlers(
  deps: IngestIpcDeps,
): IngestIpcHandlers {
  return {
    openDocument(input) {
      return Promise.resolve(runOpen(deps, input));
    },
  };
}

function runOpen(
  deps: IngestIpcDeps,
  input: Parameters<IngestIpcHandlers["openDocument"]>[0],
): HandlerResult {
  if (!isIdPayload(input)) {
    return invalidPayload();
  }
  const opened = deps.openDocument({ id: input.id });
  if (opened.ok) {
    return { ok: true, value: { jobId: opened.value.jobId } };
  }
  switch (opened.error.code) {
    case "not_found":
      return deny("not_found");
    case "rejected":
      return threw();
    default:
      return assertNever(opened.error.code);
  }
}

function isIdPayload(input: unknown): input is { readonly id: string } {
  if (typeof input !== "object" || input === null || !("id" in input)) {
    return false;
  }
  return typeof input.id === "string";
}

function deny(code: "not_found"): HandlerResult {
  return { ok: false, error: { code, retryable: false } };
}

function invalidPayload(): HandlerResult {
  return { ok: false, error: { code: "invalid_payload", retryable: false } };
}

function threw(): HandlerResult {
  return { ok: false, error: { code: "handler_threw", retryable: true } };
}

function assertNever(value: never): never {
  throw new Error(typeof value);
}

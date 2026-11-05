import type {
  ReaderIpcDeps,
  ReaderIpcHandlers,
} from "../application/reader-ipc.js";

type HandlerResult = Awaited<ReturnType<ReaderIpcHandlers["setZoom"]>>;

export function createReaderIpcHandlers(
  deps: ReaderIpcDeps,
): ReaderIpcHandlers {
  return {
    setZoom(input) {
      return Promise.resolve(runSetZoom(deps, input));
    },
  };
}

function runSetZoom(
  deps: ReaderIpcDeps,
  input: Parameters<ReaderIpcHandlers["setZoom"]>[0],
): HandlerResult {
  const result = deps.setZoom({ id: input.id, level: input.level });
  if (result.ok) {
    return { ok: true, value: { level: result.value.level } };
  }
  switch (result.error.code) {
    case "not_found":
      return deny("not_found");
    case "invalid_level":
      return deny("invalid_payload");
    case "not_pdf":
    case "rejected":
      return threw();
    default:
      return assertNever(result.error.code);
  }
}

function deny(code: "not_found" | "invalid_payload"): HandlerResult {
  return { ok: false, error: { code, retryable: false } };
}

function threw(): HandlerResult {
  return { ok: false, error: { code: "handler_threw", retryable: true } };
}

function assertNever(value: never): never {
  throw new Error(typeof value);
}

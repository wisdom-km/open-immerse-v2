export type SchemeBody = Uint8Array | null;

export type SchemeResponseInit = {
  status: number;
  headers: Record<string, string>;
};

type ResponseFactory = new (
  body: SchemeBody,
  init: SchemeResponseInit,
) => object;

export function schemeResponse(
  body: SchemeBody,
  init: SchemeResponseInit,
): object {
  return new (responseFactory())(body, init);
}

function responseFactory(): ResponseFactory {
  const host: unknown = globalThis;
  if (typeof host !== "object" || host === null) {
    throw new Error("scheme response constructor is missing");
  }
  const candidate = (host as Record<string, unknown>).Response;
  if (typeof candidate !== "function") {
    throw new Error("scheme response constructor is missing");
  }
  return candidate as ResponseFactory;
}

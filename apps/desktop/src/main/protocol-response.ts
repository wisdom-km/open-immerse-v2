import { schemeResponse } from "./scheme-response.js";
import { CONTENT_SECURITY_POLICY } from "./security/csp.js";
import { bodyForMethod, resolveStaticFile } from "./static-file.js";

export function respond(root: string, requestUrl: string, method: string): Response {
  const resolved = resolveStaticFile(root, requestUrl, method);
  if (resolved.kind === "method") {
    return schemeResponse(null, { status: 405, headers: headers("text/plain; charset=utf-8") }) as Response;
  }
  if (resolved.kind === "missing") {
    return schemeResponse(null, { status: 404, headers: headers("text/plain; charset=utf-8") }) as Response;
  }
  return schemeResponse(bodyForMethod(method, resolved.body), {
    status: 200,
    headers: headers(resolved.contentType),
  }) as Response;
}

function headers(contentType: string): Record<string, string> {
  return {
    "Content-Type": contentType,
    "Content-Security-Policy": CONTENT_SECURITY_POLICY,
  };
}

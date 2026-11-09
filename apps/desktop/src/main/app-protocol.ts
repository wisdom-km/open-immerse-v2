import { protocol } from "electron";

import { respond } from "./protocol-response.js";

const SCHEME = "oi-app";
const ASSET_SCHEME = "oi-asset";

export function registerAppScheme(): void {
  protocol.registerSchemesAsPrivileged([
    { scheme: SCHEME, privileges: { standard: true, secure: true } },
    { scheme: ASSET_SCHEME, privileges: { standard: true, secure: true } },
  ]);
}

export function handleAppProtocol(rendererRoot: string): void {
  protocol.handle(SCHEME, (request) =>
    respond(rendererRoot, request.url, request.method),
  );
}

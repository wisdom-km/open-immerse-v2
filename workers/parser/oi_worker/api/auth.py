"""Require the launch bearer on every HTTP request, including health.

Non-HTTP scopes are forwarded unchanged. A matching request is forwarded with
the original receive and send callables, so a later SSE route can flush each
chunk. ARCHITECTURE §10.1 and §10.2.
"""

import hashlib
import hmac

from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.types import ASGIApp, Receive, Scope, Send

AUTH_CODE = "auth.bearer"
UNAUTHORIZED = 401


class LaunchBearerMiddleware:
    def __init__(self, app: ASGIApp, token: str) -> None:
        self._app = app
        self._token = token

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self._app(scope, receive, send)
            return
        denied = authorization_failure(Request(scope), self._token)
        if denied is not None:
            await denied(scope, receive, send)
            return
        await self._app(scope, receive, send)


def authorization_failure(request: Request, token: str) -> JSONResponse | None:
    if bearer_matches(token, request.headers.get("authorization")):
        return None
    return JSONResponse(status_code=UNAUTHORIZED, content={"code": AUTH_CODE})


def bearer_matches(expected: str, header: str | None) -> bool:
    presented = _bearer_value(header)
    return hmac.compare_digest(_digest(expected), _digest(presented))


def _bearer_value(header: str | None) -> str:
    if header is None:
        return ""
    scheme, separator, value = header.partition(" ")
    if separator != " " or scheme.lower() != "bearer" or value == "" or " " in value:
        return ""
    return value


def _digest(value: str) -> bytes:
    return hashlib.sha256(value.encode("utf-8")).digest()

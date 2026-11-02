"""Require the launch bearer on every request, including health. ARCHITECTURE §10.1."""

import hashlib
import hmac
from collections.abc import Awaitable, Callable

from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
from starlette.types import ASGIApp

AUTH_CODE = "auth.bearer"
UNAUTHORIZED = 401


class LaunchBearerMiddleware(BaseHTTPMiddleware):
    def __init__(self, app: ASGIApp, token: str) -> None:
        super().__init__(app)
        self._token = token

    async def dispatch(
        self,
        request: Request,
        call_next: Callable[[Request], Awaitable[Response]],
    ) -> Response:
        denied = authorization_failure(request, self._token)
        if denied is not None:
            return denied
        return await call_next(request)


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

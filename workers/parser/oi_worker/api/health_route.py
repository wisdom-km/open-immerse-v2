"""HTTP adapter for GET /v1/health. The exchange stays in health.py."""

from fastapi import Request
from fastapi.responses import JSONResponse

from oi_worker.api.health import HEALTH_METHOD, HEALTH_PATH, HealthRequest, exchange_health
from oi_worker.api.protocol_error import ProtocolVersionError
from oi_worker.api.protocol_http import protocol_version_response

HEADER_NAME = "OI-Protocol"


def respond_health(request: Request, mode: str) -> JSONResponse:
    try:
        exchange = exchange_health(
            HealthRequest(
                method=HEALTH_METHOD,
                path=HEALTH_PATH,
                header=request.headers.get(HEADER_NAME),
                mode=mode,
            )
        )
    except ProtocolVersionError:
        return protocol_version_response()
    return JSONResponse(status_code=exchange.status, content=exchange.body)

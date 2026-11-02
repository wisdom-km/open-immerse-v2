"""HTTP adapter for GET /v1/health. The exchange stays in health.py."""

from fastapi import Request
from fastapi.responses import JSONResponse

from oi_worker.api.health import HEALTH_METHOD, HEALTH_PATH, HealthRequest, exchange_health
from oi_worker.api.protocol_http import protocol_error_response

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
    except ValueError as exc:
        response = protocol_error_response(exc)
        if response is None:
            raise
        return response
    return JSONResponse(status_code=exchange.status, content=exchange.body)

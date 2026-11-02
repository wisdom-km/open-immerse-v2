"""Assemble the worker ASGI app. Health is the only route."""

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from oi_worker.api.health_route import respond_health


def create_app(mode: str) -> FastAPI:
    app = FastAPI(docs_url=None, redoc_url=None, openapi_url=None)

    def get_health(request: Request) -> JSONResponse:
        return respond_health(request, mode)

    app.add_api_route("/v1/health", get_health, methods=["GET"])
    return app

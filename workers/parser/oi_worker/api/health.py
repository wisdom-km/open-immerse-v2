"""GET /v1/health. ARCHITECTURE §10.2 and §10.4.

Builds the health document and the 426 body. Does not open a socket, read a
credential, or call a model. `mode` is the process deployment (`local` or
`server`), not which model backend would run later.
"""

from dataclasses import dataclass

from oi_worker.api.package_version import package_version
from oi_worker.api.protocol_version import IMPLEMENTED_PROTOCOL, gate_header
from oi_worker.protocol.health import HealthResponse

HEALTH_METHOD = "GET"
HEALTH_PATH = "/v1/health"


@dataclass(frozen=True, slots=True)
class HealthRequest:
    method: str
    path: str
    header: object
    mode: str


@dataclass(frozen=True, slots=True)
class HealthExchange:
    status: int
    body: dict[str, str] | dict[str, list[str]]


def health_response(mode: str) -> HealthResponse:
    return HealthResponse.model_validate(
        {
            "protocol": IMPLEMENTED_PROTOCOL,
            "workerVersion": package_version(),
            "mode": mode,
        }
    )


def exchange_health(request: HealthRequest) -> HealthExchange:
    if request.method != HEALTH_METHOD or request.path != HEALTH_PATH:
        raise ValueError("health.route")
    rejected = gate_header(request.header)
    if rejected is not None:
        return HealthExchange(status=426, body=rejected)
    return HealthExchange(status=200, body=dump_health(health_response(request.mode)))


def dump_health(document: HealthResponse) -> dict[str, str]:
    raw = document.model_dump(mode="json", by_alias=True)
    body: dict[str, str] = {}
    for key in ("protocol", "workerVersion", "mode"):
        value = raw.get(key)
        if not isinstance(value, str):
            raise ValueError("health.document")
        body[key] = value
    return body

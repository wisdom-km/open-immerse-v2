"""GET /v1/health. ARCHITECTURE §10.2 and §10.4.

Builds the health document and the 426 body. Does not open a socket, read a
credential, or call a model. `mode` is the process deployment (`local` or
`server`), not which model backend would run later.
"""

from dataclasses import dataclass
from typing import Literal, TypeAlias, TypedDict

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


class HealthOkBody(TypedDict):
    protocol: str
    workerVersion: str
    mode: str


class UnsupportedBody(TypedDict):
    supported: list[str]


@dataclass(frozen=True, slots=True)
class HealthReady:
    status: Literal[200]
    body: HealthOkBody


@dataclass(frozen=True, slots=True)
class HealthOutOfRange:
    status: Literal[426]
    body: UnsupportedBody


HealthExchange: TypeAlias = HealthReady | HealthOutOfRange


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
        return HealthOutOfRange(status=426, body=_unsupported_body(rejected))
    return HealthReady(status=200, body=dump_health(health_response(request.mode)))


def dump_health(document: HealthResponse) -> HealthOkBody:
    raw = document.model_dump(mode="json", by_alias=True)
    protocol = raw.get("protocol")
    worker_version = raw.get("workerVersion")
    mode = raw.get("mode")
    if (
        not isinstance(protocol, str)
        or not isinstance(worker_version, str)
        or not isinstance(mode, str)
    ):
        raise ValueError("health.document")
    body: HealthOkBody = {
        "protocol": protocol,
        "workerVersion": worker_version,
        "mode": mode,
    }
    return body


def _unsupported_body(rejected: dict[str, list[str]]) -> UnsupportedBody:
    supported = rejected.get("supported")
    if supported is None:
        raise ValueError("unsupported.supported")
    return {"supported": supported}

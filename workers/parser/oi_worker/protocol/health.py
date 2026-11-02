"""Health document for GET /v1/health. ARCHITECTURE §10.2 and §10.4."""

from dataclasses import dataclass
from typing import Literal, cast

from oi_worker.protocol.version import parse_protocol_version

WorkerMode = Literal["local", "server"]
_VERSION_CHARS = frozenset("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz._+-")
_MAX_WORKER_VERSION = 64


@dataclass(frozen=True, slots=True)
class HealthResponse:
    protocol: str
    worker_version: str
    mode: WorkerMode


def parse_health(payload: object) -> HealthResponse:
    data = _object(payload)
    return HealthResponse(
        protocol=_protocol(data),
        worker_version=_worker_version(data),
        mode=_mode(data),
    )


def dump_health(document: HealthResponse) -> dict[str, str]:
    return {
        "protocol": document.protocol,
        "workerVersion": document.worker_version,
        "mode": document.mode,
    }


def _object(payload: object) -> dict[str, object]:
    if not isinstance(payload, dict):
        raise ValueError("health.not_object")
    return cast(dict[str, object], payload)


def _protocol(data: dict[str, object]) -> str:
    if "protocol" not in data:
        raise ValueError("health.protocol")
    try:
        return parse_protocol_version(data["protocol"]).text()
    except ValueError:
        raise ValueError("health.protocol") from None


def _worker_version(data: dict[str, object]) -> str:
    if "workerVersion" not in data:
        raise ValueError("health.worker_version")
    value = data["workerVersion"]
    if not isinstance(value, str) or not _version_text(value):
        raise ValueError("health.worker_version")
    return value


def _version_text(value: str) -> bool:
    if len(value) == 0 or len(value) > _MAX_WORKER_VERSION:
        return False
    return all(character in _VERSION_CHARS for character in value)


def _mode(data: dict[str, object]) -> WorkerMode:
    if "mode" not in data:
        raise ValueError("health.mode")
    value = data["mode"]
    if value == "local":
        return "local"
    if value == "server":
        return "server"
    raise ValueError("health.mode")

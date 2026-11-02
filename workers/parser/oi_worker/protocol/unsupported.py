"""426 body listing protocol versions this worker implements. ARCHITECTURE §10.4."""

from dataclasses import dataclass
from typing import cast

from oi_worker.protocol.version import parse_protocol_version


@dataclass(frozen=True, slots=True)
class UnsupportedProtocol:
    supported: tuple[str, ...]


def parse_unsupported(payload: object) -> UnsupportedProtocol:
    data = _object(payload)
    return UnsupportedProtocol(supported=_supported(data))


def dump_unsupported(document: UnsupportedProtocol) -> dict[str, list[str]]:
    return {"supported": list(document.supported)}


def _object(payload: object) -> dict[str, object]:
    if not isinstance(payload, dict):
        raise ValueError("unsupported.not_object")
    return cast(dict[str, object], payload)


def _supported(data: dict[str, object]) -> tuple[str, ...]:
    if "supported" not in data:
        raise ValueError("unsupported.supported")
    raw = data["supported"]
    if not isinstance(raw, list):
        raise ValueError("unsupported.supported")
    items = cast(list[object], raw)
    if len(items) == 0:
        raise ValueError("unsupported.supported")
    return tuple(_one(item) for item in items)


def _one(item: object) -> str:
    try:
        return parse_protocol_version(item).text()
    except ValueError:
        raise ValueError("unsupported.supported") from None

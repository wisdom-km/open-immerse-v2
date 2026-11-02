"""Decide whether an OI-Protocol header may proceed. ARCHITECTURE §10.4."""

from typing import cast

from pydantic import ValidationError

from oi_worker.api.protocol_error import ProtocolVersionError
from oi_worker.protocol.protocol_header import ProtocolHeader
from oi_worker.protocol.unsupported import UnsupportedProtocol

IMPLEMENTED_PROTOCOL = "1.0"
SUPPORTED_MAJORS = frozenset({1})


def gate_header(header: object) -> dict[str, list[str]] | None:
    if _major(parse_protocol_header(header)) in SUPPORTED_MAJORS:
        return None
    document = UnsupportedProtocol.model_validate({"supported": [IMPLEMENTED_PROTOCOL]})
    return dump_unsupported(document)


def parse_protocol_header(value: object) -> str:
    if not isinstance(value, str):
        raise ProtocolVersionError
    try:
        document = ProtocolHeader.model_validate({"header": value})
    except ValidationError:
        raise ProtocolVersionError from None
    return document.header


def _major(header: str) -> int:
    return int(header.split(".", 1)[0])


def dump_unsupported(document: UnsupportedProtocol) -> dict[str, list[str]]:
    raw = document.model_dump(mode="json")
    supported = raw.get("supported")
    if not isinstance(supported, list):
        raise ValueError("unsupported.supported")
    return {"supported": _strings(cast(list[object], supported))}


def _strings(items: list[object]) -> list[str]:
    versions: list[str] = []
    for item in items:
        if not isinstance(item, str):
            raise ValueError("unsupported.supported")
        versions.append(item)
    return versions

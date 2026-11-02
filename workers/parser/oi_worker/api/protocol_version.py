"""Decide whether an OI-Protocol header may proceed. ARCHITECTURE §10.4."""

from oi_worker.protocol.unsupported import dump_unsupported, parse_unsupported
from oi_worker.protocol.version import parse_protocol_version

IMPLEMENTED_PROTOCOL = "1.0"
SUPPORTED_MAJORS = frozenset({1})


def gate_header(header: object) -> dict[str, list[str]] | None:
    version = parse_protocol_version(header)
    if version.major in SUPPORTED_MAJORS:
        return None
    document = parse_unsupported({"supported": [IMPLEMENTED_PROTOCOL]})
    return dump_unsupported(document)

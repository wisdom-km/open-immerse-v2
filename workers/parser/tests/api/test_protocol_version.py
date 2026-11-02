"""OI-Protocol header gate."""

import pytest

from oi_worker.api.protocol_error import ProtocolVersionError
from oi_worker.api.protocol_version import gate_header, parse_protocol_header
from oi_worker.protocol.protocol_header import ProtocolHeader


def test_allows_the_call_when_the_major_is_supported() -> None:
    assert gate_header("1.0") is None
    assert parse_protocol_header("1.0") == "1.0"


def test_ac_66_allows_the_call_when_the_minor_is_newer() -> None:
    assert gate_header("1.4") is None
    assert parse_protocol_header("1.9") == "1.9"


def test_accepts_unknown_fields_when_the_header_document_has_them() -> None:
    document = ProtocolHeader.model_validate({"header": "1.0", "unspecified": True})
    assert document.model_dump(mode="json") == {"header": "1.0"}


def test_ac_66_returns_426_body_when_the_major_is_unsupported() -> None:
    assert gate_header("2.0") == {"supported": ["1.0"]}


@pytest.mark.parametrize(
    "value",
    ["1", "1.0.0", "01.0", "1.00", "", "1.0 ", " v1.0", "1.", ".0", 1, None, True],
)
def test_rejects_a_header_when_it_is_not_a_version(value: object) -> None:
    with pytest.raises(ProtocolVersionError):
        parse_protocol_header(value)
    with pytest.raises(ProtocolVersionError):
        gate_header(value)

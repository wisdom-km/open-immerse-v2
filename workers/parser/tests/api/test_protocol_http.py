"""HTTP mapping for a missing or malformed OI-Protocol header."""

import pytest
from fastapi.responses import JSONResponse

from oi_worker.api.protocol_http import MALFORMED_PROTOCOL_STATUS, protocol_error_response


def test_returns_400_when_the_error_is_protocol_version() -> None:
    response = protocol_error_response(ValueError("protocol.version"))
    assert isinstance(response, JSONResponse)
    assert response.status_code == MALFORMED_PROTOCOL_STATUS
    assert response.body == b'{"error":"protocol.version"}'


def test_leaves_other_value_errors_unmapped() -> None:
    assert protocol_error_response(ValueError("health.route")) is None


def test_body_has_no_path_or_key_when_the_header_is_rejected() -> None:
    response = protocol_error_response(ValueError("protocol.version"))
    assert response is not None
    text = bytes(response.body).decode("utf-8")
    assert "/" not in text
    assert "\\" not in text
    assert "key" not in text.lower()


@pytest.mark.parametrize("message", ["protocol.version ", "Protocol.version", ""])
def test_leaves_a_near_miss_unmapped(message: str) -> None:
    assert protocol_error_response(ValueError(message)) is None

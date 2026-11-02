"""HTTP mapping for a missing or malformed OI-Protocol header."""

from fastapi.responses import JSONResponse

from oi_worker.api.protocol_http import MALFORMED_PROTOCOL_STATUS, protocol_version_response


def test_returns_400_when_the_protocol_header_is_rejected() -> None:
    response = protocol_version_response()
    assert isinstance(response, JSONResponse)
    assert response.status_code == MALFORMED_PROTOCOL_STATUS
    assert bytes(response.body).decode("utf-8") == '{"code":"protocol.version"}'


def test_body_has_no_path_or_key_when_the_header_is_rejected() -> None:
    text = bytes(protocol_version_response().body).decode("utf-8")
    assert "/" not in text
    assert "\\" not in text
    assert "key" not in text.lower()

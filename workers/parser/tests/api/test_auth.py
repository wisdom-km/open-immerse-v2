"""Bearer compare for the launch token. ARCHITECTURE §10.1."""

from fastapi import Request
from fastapi.responses import JSONResponse

from oi_worker.api.auth import AUTH_CODE, UNAUTHORIZED, authorization_failure, bearer_matches

TOKEN = "oitest_launchhealth"


def _request(header: str | None) -> Request:
    raw = b"" if header is None else header.encode("utf-8")
    headers = [] if header is None else [(b"authorization", raw)]
    return Request({"type": "http", "headers": headers, "method": "GET", "path": "/v1/health"})


def test_matches_when_the_bearer_is_the_launch_token() -> None:
    assert bearer_matches(TOKEN, f"Bearer {TOKEN}")
    assert bearer_matches(TOKEN, f"bearer {TOKEN}")


def test_rejects_when_the_bearer_is_missing_or_wrong() -> None:
    assert not bearer_matches(TOKEN, None)
    assert not bearer_matches(TOKEN, TOKEN)
    assert not bearer_matches(TOKEN, f"Bearer {TOKEN}-extra")
    assert not bearer_matches(TOKEN, "Bearer oitest_wrongtoken")
    assert not bearer_matches(TOKEN, f"Bearer {TOKEN} trailing")


def test_returns_401_when_the_header_does_not_match() -> None:
    response = authorization_failure(_request("Bearer oitest_wrongtoken"), TOKEN)
    assert isinstance(response, JSONResponse)
    assert response.status_code == UNAUTHORIZED
    text = bytes(response.body).decode("utf-8")
    assert text == '{"code":"auth.bearer"}'
    assert text == '{"code":"' + AUTH_CODE + '"}'
    assert TOKEN not in text
    assert "oitest_wrongtoken" not in text


def test_returns_none_when_the_header_matches() -> None:
    assert authorization_failure(_request(f"Bearer {TOKEN}"), TOKEN) is None

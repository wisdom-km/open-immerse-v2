"""HTTP health: 200, 426, 400, 401, unknown fields, AC-09.

Requests use httpx.ASGITransport. The Starlette test-client module touches the
deprecated anyio.abc.BlockingPortal alias, so this file does not import it.
"""

import asyncio
import warnings
from collections.abc import Awaitable, Callable

import httpx
import pytest

from oi_worker.api.app import create_app
from oi_worker.api.package_version import package_version

TOKEN = "oitest_healthprobe"
Scenario = Callable[[httpx.AsyncClient], Awaitable[None]]


def _run(mode: str, scenario: Scenario) -> None:
    async def once() -> None:
        transport = httpx.ASGITransport(app=create_app(mode, TOKEN))
        async with httpx.AsyncClient(
            transport=transport,
            base_url="http://127.0.0.1",
        ) as client:
            await scenario(client)

    with warnings.catch_warnings(record=True) as caught:
        warnings.simplefilter("always", DeprecationWarning)
        asyncio.run(once())
    assert [item for item in caught if issubclass(item.category, DeprecationWarning)] == []


def _headers(extra: dict[str, str] | None = None) -> dict[str, str]:
    headers = {"Authorization": f"Bearer {TOKEN}"}
    if extra is not None:
        headers.update(extra)
    return headers


def _assert_no_path_or_key(text: str) -> None:
    assert "/" not in text
    assert "\\" not in text
    assert "key" not in text.lower()


def test_returns_200_when_the_protocol_major_is_supported() -> None:
    async def scenario(client: httpx.AsyncClient) -> None:
        response = await client.get("/v1/health", headers=_headers({"OI-Protocol": "1.0"}))
        assert response.status_code == 200
        assert response.json() == {
            "protocol": "1.0",
            "workerVersion": package_version(),
            "mode": "local",
        }
        assert TOKEN not in response.text

    _run("local", scenario)


def test_returns_server_mode_when_the_app_is_assembled_as_server() -> None:
    async def scenario(client: httpx.AsyncClient) -> None:
        response = await client.get("/v1/health", headers=_headers({"OI-Protocol": "1.0"}))
        assert response.status_code == 200
        assert response.json()["mode"] == "server"

    _run("server", scenario)


def test_ac_66_returns_426_when_the_protocol_major_is_unsupported() -> None:
    async def scenario(client: httpx.AsyncClient) -> None:
        response = await client.get("/v1/health", headers=_headers({"OI-Protocol": "2.0"}))
        assert response.status_code == 426
        assert response.json() == {"supported": ["1.0"]}
        assert "jobId" not in response.json()
        assert TOKEN not in response.text

    _run("local", scenario)


def test_ac_09_omits_paths_and_keys_when_health_returns_200() -> None:
    async def scenario(client: httpx.AsyncClient) -> None:
        response = await client.get("/v1/health", headers=_headers({"OI-Protocol": "1.0"}))
        assert response.status_code == 200
        _assert_no_path_or_key(response.text)
        assert set(response.json()) == {"protocol", "workerVersion", "mode"}

    _run("local", scenario)


@pytest.mark.parametrize("header", [None, "", "1", "1.0.0", "01.0", "1.0 "])
def test_returns_400_when_the_protocol_header_is_missing_or_malformed(header: str | None) -> None:
    extra = {} if header is None else {"OI-Protocol": header}

    async def scenario(client: httpx.AsyncClient) -> None:
        response = await client.get("/v1/health", headers=_headers(extra))
        assert response.status_code == 400
        assert response.json() == {"code": "protocol.version"}
        _assert_no_path_or_key(response.text)
        assert "jobId" not in response.json()
        assert TOKEN not in response.text

    _run("local", scenario)


def test_returns_401_when_the_bearer_is_missing() -> None:
    async def scenario(client: httpx.AsyncClient) -> None:
        response = await client.get("/v1/health", headers={"OI-Protocol": "1.0"})
        assert response.status_code == 401
        assert response.json() == {"code": "auth.bearer"}
        _assert_no_path_or_key(response.text)
        assert TOKEN not in response.text

    _run("local", scenario)


def test_returns_401_when_the_bearer_is_wrong() -> None:
    wrong = "oitest_wrongtoken"

    async def scenario(client: httpx.AsyncClient) -> None:
        response = await client.get(
            "/v1/health",
            headers={"OI-Protocol": "1.0", "Authorization": f"Bearer {wrong}"},
        )
        assert response.status_code == 401
        assert response.json() == {"code": "auth.bearer"}
        assert TOKEN not in response.text
        assert wrong not in response.text

    _run("local", scenario)


def test_ignores_unknown_fields_when_the_minor_is_newer() -> None:
    async def scenario(client: httpx.AsyncClient) -> None:
        response = await client.request(
            "GET",
            "/v1/health",
            headers=_headers({"OI-Protocol": "1.9", "X-Unspecified": "kept-out"}),
            params={"file": "/tmp/paper.pdf", "apiKey": "oitest_healthprobe"},
            content=b'{"unspecified":true,"path":"C:\\\\Users\\\\paper.pdf"}',
        )
        assert response.status_code == 200
        body = response.json()
        assert body["protocol"] == "1.0"
        assert set(body) == {"protocol", "workerVersion", "mode"}
        assert "kept-out" not in response.text
        assert "oitest_healthprobe" not in response.text
        assert "paper.pdf" not in response.text
        assert "unspecified" not in response.text
        _assert_no_path_or_key(response.text)

    _run("local", scenario)


def test_does_not_publish_docs_when_the_app_is_created() -> None:
    async def scenario(client: httpx.AsyncClient) -> None:
        assert (await client.get("/docs", headers=_headers())).status_code == 404
        assert (await client.get("/openapi.json", headers=_headers())).status_code == 404
        assert (await client.get("/docs")).status_code == 401

    _run("local", scenario)

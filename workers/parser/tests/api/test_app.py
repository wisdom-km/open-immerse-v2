"""HTTP health: 200, 426, 400, unknown fields, AC-09."""

import pytest
from fastapi.testclient import TestClient

from oi_worker.api.app import create_app
from oi_worker.api.package_version import package_version


def _client(mode: str) -> TestClient:
    return TestClient(create_app(mode))


def _assert_no_path_or_key(text: str) -> None:
    assert "/" not in text
    assert "\\" not in text
    assert "key" not in text.lower()


def test_returns_200_when_the_protocol_major_is_supported() -> None:
    with _client("local") as client:
        response = client.get("/v1/health", headers={"OI-Protocol": "1.0"})
    assert response.status_code == 200
    assert response.json() == {
        "protocol": "1.0",
        "workerVersion": package_version(),
        "mode": "local",
    }


def test_returns_server_mode_when_the_app_is_assembled_as_server() -> None:
    with _client("server") as client:
        response = client.get("/v1/health", headers={"OI-Protocol": "1.0"})
    assert response.status_code == 200
    assert response.json()["mode"] == "server"


def test_ac_66_returns_426_when_the_protocol_major_is_unsupported() -> None:
    with _client("local") as client:
        response = client.get("/v1/health", headers={"OI-Protocol": "2.0"})
    assert response.status_code == 426
    assert response.json() == {"supported": ["1.0"]}
    assert "jobId" not in response.json()


def test_ac_09_omits_paths_and_keys_when_health_returns_200() -> None:
    with _client("local") as client:
        response = client.get("/v1/health", headers={"OI-Protocol": "1.0"})
    assert response.status_code == 200
    _assert_no_path_or_key(response.text)
    assert set(response.json()) == {"protocol", "workerVersion", "mode"}


@pytest.mark.parametrize("header", [None, "", "1", "1.0.0", "01.0", "1.0 "])
def test_returns_400_when_the_protocol_header_is_missing_or_malformed(header: str | None) -> None:
    headers = {} if header is None else {"OI-Protocol": header}
    with _client("local") as client:
        response = client.get("/v1/health", headers=headers)
    assert response.status_code == 400
    assert response.json() == {"error": "protocol.version"}
    _assert_no_path_or_key(response.text)
    assert "jobId" not in response.json()


def test_ignores_unknown_fields_when_the_minor_is_newer() -> None:
    with _client("local") as client:
        response = client.request(
            "GET",
            "/v1/health",
            headers={"OI-Protocol": "1.9", "X-Unspecified": "kept-out"},
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


def test_does_not_publish_docs_when_the_app_is_created() -> None:
    with _client("local") as client:
        assert client.get("/docs").status_code == 404
        assert client.get("/openapi.json").status_code == 404

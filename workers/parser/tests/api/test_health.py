"""GET /v1/health response."""

import pytest

from oi_worker.api.health import HealthRequest, exchange_health, health_response
from oi_worker.api.package_version import package_version
from oi_worker.protocol.health import dump_health


def _request(header: object, mode: str = "local") -> HealthRequest:
    return HealthRequest(method="GET", path="/v1/health", header=header, mode=mode)


def test_returns_protocol_worker_version_and_mode_when_the_header_major_is_supported() -> None:
    document = health_response("local")
    body = dump_health(document)
    assert body == {
        "protocol": "1.0",
        "workerVersion": package_version(),
        "mode": "local",
    }
    assert document.worker_version == "0.0.0"


def test_returns_server_mode_when_the_process_deployment_is_server() -> None:
    exchange = exchange_health(_request("1.0", mode="server"))
    assert exchange.status == 200
    assert exchange.body["mode"] == "server"


def test_ac_09_omits_secrets_and_paths_when_the_health_body_is_built() -> None:
    exchange = exchange_health(_request("1.0"))
    assert exchange.status == 200
    assert set(exchange.body) == {"protocol", "workerVersion", "mode"}
    for value in exchange.body.values():
        assert isinstance(value, str)
        assert "/" not in value
        assert "\\" not in value
        assert "key" not in value.lower()


def test_ac_66_returns_no_job_when_the_protocol_major_is_unsupported() -> None:
    exchange = exchange_health(_request("2.0"))
    assert exchange.status == 426
    assert exchange.body == {"supported": ["1.0"]}
    assert "jobId" not in exchange.body


def test_ac_66_returns_health_when_the_client_minor_is_newer() -> None:
    exchange = exchange_health(_request("1.8"))
    assert exchange.status == 200
    assert exchange.body["protocol"] == "1.0"


def test_rejects_the_exchange_when_the_header_is_not_a_version() -> None:
    with pytest.raises(ValueError, match="^protocol.version$"):
        exchange_health(_request(None))


def test_rejects_the_exchange_when_the_method_or_path_does_not_match() -> None:
    post = HealthRequest(method="POST", path="/v1/health", header="1.0", mode="local")
    with pytest.raises(ValueError, match="^health.route$"):
        exchange_health(post)
    other = HealthRequest(method="GET", path="/v1/jobs", header="1.0", mode="local")
    with pytest.raises(ValueError, match="^health.route$"):
        exchange_health(other)


def test_rejects_the_exchange_when_mode_is_not_a_deployment() -> None:
    with pytest.raises(ValueError, match="^health.mode$"):
        exchange_health(_request("1.0", mode="api"))

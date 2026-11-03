"""jev.route selects one backend and does not fall back."""

import httpx
import pytest

from oi_worker.quality.backends.jev_http import (
    INTERNATIONAL_BASE_URL,
    JevHttpBackend,
    JevHttpSettings,
)
from oi_worker.quality.backends.local_engine import LocalEngine
from oi_worker.quality.evaluator import EvalItem
from oi_worker.quality.select_backend import select_backend

KEY = "oitest_jevclient"


def _item() -> EvalItem:
    return EvalItem(image_base64="YQ==", ocr_text="alpha", category="table")


def _settings() -> tuple[JevHttpSettings, list[str]]:
    hosts: list[str] = []

    def handler(request: httpx.Request) -> httpx.Response:
        hosts.append(request.url.host)
        return httpx.Response(500)

    settings = JevHttpSettings(
        credential=KEY,
        transport=httpx.MockTransport(handler),
        base_url=INTERNATIONAL_BASE_URL,
    )
    return settings, hosts


def test_ac_103_makes_no_modelbest_call_when_the_route_is_local() -> None:
    settings, hosts = _settings()
    route = "local"
    backend = select_backend(route, settings)
    outcomes = backend.evaluate([_item()])
    assert route == "local"
    assert isinstance(backend, LocalEngine)
    assert hosts == []
    assert outcomes[0].unavailable is True
    assert outcomes[0].raw_score is None
    assert "api.modelbest.ai" not in hosts
    assert "api.modelbest.cn" not in hosts


def test_keeps_the_route_on_the_api_backend_when_the_route_is_api() -> None:
    settings, hosts = _settings()
    backend = select_backend("api", settings)
    assert isinstance(backend, JevHttpBackend)
    outcomes = backend.evaluate([_item()])
    assert hosts == ["api.modelbest.ai"]
    assert outcomes[0].failure_kind == "service_failed"
    assert outcomes[0].raw_score is None


def test_rejects_when_the_route_is_neither_api_nor_local() -> None:
    settings, hosts = _settings()
    with pytest.raises(ValueError, match="jev.route"):
        select_backend("other", settings)
    assert hosts == []

"""AC-66② fixtures shared with the TypeScript side."""

import json
from pathlib import Path
from typing import cast

import pytest
from pydantic import ValidationError

from oi_worker.api.health import HealthRequest, exchange_health
from oi_worker.protocol.health import HealthResponse
from oi_worker.protocol.unsupported import UnsupportedProtocol

FIXTURES = Path(__file__).resolve().parents[4] / "fixtures" / "protocol" / "versions"


def _cases() -> list[Path]:
    return sorted(FIXTURES.glob("*.json"))


def _load(path: Path) -> dict[str, object]:
    loaded = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(loaded, dict):
        raise AssertionError(path.name)
    return cast(dict[str, object], loaded)


def _health(fixture: dict[str, object]) -> None:
    expect = fixture.get("expect")
    document = fixture.get("document")
    if expect == "accept":
        dumped = HealthResponse.model_validate(document).model_dump(mode="json", by_alias=True)
        assert dumped == fixture.get("parsed")
        return
    if expect == "reject":
        with pytest.raises(ValidationError):
            HealthResponse.model_validate(document)
        return
    raise AssertionError(expect)


def _unsupported(fixture: dict[str, object]) -> None:
    expect = fixture.get("expect")
    document = fixture.get("document")
    if expect == "accept":
        dumped = UnsupportedProtocol.model_validate(document).model_dump(mode="json")
        assert dumped == fixture.get("parsed")
        return
    if expect == "reject":
        with pytest.raises(ValidationError):
            UnsupportedProtocol.model_validate(document)
        return
    raise AssertionError(expect)


def _exchange(fixture: dict[str, object]) -> None:
    assert fixture.get("jobsSubmitted") == 0
    exchange = exchange_health(
        HealthRequest(method="GET", path="/v1/health", header=fixture.get("header"), mode="local")
    )
    assert exchange.status == fixture.get("expectStatus")
    assert exchange.body == fixture.get("body")
    assert "jobId" not in exchange.body


@pytest.mark.parametrize("path", _cases(), ids=lambda path: path.stem)
def test_ac_66_follows_the_version_fixture_when_the_sample_is_loaded(path: Path) -> None:
    fixture = _load(path)
    kind = fixture.get("kind")
    if kind == "health":
        _health(fixture)
        return
    if kind == "unsupported":
        _unsupported(fixture)
        return
    if kind == "exchange":
        _exchange(fixture)
        return
    raise AssertionError(kind)

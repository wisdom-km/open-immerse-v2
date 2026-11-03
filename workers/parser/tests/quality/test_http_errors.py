"""ProviderFailure samples shared with the later TS adapter."""

import json
from datetime import datetime
from pathlib import Path

import pytest

from oi_worker.quality.http_errors import map_http_error, map_timeout

SAMPLES = Path(__file__).resolve().parents[4] / "fixtures" / "protocol" / "provider-errors"
NOW = datetime.fromisoformat("2015-10-21T07:28:00+00:00")


def _paths() -> list[Path]:
    return sorted(path for path in SAMPLES.glob("*.json"))


@pytest.mark.parametrize("path", _paths(), ids=lambda path: path.stem)
def test_ac_59_maps_the_sample_when_the_status_is_loaded(path: Path) -> None:
    sample = json.loads(path.read_text(encoding="utf-8"))
    expected = sample["expected"]
    if sample.get("timeout") is True:
        failure = map_timeout()
    else:
        moment = NOW
        if "now" in sample:
            moment = datetime.fromisoformat(sample["now"])
        failure = map_http_error(sample["httpStatus"], sample["headers"], moment)
    assert failure.as_contract() == expected


def test_leaves_retry_after_empty_when_the_header_is_not_a_delay() -> None:
    failure = map_http_error(429, {"Retry-After": "later"}, NOW)
    assert failure.retry_after_ms is None
    assert failure.retryable is False

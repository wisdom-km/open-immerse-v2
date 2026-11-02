"""Health document validation."""

import pytest
from pydantic import ValidationError

from oi_worker.protocol.health import HealthResponse


def _valid() -> dict[str, object]:
    return {"protocol": "1.0", "workerVersion": "0.0.0", "mode": "local"}


def test_accepts_a_health_document_when_the_three_fields_match() -> None:
    document = HealthResponse.model_validate(_valid())
    assert document.model_dump(mode="json", by_alias=True) == {
        "protocol": "1.0",
        "workerVersion": "0.0.0",
        "mode": "local",
    }


def test_accepts_server_mode_when_the_deployment_is_server() -> None:
    payload = _valid()
    payload["mode"] = "server"
    assert HealthResponse.model_validate(payload).mode == "server"


def test_ac_66_accepts_a_health_document_when_the_minor_is_newer_and_fields_are_unknown() -> None:
    payload = _valid()
    payload["protocol"] = "1.9"
    payload["unspecified"] = "kept-out"
    dumped = HealthResponse.model_validate(payload).model_dump(mode="json", by_alias=True)
    assert dumped["protocol"] == "1.9"
    assert "unspecified" not in dumped
    assert set(dumped) == {"protocol", "workerVersion", "mode"}


@pytest.mark.parametrize(
    "payload",
    [
        ["1.0"],
        {"workerVersion": "0.0.0", "mode": "local"},
        {"protocol": "1", "workerVersion": "0.0.0", "mode": "local"},
        {"protocol": 1, "workerVersion": "0.0.0", "mode": "local"},
        {"protocol": "1.0", "mode": "local"},
        {"protocol": "1.0", "workerVersion": "", "mode": "local"},
        {"protocol": "1.0", "workerVersion": "0.0.0 ", "mode": "local"},
        {"protocol": "1.0", "workerVersion": 0, "mode": "local"},
        {"protocol": "1.0", "workerVersion": "0.0.0"},
        {"protocol": "1.0", "workerVersion": "0.0.0", "mode": "api"},
        {"protocol": "1.0", "workerVersion": "0.0.0", "mode": None},
    ],
)
def test_rejects_a_health_document_when_a_field_is_invalid(payload: object) -> None:
    with pytest.raises(ValidationError):
        HealthResponse.model_validate(payload)

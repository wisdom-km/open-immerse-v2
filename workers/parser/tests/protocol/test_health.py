"""Health document validation."""

import pytest

from oi_worker.protocol.health import dump_health, parse_health


def _valid() -> dict[str, object]:
    return {"protocol": "1.0", "workerVersion": "0.0.0", "mode": "local"}


def test_accepts_a_health_document_when_the_three_fields_match() -> None:
    document = parse_health(_valid())
    assert dump_health(document) == {
        "protocol": "1.0",
        "workerVersion": "0.0.0",
        "mode": "local",
    }


def test_accepts_server_mode_when_the_deployment_is_server() -> None:
    payload = _valid()
    payload["mode"] = "server"
    assert parse_health(payload).mode == "server"


def test_ac_66_accepts_a_health_document_when_the_minor_is_newer_and_fields_are_unknown() -> None:
    payload = _valid()
    payload["protocol"] = "1.9"
    payload["unspecified"] = "kept-out"
    document = parse_health(payload)
    dumped = dump_health(document)
    assert document.protocol == "1.9"
    assert "unspecified" not in dumped
    assert set(dumped) == {"protocol", "workerVersion", "mode"}


@pytest.mark.parametrize(
    ("payload", "code"),
    [
        (["1.0"], "health.not_object"),
        ({"workerVersion": "0.0.0", "mode": "local"}, "health.protocol"),
        ({"protocol": "1", "workerVersion": "0.0.0", "mode": "local"}, "health.protocol"),
        ({"protocol": 1, "workerVersion": "0.0.0", "mode": "local"}, "health.protocol"),
        ({"protocol": "1.0", "mode": "local"}, "health.worker_version"),
        ({"protocol": "1.0", "workerVersion": "", "mode": "local"}, "health.worker_version"),
        ({"protocol": "1.0", "workerVersion": "0.0.0 ", "mode": "local"}, "health.worker_version"),
        ({"protocol": "1.0", "workerVersion": 0, "mode": "local"}, "health.worker_version"),
        (
            {"protocol": "1.0", "workerVersion": "v" * 65, "mode": "local"},
            "health.worker_version",
        ),
        ({"protocol": "1.0", "workerVersion": "0.0.0"}, "health.mode"),
        ({"protocol": "1.0", "workerVersion": "0.0.0", "mode": "api"}, "health.mode"),
        ({"protocol": "1.0", "workerVersion": "0.0.0", "mode": None}, "health.mode"),
    ],
)
def test_rejects_a_health_document_when_a_field_is_invalid(payload: object, code: str) -> None:
    with pytest.raises(ValueError, match=f"^{code}$"):
        parse_health(payload)

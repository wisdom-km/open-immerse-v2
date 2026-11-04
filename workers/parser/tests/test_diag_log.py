"""Sender writes one whitelist JSON object to stderr and never to stdout."""

import io
import json

import pytest

from oi_worker.diag_log import emit_diag


def _emit(event: str, fields: dict[str, object]) -> str:
    sink = io.StringIO()
    emit_diag(
        event,
        fields,
        level="info",
        feature="worker",
        ts="2026-11-04T00:00:00+00:00",
        stderr=sink,
    )
    return sink.getvalue()


def test_writes_one_object_to_stderr_when_the_event_is_known(
    capsys: pytest.CaptureFixture[str],
) -> None:
    emit_diag("egress.ask", {}, level="info", feature="egress")
    captured = capsys.readouterr()
    assert captured.out == ""
    assert captured.err.endswith("\n")
    assert captured.err.count("\n") == 1
    parsed = json.loads(captured.err)
    assert parsed["event"] == "egress.ask"
    assert parsed["level"] == "info"
    assert parsed["feature"] == "egress"
    assert "source" not in parsed
    assert parsed["ts"]


def test_drops_unknown_fields_when_the_event_is_known() -> None:
    text = _emit(
        "egress.ask",
        {"body": "fixture-paper-body", "source": "main", "requestId": "req-1"},
    )
    assert json.loads(text) == {
        "ts": "2026-11-04T00:00:00+00:00",
        "level": "info",
        "feature": "worker",
        "event": "egress.ask",
        "requestId": "req-1",
    }


@pytest.mark.parametrize("event", ["budget.refused", "scoring.unavailable"])
def test_writes_named_events_when_they_are_on_the_whitelist(event: str) -> None:
    parsed = json.loads(_emit(event, {}))
    assert parsed["event"] == event
    assert "source" not in parsed


def test_writes_nothing_when_request_id_is_not_a_string() -> None:
    assert _emit("egress.ask", {"requestId": 1}) == ""


def test_writes_nothing_when_the_event_is_unknown() -> None:
    text = _emit("langsmith.trace", {"body": "fixture-paper-body"})
    assert text == ""


def test_writes_nothing_when_pipeline_fields_are_missing() -> None:
    text = _emit("pipeline.run", {"route": "multimodal-layout"})
    assert text == ""


def test_writes_nothing_when_duration_is_a_bool() -> None:
    text = _emit(
        "pipeline.run",
        {
            "run_id": "run-1",
            "route": "multimodal-layout",
            "step": "parse",
            "status": "done",
            "error_class": "",
            "duration_ms": True,
        },
    )
    assert text == ""


def test_writes_a_pipeline_run_when_the_fields_are_present() -> None:
    text = _emit(
        "pipeline.run",
        {
            "run_id": "run-1",
            "route": "multimodal-layout",
            "step": "parse",
            "status": "done",
            "error_class": "",
            "duration_ms": 12,
            "note": "fixture-paper-body",
        },
    )
    parsed = json.loads(text)
    assert parsed["event"] == "pipeline.run"
    assert parsed["duration_ms"] == 12
    assert "note" not in parsed
    assert "source" not in parsed


def test_writes_upstream_and_oversize_when_required_fields_are_present() -> None:
    upstream = json.loads(_emit("upstream.server_error", {"requestId": "req-1"}))
    assert upstream["requestId"] == "req-1"
    assert list(upstream) == ["ts", "level", "feature", "event", "requestId"]
    oversize = json.loads(
        _emit("ipc.oversize", {"channel": "document.open", "bytes": 4, "payload": "x"})
    )
    assert oversize["channel"] == "document.open"
    assert oversize["bytes"] == 4
    assert "payload" not in oversize


def test_writes_nothing_when_the_line_would_exceed_8192_bytes() -> None:
    text = _emit("egress.ask", {"requestId": "a" * 9000})
    assert text == ""


def test_does_not_raise_when_the_event_is_unknown(
    capsys: pytest.CaptureFixture[str],
) -> None:
    emit_diag("not-an-event", {"body": object()}, level="info", feature="worker")
    captured = capsys.readouterr()
    assert captured.out == ""
    assert captured.err == ""

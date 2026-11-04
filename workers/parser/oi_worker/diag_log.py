"""Write one ARCHITECTURE §11 diagnostic object to stderr."""

from __future__ import annotations

import json
import sys
from collections.abc import Mapping
from datetime import UTC, datetime
from typing import TextIO

MAX_LINE_BYTES = 8192

_EVENT_IDS = frozenset(
    {
        "egress.ask",
        "budget.refused",
        "upstream.server_error",
        "scoring.unavailable",
        "pipeline.run",
        "ipc.oversize",
    }
)


def emit_diag(
    event: str,
    fields: Mapping[str, object],
    *,
    level: str,
    feature: str,
    ts: str | None = None,
    stderr: TextIO | None = None,
) -> None:
    """Emit one whitelist event. Unknown input is dropped and never raised."""
    line = _encode(event, fields, level=level, feature=feature, ts=ts)
    if line is None:
        return
    target = sys.stderr if stderr is None else stderr
    target.write(line)


def _encode(
    event: str,
    fields: Mapping[str, object],
    *,
    level: str,
    feature: str,
    ts: str | None,
) -> str | None:
    stamp = _timestamp(ts)
    if stamp is None or event not in _EVENT_IDS:
        return None
    payload = _payload(event, fields, level=level, feature=feature, ts=stamp)
    if payload is None:
        return None
    text = json.dumps(payload, ensure_ascii=False)
    if len(text.encode("utf-8")) > MAX_LINE_BYTES:
        return None
    return f"{text}\n"


def _timestamp(ts: str | None) -> str | None:
    if ts is None:
        return datetime.now(UTC).isoformat()
    if ts == "":
        return None
    return ts


def _payload(
    event: str,
    fields: Mapping[str, object],
    *,
    level: str,
    feature: str,
    ts: str,
) -> dict[str, object] | None:
    body = _event_fields(event, fields)
    if body is None:
        return None
    return {
        "ts": ts,
        "level": level,
        "feature": feature,
        "event": event,
        **body,
    }


def _event_fields(event: str, fields: Mapping[str, object]) -> dict[str, object] | None:
    if event == "pipeline.run":
        return _pipeline(fields)
    if event == "upstream.server_error":
        return _upstream(fields)
    if event == "ipc.oversize":
        return _oversize(fields)
    return _optional_request(fields)


def _pipeline(fields: Mapping[str, object]) -> dict[str, object] | None:
    run_id = _required_str(fields, "run_id")
    route = _required_str(fields, "route")
    step = _required_str(fields, "step")
    status = _required_str(fields, "status")
    error_class = _required_str(fields, "error_class")
    duration = _duration(fields.get("duration_ms"))
    request = _optional_request(fields)
    if (
        run_id is None
        or route is None
        or step is None
        or status is None
        or error_class is None
        or duration is None
        or request is None
    ):
        return None
    return {
        "run_id": run_id,
        "route": route,
        "step": step,
        "status": status,
        "error_class": error_class,
        "duration_ms": duration,
        **request,
    }


def _upstream(fields: Mapping[str, object]) -> dict[str, object] | None:
    request_id = _required_str(fields, "requestId")
    if request_id is None:
        return None
    return {"requestId": request_id}


def _oversize(fields: Mapping[str, object]) -> dict[str, object] | None:
    channel = _required_str(fields, "channel")
    size = _byte_count(fields.get("bytes"))
    request = _optional_request(fields)
    if channel is None or size is None or request is None:
        return None
    return {"channel": channel, "bytes": size, **request}


def _optional_request(fields: Mapping[str, object]) -> dict[str, object] | None:
    if "requestId" not in fields:
        return {}
    value = fields["requestId"]
    if not isinstance(value, str):
        return None
    return {"requestId": value}


def _required_str(fields: Mapping[str, object], key: str) -> str | None:
    value = fields.get(key)
    if not isinstance(value, str):
        return None
    return value


def _duration(value: object) -> int | float | None:
    if isinstance(value, bool) or not isinstance(value, int | float):
        return None
    if isinstance(value, float) and _non_finite(value):
        return None
    if value < 0:
        return None
    return value


def _byte_count(value: object) -> int | None:
    if isinstance(value, bool) or not isinstance(value, int):
        return None
    if value < 0:
        return None
    return value


def _non_finite(value: float) -> bool:
    return value != value or value == float("inf") or value == float("-inf")

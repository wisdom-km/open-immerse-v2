"""Map ModelBest HTTP failures to ProviderFailure. No I/O."""

from collections.abc import Mapping
from dataclasses import dataclass
from datetime import UTC, datetime
from email.utils import parsedate_to_datetime


@dataclass(frozen=True, slots=True)
class ProviderFailure:
    kind: str
    retryable: bool
    retry_after_ms: int | None
    http_status: int | None
    vendor_code: str | None
    request_id: str | None

    def as_contract(self) -> dict[str, object]:
        return {
            "kind": self.kind,
            "retryable": self.retryable,
            "retryAfterMs": self.retry_after_ms,
            "httpStatus": self.http_status,
            "vendorCode": self.vendor_code,
            "requestId": self.request_id,
        }


def map_timeout() -> ProviderFailure:
    return ProviderFailure(
        kind="timeout",
        retryable=True,
        retry_after_ms=None,
        http_status=None,
        vendor_code=None,
        request_id=None,
    )


def map_http_error(status: int, headers: Mapping[str, str], now: datetime) -> ProviderFailure:
    kind, retryable, vendor_code = _classified(status)
    request_id = _header(headers, "x-request-id")
    retry_after_ms = None
    if status == 429:
        retry_after_ms = _retry_after_ms(_header(headers, "retry-after"), now)
        retryable = retry_after_ms is not None
    return ProviderFailure(
        kind=kind,
        retryable=retryable,
        retry_after_ms=retry_after_ms,
        http_status=status,
        vendor_code=vendor_code,
        request_id=request_id,
    )


def _classified(status: int) -> tuple[str, bool, str | None]:
    if status in {401, 403}:
        return "auth", False, None
    if status == 402:
        return "quota", False, None
    if status == 404:
        return "invalid_request", False, "not_found"
    if status == 413:
        return "too_large", True, None
    if status == 429:
        return "rate_limited", True, None
    if 500 <= status <= 599:
        return "service_failed", True, None
    return "invalid_request", False, None


def _header(headers: Mapping[str, str], name: str) -> str | None:
    for key, value in headers.items():
        if key.lower() == name:
            text = value.strip()
            return text or None
    return None


def _retry_after_ms(raw: str | None, now: datetime) -> int | None:
    if raw is None:
        return None
    if raw.isdigit():
        return int(raw) * 1000
    when = _http_date(raw)
    if when is None:
        return None
    if when.tzinfo is None:
        when = when.replace(tzinfo=UTC)
    current = now if now.tzinfo is not None else now.replace(tzinfo=UTC)
    delta_ms = int((when - current).total_seconds() * 1000)
    if delta_ms < 0:
        return 0
    return delta_ms


def _http_date(raw: str) -> datetime | None:
    try:
        return parsedate_to_datetime(raw)
    except (TypeError, ValueError, IndexError, OverflowError):
        return None

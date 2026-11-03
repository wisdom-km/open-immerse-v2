"""面壁 Jev 托管 API 客户端（mode 只做 score）。

调用方必须先持有 §10.2 额度信封，信封扣次在 M6a 作业层。
本模块不提供作业端点，也不从产品路径调用付费上游。
未注入 transport 时拒绝联网。
"""

import json
import time
from collections.abc import Callable, Mapping, Sequence
from dataclasses import dataclass, field
from datetime import UTC, datetime
from urllib.parse import urlparse

import httpx

from oi_worker.quality.batching import chunks, split_in_half
from oi_worker.quality.evaluator import (
    AttemptRecord,
    EvalItem,
    EvalOutcome,
    EvaluatorDescriptor,
    JevScoreResult,
    outcomes_for_failure,
)
from oi_worker.quality.http_errors import ProviderFailure, map_http_error, map_timeout
from oi_worker.quality.request_body import score_request
from oi_worker.quality.response_body import outcomes_from_body, prompt_tokens

INTERNATIONAL_BASE_URL = "https://api.modelbest.ai/v1"
# 上游文档里的字符串。2026-11-03 国内站文档页没有给出 API 正文。
DOMESTIC_BASE_URL_UNVERIFIED = "https://api.modelbest.cn/v1"


class _RefuseTransport(httpx.BaseTransport):
    def handle_request(self, request: httpx.Request) -> httpx.Response:
        raise RuntimeError("real network is disabled")


def _sleep_ms(delay_ms: int) -> None:
    time.sleep(delay_ms / 1000)


def _utc_now() -> datetime:
    return datetime.now(UTC)


@dataclass(frozen=True, slots=True)
class RetryPolicy:
    max_retries: int = 0
    service_backoff_ms: tuple[int, ...] = ()


@dataclass(frozen=True, slots=True)
class JevHttpSettings:
    base_url: str = INTERNATIONAL_BASE_URL
    credential: str | None = None
    retry: RetryPolicy = field(default_factory=RetryPolicy)
    transport: httpx.BaseTransport | None = None
    clock: Callable[[], float] = time.perf_counter
    sleeper: Callable[[int], None] = _sleep_ms
    now: Callable[[], datetime] = _utc_now


@dataclass
class _Budget:
    retries_left: int
    service_retries: int
    service_backoff_ms: tuple[int, ...]


@dataclass(frozen=True, slots=True)
class _Retry:
    parts: tuple[list[EvalItem], ...]
    delay_ms: int
    service: bool


class JevHttpBackend:
    max_batch = 64

    def __init__(self, settings: JevHttpSettings | None = None) -> None:
        self._settings = JevHttpSettings() if settings is None else settings

    def describe(self) -> EvaluatorDescriptor:
        return EvaluatorDescriptor(
            deployment="modelbest-api",
            model="MiniCPM-OCR-Jev",
            site=urlparse(self._settings.base_url).hostname,
        )

    def evaluate(self, items: list[EvalItem]) -> list[EvalOutcome]:
        return list(self.score(items).outcomes)

    def score(self, items: Sequence[EvalItem]) -> JevScoreResult:
        if len(items) == 0:
            return JevScoreResult((), (), 0)
        if _missing(self._settings.credential):
            failure = ProviderFailure("auth", False, None, None, None, None)
            return JevScoreResult(outcomes_for_failure(len(items), failure.kind), (), 0)
        outcomes: list[EvalOutcome] = []
        attempts: list[AttemptRecord] = []
        retry_count = 0
        for chunk in chunks(items, self.max_batch):
            drained = self._drain(chunk)
            outcomes.extend(drained[0])
            attempts.extend(drained[1])
            retry_count += drained[2]
        return JevScoreResult(tuple(outcomes), tuple(attempts), retry_count)

    def _drain(self, chunk: list[EvalItem]) -> tuple[list[EvalOutcome], list[AttemptRecord], int]:
        policy = self._settings.retry
        budget = _Budget(policy.max_retries, 0, policy.service_backoff_ms)
        queue = [chunk]
        outcomes: list[EvalOutcome] = []
        attempts: list[AttemptRecord] = []
        retry_count = 0
        while queue:
            current = queue.pop(0)
            attempt, parsed = self._exchange(current)
            attempts.append(attempt)
            if parsed is not None:
                outcomes.extend(parsed)
                continue
            failure = attempt.failure
            decision = None if failure is None else _next_retry(failure, current, budget)
            if decision is None or failure is None:
                kind = "service_failed" if failure is None else failure.kind
                outcomes.extend(outcomes_for_failure(len(current), kind))
                continue
            budget.retries_left -= 1
            retry_count += 1
            if decision.service:
                budget.service_retries += 1
            if decision.delay_ms > 0:
                self._settings.sleeper(decision.delay_ms)
            queue[0:0] = list(decision.parts)
        return outcomes, attempts, retry_count

    def _exchange(
        self, items: list[EvalItem]
    ) -> tuple[AttemptRecord, tuple[EvalOutcome, ...] | None]:
        started = self._settings.clock()
        try:
            response = self._send(items)
        except httpx.TimeoutException:
            return _record(self._settings.clock, started, None, map_timeout()), None
        except (httpx.HTTPError, RuntimeError):
            failure = ProviderFailure("service_failed", False, None, None, None, None)
            return _record(self._settings.clock, started, None, failure), None
        return self._from_response(items, response, started)

    def _from_response(
        self,
        items: list[EvalItem],
        response: httpx.Response,
        started: float,
    ) -> tuple[AttemptRecord, tuple[EvalOutcome, ...] | None]:
        status = response.status_code
        payload = _json_body(response)
        tokens = None if payload is None else prompt_tokens(payload)
        elapsed = _elapsed(self._settings.clock, started)
        if status >= 400:
            failure = map_http_error(status, response.headers, self._settings.now())
            return AttemptRecord(elapsed, status, tokens, failure), None
        parsed = None if payload is None else outcomes_from_body(payload, items)
        if parsed is None:
            failure = _parse_failure(status, response.headers)
            return AttemptRecord(elapsed, status, tokens, failure), None
        return AttemptRecord(elapsed, status, tokens, None), tuple(parsed)

    def _send(self, items: list[EvalItem]) -> httpx.Response:
        credential = self._settings.credential
        if credential is None or credential == "":
            raise RuntimeError("missing credential")
        transport = self._settings.transport
        if transport is None:
            transport = _RefuseTransport()
        url = self._settings.base_url.rstrip("/") + "/chat/completions"
        headers = {"Authorization": f"Bearer {credential}"}
        with httpx.Client(transport=transport, trust_env=False) as client:
            return client.post(url, json=score_request(items), headers=headers)


def _missing(credential: str | None) -> bool:
    return credential is None or credential == ""


def _elapsed(clock: Callable[[], float], started: float) -> int:
    return int((clock() - started) * 1000)


def _record(
    clock: Callable[[], float],
    started: float,
    tokens: int | None,
    failure: ProviderFailure,
) -> AttemptRecord:
    return AttemptRecord(_elapsed(clock, started), None, tokens, failure)


def _json_body(response: httpx.Response) -> object | None:
    try:
        body: object = response.json()
    except json.JSONDecodeError:
        return None
    return body


def _parse_failure(status: int, headers: Mapping[str, str]) -> ProviderFailure:
    request_id = None
    for key, value in headers.items():
        if key.lower() == "x-request-id" and value.strip() != "":
            request_id = value.strip()
    return ProviderFailure("service_failed", False, None, status, None, request_id)


def _next_retry(failure: ProviderFailure, items: list[EvalItem], budget: _Budget) -> _Retry | None:
    if budget.retries_left <= 0 or not failure.retryable:
        return None
    if failure.kind == "too_large":
        return _split_retry(items)
    if failure.kind == "rate_limited":
        return _delay_retry(items, failure.retry_after_ms, service=False)
    if failure.kind in {"service_failed", "timeout"}:
        return _service_retry(items, budget)
    return None


def _split_retry(items: list[EvalItem]) -> _Retry | None:
    halves = split_in_half(items)
    if halves is None:
        return None
    return _Retry(parts=halves, delay_ms=0, service=False)


def _service_retry(items: list[EvalItem], budget: _Budget) -> _Retry | None:
    if budget.service_retries >= len(budget.service_backoff_ms):
        return None
    return _delay_retry(items, budget.service_backoff_ms[budget.service_retries], service=True)


def _delay_retry(items: list[EvalItem], delay_ms: int | None, service: bool) -> _Retry | None:
    if delay_ms is None:
        return None
    return _Retry(parts=(items,), delay_ms=delay_ms, service=service)

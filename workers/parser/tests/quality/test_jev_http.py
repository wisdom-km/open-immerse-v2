"""Jev HTTP client. Transport is injected; unstubbed requests fail."""

import dataclasses
import json

import httpx
import pytest

from oi_worker.quality.backends.jev_http import (
    DOMESTIC_BASE_URL_UNVERIFIED,
    INTERNATIONAL_BASE_URL,
    JevHttpBackend,
    JevHttpSettings,
    RetryPolicy,
)
from oi_worker.quality.evaluator import EvalItem

KEY = "oitest_jevclient"


class _Clock:
    def __init__(self) -> None:
        self.value = 0.0

    def __call__(self) -> float:
        current = self.value
        self.value += 0.01
        return current


class _Script:
    def __init__(self, steps: list[httpx.Response | Exception]) -> None:
        self._steps = steps
        self.requests: list[httpx.Request] = []

    def __call__(self, request: httpx.Request) -> httpx.Response:
        self.requests.append(request)
        if not self._steps:
            raise AssertionError("unstubbed request")
        step = self._steps.pop(0)
        if isinstance(step, Exception):
            raise step
        return step


def _item(text: str) -> EvalItem:
    return EvalItem(image_base64="YQ==", ocr_text=text, category="formula")


def _items(count: int) -> list[EvalItem]:
    return [_item(f"row-{index}") for index in range(count)]


def _ok(count: int, tokens: int | None) -> httpx.Response:
    results = [{"verdict": "scored", "prob_yes": 0.5} for _ in range(count)]
    body: dict[str, object] = {
        "choices": [{"message": {"content": json.dumps({"results": results})}}],
    }
    if tokens is not None:
        body["usage"] = {"prompt_tokens": tokens}
    return httpx.Response(200, json=body)


def _settings(
    script: _Script,
    retry: RetryPolicy | None = None,
    base_url: str = INTERNATIONAL_BASE_URL,
    credential: str | None = KEY,
) -> JevHttpSettings:
    delays: list[int] = []

    def sleeper(delay_ms: int) -> None:
        delays.append(delay_ms)

    settings = JevHttpSettings(
        base_url=base_url,
        credential=credential,
        retry=RetryPolicy() if retry is None else retry,
        transport=httpx.MockTransport(script),
        clock=_Clock(),
        sleeper=sleeper,
    )
    settings_delays[id(settings)] = delays
    return settings


settings_delays: dict[int, list[int]] = {}


def _delays(settings: JevHttpSettings) -> list[int]:
    return settings_delays[id(settings)]


def test_ac_59_scores_one_batch_when_the_response_parses() -> None:
    script = _Script([_ok(1, 296)])
    settings = _settings(script)
    result = JevHttpBackend(settings).score(_items(1))
    assert result.retry_count == 0
    assert result.outcomes[0].provider_verdict == "scored"
    assert result.outcomes[0].raw_score == 0.5
    assert result.outcomes[0].failure_kind is None
    assert result.attempts[0].prompt_tokens == 296
    assert result.attempts[0].elapsed_ms == 10
    assert result.attempts[0].http_status == 200
    sent = json.loads(script.requests[0].content)
    assert sent["model"] == "MiniCPM-OCR-Jev"
    assert sent["stream"] is False
    assert sent["minicpm_ocr_jev"]["mode"] == "score"


def test_ac_59_sends_64_then_1_when_there_are_65_items() -> None:
    script = _Script([_ok(64, 10), _ok(1, 3)])
    result = JevHttpBackend(_settings(script)).score(_items(65))
    assert [
        len(json.loads(request.content)["minicpm_ocr_jev"]["items"]) for request in script.requests
    ] == [64, 1]
    assert len(result.outcomes) == 65
    assert [attempt.prompt_tokens for attempt in result.attempts] == [10, 3]


@pytest.mark.parametrize("credential", [None, ""])
def test_ac_59_sends_nothing_when_the_credential_is_missing(credential: str | None) -> None:
    script = _Script([_ok(1, 1)])
    result = JevHttpBackend(_settings(script, credential=credential)).score(_items(2))
    assert script.requests == []
    assert result.attempts == ()
    assert result.retry_count == 0
    assert [outcome.failure_kind for outcome in result.outcomes] == ["auth", "auth"]
    assert [outcome.unavailable for outcome in result.outcomes] == [True, True]
    assert [outcome.raw_score for outcome in result.outcomes] == [None, None]


def test_ac_59_keeps_the_key_in_the_authorization_header_when_scoring() -> None:
    script = _Script([_ok(1, 4)])
    result = JevHttpBackend(_settings(script)).score(_items(1))
    request = script.requests[0]
    assert request.headers["authorization"] == f"Bearer {KEY}"
    assert KEY not in request.content.decode()
    assert KEY not in json.dumps(dataclasses.asdict(result))


def test_ac_59_records_service_failed_when_content_does_not_parse() -> None:
    script = _Script([httpx.Response(200, json={"choices": [{"message": {"content": "{"}}]})])
    result = JevHttpBackend(_settings(script)).score(_items(2))
    assert result.retry_count == 0
    assert [outcome.failure_kind for outcome in result.outcomes] == [
        "service_failed",
        "service_failed",
    ]
    assert [outcome.raw_score for outcome in result.outcomes] == [None, None]
    assert [outcome.provider_verdict for outcome in result.outcomes] == [None, None]


def test_ac_59_leaves_usage_unknown_when_the_body_omits_it() -> None:
    script = _Script([_ok(1, None)])
    result = JevHttpBackend(_settings(script)).score(_items(1))
    assert result.attempts[0].prompt_tokens is None


def test_ac_59_does_not_split_413_when_retries_are_left_at_zero() -> None:
    script = _Script([httpx.Response(413, headers={"X-Request-Id": "req_test_413"})])
    settings = _settings(script)
    result = JevHttpBackend(settings).score(_items(4))
    assert len(script.requests) == 1
    assert result.retry_count == 0
    assert _delays(settings) == []
    assert {outcome.failure_kind for outcome in result.outcomes} == {"too_large"}
    assert all(outcome.raw_score is None for outcome in result.outcomes)


def test_ac_59_splits_413_in_half_when_a_retry_is_configured() -> None:
    script = _Script(
        [
            httpx.Response(413, headers={"X-Request-Id": "req_test_413"}),
            _ok(2, 5),
            _ok(2, 6),
        ]
    )
    settings = _settings(script, RetryPolicy(max_retries=1))
    result = JevHttpBackend(settings).score(_items(4))
    sizes = [
        len(json.loads(request.content)["minicpm_ocr_jev"]["items"]) for request in script.requests
    ]
    assert sizes == [4, 2, 2]
    assert result.retry_count == 1
    assert _delays(settings) == []
    assert len(result.outcomes) == 4
    assert all(outcome.raw_score == 0.5 for outcome in result.outcomes)


def test_ac_59_waits_for_retry_after_when_a_retry_is_configured() -> None:
    script = _Script(
        [
            httpx.Response(429, headers={"Retry-After": "2", "X-Request-Id": "req_test_429"}),
            _ok(1, 8),
        ]
    )
    settings = _settings(script, RetryPolicy(max_retries=1))
    result = JevHttpBackend(settings).score(_items(1))
    assert _delays(settings) == [2000]
    assert result.retry_count == 1
    assert result.outcomes[0].provider_verdict == "scored"


def test_does_not_retry_429_when_retry_after_is_absent() -> None:
    script = _Script([httpx.Response(429, headers={"X-Request-Id": "req_test_429"})])
    settings = _settings(script, RetryPolicy(max_retries=4))
    result = JevHttpBackend(settings).score(_items(1))
    assert len(script.requests) == 1
    assert _delays(settings) == []
    assert result.outcomes[0].failure_kind == "rate_limited"
    assert result.outcomes[0].raw_score is None


def test_uses_the_supplied_backoff_when_the_server_returns_502() -> None:
    script = _Script([httpx.Response(502, headers={"X-Request-Id": "req_test_502"}), _ok(1, 9)])
    settings = _settings(script, RetryPolicy(max_retries=1, service_backoff_ms=(7,)))
    result = JevHttpBackend(settings).score(_items(1))
    assert _delays(settings) == [7]
    assert result.outcomes[0].raw_score == 0.5
    assert result.attempts[0].prompt_tokens is None
    assert result.attempts[1].prompt_tokens == 9


def test_does_not_invent_a_backoff_when_none_was_supplied() -> None:
    script = _Script([httpx.Response(500)])
    settings = _settings(script, RetryPolicy(max_retries=3))
    result = JevHttpBackend(settings).score(_items(1))
    assert len(script.requests) == 1
    assert _delays(settings) == []
    assert result.outcomes[0].failure_kind == "service_failed"


def test_records_timeout_when_the_transport_times_out() -> None:
    script = _Script([httpx.ReadTimeout("timed out")])
    settings = _settings(script)
    result = JevHttpBackend(settings).score(_items(1))
    assert result.attempts[0].failure is not None
    assert result.attempts[0].failure.kind == "timeout"
    assert result.outcomes[0].raw_score is None
    assert _delays(settings) == []


def test_fails_when_a_request_is_not_stubbed() -> None:
    script = _Script([])
    with pytest.raises(AssertionError, match="unstubbed"):
        JevHttpBackend(_settings(script)).score(_items(1))


def test_makes_no_socket_call_when_no_transport_is_injected() -> None:
    result = JevHttpBackend(JevHttpSettings(credential=KEY, clock=_Clock())).score(_items(1))
    assert result.attempts[0].http_status is None
    assert result.outcomes[0].failure_kind == "service_failed"
    assert result.outcomes[0].raw_score is None


def test_uses_the_international_base_when_the_caller_does_not_choose_one() -> None:
    script = _Script([_ok(1, 1)])
    JevHttpBackend(_settings(script)).score(_items(1))
    assert str(script.requests[0].url).startswith(INTERNATIONAL_BASE_URL + "/chat/completions")


def test_uses_the_configured_base_when_the_caller_selects_the_unverified_site() -> None:
    script = _Script([_ok(1, 1)])
    settings = _settings(script, base_url=DOMESTIC_BASE_URL_UNVERIFIED)
    described = JevHttpBackend(settings).describe()
    JevHttpBackend(settings).score(_items(1))
    assert described.site == "api.modelbest.cn"
    assert described.model == "MiniCPM-OCR-Jev"
    assert str(script.requests[0].url).startswith(DOMESTIC_BASE_URL_UNVERIFIED)


def test_returns_nothing_when_there_are_no_items() -> None:
    script = _Script([_ok(1, 1)])
    result = JevHttpBackend(_settings(script)).score([])
    assert script.requests == []
    assert result.outcomes == ()

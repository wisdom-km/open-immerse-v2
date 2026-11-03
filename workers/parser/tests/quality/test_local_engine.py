"""Local stub: unavailable, no score, no ModelBest call."""

from oi_worker.quality.backends.local_engine import LocalEngine
from oi_worker.quality.evaluator import EvalItem


def test_ac_103_returns_unavailable_without_a_score_when_the_stub_is_used() -> None:
    item = EvalItem(image_base64="YQ==", ocr_text="alpha", category="text")
    result = LocalEngine().score([item])
    assert result.attempts == ()
    assert result.retry_count == 0
    assert result.outcomes[0].unavailable is True
    assert result.outcomes[0].raw_score is None
    assert result.outcomes[0].provider_verdict is None
    assert result.outcomes[0].failure_kind is None
    described = LocalEngine().describe()
    assert described.deployment == "local-stub"
    assert described.model is None
    assert described.site is None

"""Parse choices[0].message.content without changing upstream scores."""

import json

import pytest

from oi_worker.quality.evaluator import EvalItem, EvalOutcome
from oi_worker.quality.response_body import outcomes_from_body, prompt_tokens


def _item() -> EvalItem:
    return EvalItem(image_base64="YQ==", ocr_text="alpha", category="text")


def _body(results: list[object], tokens: int | None = 11) -> dict[str, object]:
    document: dict[str, object] = {
        "choices": [{"message": {"content": json.dumps({"results": results})}}],
    }
    if tokens is not None:
        document["usage"] = {"prompt_tokens": tokens}
    return document


def test_ac_59_keeps_placeholder_scores_when_the_upstream_sends_them() -> None:
    body = _body(
        [
            {"verdict": "precheck_reject", "prob_yes": 0.0},
            {"verdict": "encode_error", "prob_yes": -1.0},
        ]
    )
    outcomes = outcomes_from_body(body, [_item(), _item()])
    assert outcomes is not None
    assert outcomes[0] == EvalOutcome("precheck_reject", 0.0, None, False)
    assert outcomes[1].provider_verdict == "encode_error"
    assert outcomes[1].raw_score == -1.0
    assert outcomes[1].failure_kind is None


def test_ac_59_returns_prompt_tokens_when_usage_is_present() -> None:
    assert prompt_tokens(_body([], 296)) == 296


def test_ac_59_omits_usage_when_the_response_has_none() -> None:
    assert prompt_tokens(_body([], None)) is None


def test_fails_the_batch_when_content_is_not_json() -> None:
    body = {"choices": [{"message": {"content": "not-json"}}]}
    assert outcomes_from_body(body, [_item()]) is None


def test_fails_the_batch_when_the_result_count_differs() -> None:
    body = _body([{"verdict": "scored", "prob_yes": 0.5}])
    assert outcomes_from_body(body, [_item(), _item()]) is None


def test_rejects_a_score_when_the_outcome_is_a_failure() -> None:
    with pytest.raises(ValueError, match="failure has no score"):
        EvalOutcome("scored", 0.2, "auth", True)

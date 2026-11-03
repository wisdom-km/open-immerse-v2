"""Parse a Jev score response. Upstream scores are returned unchanged."""

import json
from collections.abc import Sequence
from typing import cast

from oi_worker.quality.evaluator import EvalItem, EvalOutcome


def prompt_tokens(body: object) -> int | None:
    document = _as_dict(body)
    if document is None:
        return None
    usage = _as_dict(document.get("usage"))
    if usage is None:
        return None
    tokens = usage.get("prompt_tokens")
    if isinstance(tokens, bool) or not isinstance(tokens, int):
        return None
    return tokens


def outcomes_from_body(body: object, items: Sequence[EvalItem]) -> list[EvalOutcome] | None:
    parsed = _as_dict(_parsed_content(body))
    if parsed is None:
        return None
    results = _as_list(parsed.get("results"))
    if results is None or len(results) != len(items):
        return None
    outcomes: list[EvalOutcome] = []
    for result in results:
        outcome = _one(result)
        if outcome is None:
            return None
        outcomes.append(outcome)
    return outcomes


def _parsed_content(body: object) -> object | None:
    document = _as_dict(body)
    if document is None:
        return None
    choices = _as_list(document.get("choices"))
    if choices is None or len(choices) == 0:
        return None
    first = _as_dict(choices[0])
    if first is None:
        return None
    message = _as_dict(first.get("message"))
    if message is None:
        return None
    content = message.get("content")
    if not isinstance(content, str):
        return None
    try:
        loaded: object = json.loads(content)
    except json.JSONDecodeError:
        return None
    return loaded


def _one(result: object) -> EvalOutcome | None:
    row = _as_dict(result)
    if row is None:
        return None
    verdict = row.get("verdict")
    if not isinstance(verdict, str):
        return None
    accepted, raw_score = _score(row.get("prob_yes"))
    if not accepted:
        return None
    return EvalOutcome(
        provider_verdict=verdict,
        raw_score=raw_score,
        failure_kind=None,
        unavailable=False,
    )


def _score(value: object) -> tuple[bool, float | None]:
    if value is None:
        return True, None
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        return False, None
    return True, float(value)


def _as_dict(value: object) -> dict[str, object] | None:
    if not isinstance(value, dict):
        return None
    return cast(dict[str, object], value)


def _as_list(value: object) -> list[object] | None:
    if not isinstance(value, list):
        return None
    return cast(list[object], value)

"""Worker-side Jev evaluator port.

Upstream verdicts and scores stay as returned. Normalization and dropping
placeholder 0.0 / -1.0 scores happen in the TS quality domain.
"""

from dataclasses import dataclass
from typing import Protocol

from oi_worker.quality.http_errors import ProviderFailure


@dataclass(frozen=True, slots=True)
class EvalItem:
    image_base64: str
    ocr_text: str
    category: str
    case_id: str | None = None


@dataclass(frozen=True, slots=True)
class EvalOutcome:
    provider_verdict: str | None
    raw_score: float | None
    failure_kind: str | None = None
    unavailable: bool = False

    def __post_init__(self) -> None:
        failed = self.unavailable or self.failure_kind is not None
        if failed and self.raw_score is not None:
            raise ValueError("failure has no score")
        if failed and self.provider_verdict is not None:
            raise ValueError("failure has no upstream verdict")


@dataclass(frozen=True, slots=True)
class EvaluatorDescriptor:
    deployment: str
    model: str | None
    site: str | None


@dataclass(frozen=True, slots=True)
class AttemptRecord:
    elapsed_ms: int
    http_status: int | None
    prompt_tokens: int | None
    failure: ProviderFailure | None


@dataclass(frozen=True, slots=True)
class JevScoreResult:
    outcomes: tuple[EvalOutcome, ...]
    attempts: tuple[AttemptRecord, ...]
    retry_count: int


class QualityEvaluatorBackend(Protocol):
    max_batch: int

    def describe(self) -> EvaluatorDescriptor: ...

    def evaluate(self, items: list[EvalItem]) -> list[EvalOutcome]: ...


def outcomes_for_failure(count: int, kind: str) -> tuple[EvalOutcome, ...]:
    unavailable = kind in {"auth", "quota"}
    return tuple(
        EvalOutcome(
            provider_verdict=None,
            raw_score=None,
            failure_kind=kind,
            unavailable=unavailable,
        )
        for _ in range(count)
    )


def outcomes_unavailable(count: int) -> tuple[EvalOutcome, ...]:
    return tuple(
        EvalOutcome(
            provider_verdict=None,
            raw_score=None,
            failure_kind=None,
            unavailable=True,
        )
        for _ in range(count)
    )

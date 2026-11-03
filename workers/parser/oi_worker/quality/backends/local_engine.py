"""Local Jev stub. Does not download a model and does not call ModelBest."""

from collections.abc import Sequence

from oi_worker.quality.evaluator import (
    EvalItem,
    EvalOutcome,
    EvaluatorDescriptor,
    JevScoreResult,
    outcomes_unavailable,
)


class LocalEngine:
    max_batch = 64

    def describe(self) -> EvaluatorDescriptor:
        return EvaluatorDescriptor(deployment="local-stub", model=None, site=None)

    def evaluate(self, items: list[EvalItem]) -> list[EvalOutcome]:
        return list(self.score(items).outcomes)

    def score(self, items: Sequence[EvalItem]) -> JevScoreResult:
        return JevScoreResult(outcomes_unavailable(len(items)), (), 0)

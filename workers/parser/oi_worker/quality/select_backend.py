"""The only module that branches on jev.route."""

from oi_worker.quality.backends.jev_http import JevHttpBackend, JevHttpSettings
from oi_worker.quality.backends.local_engine import LocalEngine
from oi_worker.quality.evaluator import QualityEvaluatorBackend


def select_backend(route: str, settings: JevHttpSettings | None = None) -> QualityEvaluatorBackend:
    if route == "local":
        return LocalEngine()
    if route == "api":
        return JevHttpBackend(settings)
    raise ValueError("jev.route")

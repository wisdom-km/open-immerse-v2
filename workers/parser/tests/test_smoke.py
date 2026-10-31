"""G8: pytest collects a real test instead of an empty run."""

from pathlib import Path


def test_runtime_dependency_pins_pypdfium2() -> None:
    text = Path("pyproject.toml").read_text(encoding="utf-8")
    assert 'dependencies = ["pypdfium2==5.14.0"]' in text

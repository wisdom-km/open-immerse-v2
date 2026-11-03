"""G2: ruff complexity is an error on a deliberate violation."""

import importlib.util
import subprocess
import sys
from pathlib import Path


def _require_dev_module(module_name: str) -> None:
    if importlib.util.find_spec(module_name) is None:
        raise AssertionError(
            f"{module_name} is not installed for {sys.executable}; "
            "run pytest from the project dev environment, not via uv on PATH"
        )


def test_ruff_rejects_complexity_above_15(tmp_path: Path) -> None:
    lines = ["def too_complex(n: int) -> int:"]
    for index in range(16):
        lines.append(f"    if n == {index}:")
        lines.append(f"        return {index}")
    lines.append("    return -1")
    source = tmp_path / "too_complex.py"
    source.write_text("\n".join(lines) + "\n", encoding="utf-8")
    _require_dev_module("ruff")
    result = subprocess.run(
        [sys.executable, "-m", "ruff", "check", "--config", "pyproject.toml", str(source)],
        check=False,
        capture_output=True,
        text=True,
    )
    output = result.stdout + result.stderr
    assert result.returncode != 0
    assert "C901" in output

"""G2: ruff complexity is an error on a deliberate violation."""

import subprocess
from pathlib import Path


def test_ruff_rejects_complexity_above_15(tmp_path: Path) -> None:
    lines = ["def too_complex(n: int) -> int:"]
    for index in range(16):
        lines.append(f"    if n == {index}:")
        lines.append(f"        return {index}")
    lines.append("    return -1")
    source = tmp_path / "too_complex.py"
    source.write_text("\n".join(lines) + "\n", encoding="utf-8")
    result = subprocess.run(
        ["uv", "run", "ruff", "check", "--config", "pyproject.toml", str(source)],
        check=False,
        capture_output=True,
        text=True,
    )
    output = result.stdout + result.stderr
    assert result.returncode != 0
    assert "C901" in output

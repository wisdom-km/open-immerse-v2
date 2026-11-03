"""G6 and Q6: a real worker module that imports PyMuPDF fails import-linter."""

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


def test_import_linter_rejects_pymupdf_on_the_worker_tree() -> None:
    _require_dev_module("importlinter")
    target = Path("oi_worker/preprocess/_gate_pymupdf.py")
    target.write_text("import pymupdf\n", encoding="utf-8")
    try:
        result = subprocess.run(
            [
                sys.executable,
                "-c",
                "from importlinter.cli import lint_imports_command; lint_imports_command()",
            ],
            check=False,
            capture_output=True,
            text=True,
        )
        output = result.stdout + result.stderr
        assert result.returncode != 0
        assert "pymupdf" in output.lower()
    finally:
        target.unlink(missing_ok=True)

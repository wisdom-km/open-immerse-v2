"""G6 and Q6: a real worker module that imports PyMuPDF fails import-linter."""

import subprocess
from pathlib import Path


def test_import_linter_rejects_pymupdf_on_the_worker_tree() -> None:
    target = Path("oi_worker/preprocess/_gate_pymupdf.py")
    target.write_text("import pymupdf\n", encoding="utf-8")
    try:
        result = subprocess.run(
            ["uv", "run", "lint-imports"],
            check=False,
            capture_output=True,
            text=True,
        )
        output = result.stdout + result.stderr
        assert result.returncode != 0
        assert "pymupdf" in output.lower()
    finally:
        target.unlink(missing_ok=True)

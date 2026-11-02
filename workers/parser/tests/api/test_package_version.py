"""Worker package version lookup."""

from pathlib import Path

import pytest

from oi_worker.api.package_version import package_version, read_package_version


def test_returns_the_declared_version_when_pyproject_has_one(tmp_path: Path) -> None:
    path = tmp_path / "pyproject.toml"
    path.write_text('[project]\nversion = "0.0.0"\n', encoding="utf-8")
    assert read_package_version(path) == "0.0.0"


def test_returns_the_repository_version_when_called_without_a_path() -> None:
    assert package_version() == "0.0.0"


@pytest.mark.parametrize(
    "text",
    [
        "",
        "version = '0.0.0'\n",
        "[project]\nname = 'oi-worker'\n",
        "[project]\nversion = ''\n",
        "[project]\nversion = 1\n",
    ],
)
def test_rejects_a_file_when_the_version_is_missing(tmp_path: Path, text: str) -> None:
    path = tmp_path / "pyproject.toml"
    path.write_text(text, encoding="utf-8")
    with pytest.raises(ValueError, match="^worker.version$"):
        read_package_version(path)


def test_rejects_a_path_when_the_file_is_missing(tmp_path: Path) -> None:
    with pytest.raises(ValueError, match="^worker.version$"):
        read_package_version(tmp_path / "missing.toml")

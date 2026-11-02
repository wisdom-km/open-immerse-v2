"""Read the worker package version. README「三种版本号」."""

import tomllib
from pathlib import Path
from typing import cast

_PYPROJECT = Path(__file__).resolve().parents[2] / "pyproject.toml"


def package_version() -> str:
    return read_package_version(_PYPROJECT)


def read_package_version(path: Path) -> str:
    loaded = _load(path)
    version = _project_version(loaded)
    if not isinstance(version, str) or version == "":
        raise ValueError("worker.version")
    return version


def _load(path: Path) -> dict[str, object]:
    try:
        with path.open("rb") as handle:
            loaded = tomllib.load(handle)
    except (OSError, tomllib.TOMLDecodeError):
        raise ValueError("worker.version") from None
    return cast(dict[str, object], loaded)


def _project_version(loaded: dict[str, object]) -> object:
    project = loaded.get("project")
    if not isinstance(project, dict):
        raise ValueError("worker.version")
    table = cast(dict[str, object], project)
    return table.get("version")

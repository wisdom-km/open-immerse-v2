"""Read the installed worker version. README「三种版本号」."""

from importlib.metadata import PackageNotFoundError, version

DISTRIBUTION = "oi-worker"


def package_version() -> str:
    return read_package_version(DISTRIBUTION)


def read_package_version(distribution: str) -> str:
    try:
        found = version(distribution)
    except PackageNotFoundError:
        raise ValueError("worker.version") from None
    if found == "":
        raise ValueError("worker.version")
    return found

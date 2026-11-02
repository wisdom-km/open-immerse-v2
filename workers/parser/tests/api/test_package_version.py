"""Worker package version lookup."""

import pytest

from oi_worker.api.package_version import package_version, read_package_version


def test_returns_the_installed_version_when_the_distribution_is_present() -> None:
    assert read_package_version("oi-worker") == "0.0.0"
    assert package_version() == "0.0.0"


def test_rejects_a_distribution_when_it_is_not_installed() -> None:
    with pytest.raises(ValueError, match="^worker.version$"):
        read_package_version("oi-worker-missing")

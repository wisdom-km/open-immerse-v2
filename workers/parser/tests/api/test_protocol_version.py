"""OI-Protocol header gate."""

import pytest

from oi_worker.api.protocol_version import gate_header


def test_allows_the_call_when_the_major_is_supported() -> None:
    assert gate_header("1.0") is None


def test_ac_66_allows_the_call_when_the_minor_is_newer() -> None:
    assert gate_header("1.4") is None


def test_ac_66_returns_426_body_when_the_major_is_unsupported() -> None:
    assert gate_header("2.0") == {"supported": ["1.0"]}


def test_rejects_a_header_when_it_is_not_a_version() -> None:
    with pytest.raises(ValueError, match="^protocol.version$"):
        gate_header("2")

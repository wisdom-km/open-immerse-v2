"""The launch token is read off the main thread so a stop can still exit 0."""

import io
import sys

import pytest

from oi_worker.api.launch_token import MISSING_TOKEN_STATUS
from oi_worker.api.stop_signals import read_token_unless_stopped
from tests.api.conftest import LAUNCH_TOKEN


def test_read_token_unless_stopped_returns_the_line(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(sys, "stdin", io.StringIO(LAUNCH_TOKEN + "\n"))
    assert read_token_unless_stopped() == LAUNCH_TOKEN


def test_read_token_unless_stopped_exits_nonzero_when_empty(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(sys, "stdin", io.StringIO(""))
    with pytest.raises(SystemExit) as raised:
        read_token_unless_stopped()
    assert raised.value.code == MISSING_TOKEN_STATUS

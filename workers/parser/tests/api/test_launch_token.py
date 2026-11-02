"""The launch token comes from stdin and is not echoed."""

import io

import pytest

from oi_worker.api.launch_token import MISSING_TOKEN_STATUS, read_launch_token


def test_returns_the_line_when_stdin_has_a_token() -> None:
    assert read_launch_token(io.StringIO("oitest_launchhealth\n")) == "oitest_launchhealth"


def test_strips_a_crlf_when_stdin_uses_one() -> None:
    assert read_launch_token(io.StringIO("oitest_launchhealth\r\n")) == "oitest_launchhealth"


@pytest.mark.parametrize(
    "text",
    ["", "\n", "\r\n", "   \n", "\t\n", "oitest_spaced token\n", " oitest_launchhealth\n"],
)
def test_exits_nonzero_when_stdin_has_no_token(
    text: str, capsys: pytest.CaptureFixture[str]
) -> None:
    with pytest.raises(SystemExit) as raised:
        read_launch_token(io.StringIO(text))
    assert raised.value.code == MISSING_TOKEN_STATUS
    captured = capsys.readouterr()
    assert captured.out == ""
    assert captured.err == ""
    assert "oitest_" not in captured.out
    assert "oitest_" not in captured.err

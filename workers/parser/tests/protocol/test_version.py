"""Protocol version token."""

import pytest

from oi_worker.protocol.version import parse_protocol_version


def test_accepts_1_0_when_the_header_is_canonical() -> None:
    parsed = parse_protocol_version("1.0")
    assert parsed.major == 1
    assert parsed.minor == 0
    assert parsed.text() == "1.0"


def test_accepts_a_higher_minor_when_the_header_stays_canonical() -> None:
    parsed = parse_protocol_version("1.9")
    assert parsed.text() == "1.9"


@pytest.mark.parametrize(
    "value",
    ["1", "1.0.0", "01.0", "1.00", "", "1.0 ", " v1.0", "1.", ".0", 1, None, True],
)
def test_rejects_a_version_when_the_text_is_not_canonical(value: object) -> None:
    with pytest.raises(ValueError, match="^protocol.version$"):
        parse_protocol_version(value)

"""426 body validation."""

import pytest

from oi_worker.protocol.unsupported import dump_unsupported, parse_unsupported


def test_ac_66_accepts_the_426_body_when_supported_lists_1_0() -> None:
    document = parse_unsupported({"supported": ["1.0"], "detail": "ignored"})
    assert dump_unsupported(document) == {"supported": ["1.0"]}


def test_accepts_several_versions_when_each_entry_is_canonical() -> None:
    document = parse_unsupported({"supported": ["1.0", "1.2"]})
    assert document.supported == ("1.0", "1.2")


@pytest.mark.parametrize(
    "payload",
    [
        [],
        {},
        {"supported": []},
        {"supported": "1.0"},
        {"supported": ["1"]},
        {"supported": [1]},
        {"supported": ["1.0", ""]},
        {"versions": ["1.0"]},
    ],
)
def test_rejects_the_426_body_when_supported_is_not_a_version_list(payload: object) -> None:
    with pytest.raises(ValueError, match="^unsupported[.]"):
        parse_unsupported(payload)

"""426 body validation."""

import pytest
from pydantic import ValidationError

from oi_worker.protocol.unsupported import UnsupportedProtocol


def test_ac_66_accepts_the_426_body_when_supported_lists_1_0() -> None:
    document = UnsupportedProtocol.model_validate({"supported": ["1.0"], "detail": "ignored"})
    assert document.model_dump(mode="json") == {"supported": ["1.0"]}


def test_accepts_several_versions_when_each_entry_is_canonical() -> None:
    document = UnsupportedProtocol.model_validate({"supported": ["1.0", "1.2"]})
    assert document.model_dump(mode="json")["supported"] == ["1.0", "1.2"]


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
    with pytest.raises(ValidationError):
        UnsupportedProtocol.model_validate(payload)

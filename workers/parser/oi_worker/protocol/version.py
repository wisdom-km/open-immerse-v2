"""oi-parse/1 version token. ARCHITECTURE §10.4."""

from dataclasses import dataclass

_DIGITS = frozenset("0123456789")


@dataclass(frozen=True, slots=True)
class ProtocolVersion:
    major: int
    minor: int

    def text(self) -> str:
        return f"{self.major}.{self.minor}"


def parse_protocol_version(value: object) -> ProtocolVersion:
    if not isinstance(value, str):
        raise ValueError("protocol.version")
    major_text, dot, minor_text = value.partition(".")
    if dot != "." or not _canonical(major_text) or not _canonical(minor_text):
        raise ValueError("protocol.version")
    return ProtocolVersion(major=int(major_text), minor=int(minor_text))


def _canonical(part: str) -> bool:
    if not part or any(character not in _DIGITS for character in part):
        return False
    return part == "0" or not part.startswith("0")

"""OI-Protocol is missing or not major.minor. ARCHITECTURE §10.4."""


class ProtocolVersionError(Exception):
    code = "protocol.version"

    def __init__(self) -> None:
        super().__init__(self.code)

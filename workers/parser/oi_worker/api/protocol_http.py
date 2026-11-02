"""Map ValueError("protocol.version") to HTTP. ARCHITECTURE §10.4.

The exchange still raises. The spec states 426 for an unsupported major and
does not state a status for a missing or malformed OI-Protocol header. The
400 body below is Forge-proposed, pending owner confirmation.
"""

from fastapi.responses import JSONResponse

PROTOCOL_VERSION_ERROR = "protocol.version"
MALFORMED_PROTOCOL_STATUS = 400


def protocol_error_response(exc: ValueError) -> JSONResponse | None:
    if str(exc) != PROTOCOL_VERSION_ERROR:
        return None
    return JSONResponse(
        status_code=MALFORMED_PROTOCOL_STATUS,
        content={"error": PROTOCOL_VERSION_ERROR},
    )

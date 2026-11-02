"""Map a missing or malformed OI-Protocol header to HTTP 400.

Wisdom 2026-11-02 20:07 approved this status and the code body. Verbatim:
「都按你的建议：400、--port/OI_WORKER_PORT、Windows 设必需；另开小 PR 加 macOS 健康检查并设必需」
"""

from fastapi.responses import JSONResponse

from oi_worker.api.protocol_error import ProtocolVersionError

MALFORMED_PROTOCOL_STATUS = 400


def protocol_version_response() -> JSONResponse:
    return JSONResponse(
        status_code=MALFORMED_PROTOCOL_STATUS,
        content={"code": ProtocolVersionError.code},
    )

"""Stop signals for the local worker, before and while uvicorn is starting.

``OI_WORKER_STOP_READY`` and ``OI_WORKER_HOLD_READY`` are test-only hooks.
Production and the desktop supervisor leave both unset. Unset means no ready
file is written, and the hold path does not wait.
"""

import asyncio
import os
import signal
import sys
import threading
from collections.abc import Callable
from typing import Protocol, cast

from oi_worker.api.launch_token import MISSING_TOKEN_STATUS, read_launch_token

# Test-only. Production must not set these.
STOP_READY = "OI_WORKER_STOP_READY"
HOLD_READY = "OI_WORKER_HOLD_READY"

_POLL_S = 0.05
_HOLD_WAIT_S = 5.0
_Handler = Callable[[int, object], object] | int


class StopNotice:
    def __init__(self) -> None:
        self.requested = False

    def note(self, _signum: int, _frame: object) -> None:
        self.requested = True


class _ExitFlag(Protocol):
    should_exit: bool


class _ReadBox:
    def __init__(self) -> None:
        self.token: str | None = None
        self.error: BaseException | None = None


def arm_quiet_stop() -> None:
    """Exit 0 on SIGINT, SIGTERM, and SIGBREAK before uvicorn takes them."""
    for signum in stop_signals():
        signal.signal(signum, _quiet_exit)
    _write_ready(os.environ.get(STOP_READY))


def read_token_unless_stopped() -> str:
    """Read the launch token without blocking the main thread in ``ReadFile``.

    On Windows, CTRL_BREAK does not interrupt a stdin read, and a Python
    signal handler runs only when the main thread next executes bytecode.
    The token is read on a daemon thread. The main thread polls
    ``Event.wait`` so a pending handler can raise ``SystemExit(0)``.
    A missing token still exits non-zero.
    """
    box = _ReadBox()
    done = threading.Event()

    def _read() -> None:
        try:
            box.token = read_launch_token()
        except BaseException as exc:
            box.error = exc
        finally:
            done.set()

    threading.Thread(target=_read, name="oi-launch-token", daemon=True).start()
    while not done.wait(_POLL_S):
        pass
    if box.error is not None:
        raise box.error
    if box.token is None:
        raise SystemExit(MISSING_TOKEN_STATUS)
    return box.token


def install_hold(notice: StopNotice) -> dict[int, _Handler]:
    previous: dict[int, _Handler] = {}
    for signum in stop_signals():
        previous[signum] = cast(_Handler, signal.signal(signum, notice.note))
    return previous


def restore_handlers(previous: dict[int, _Handler]) -> None:
    for signum, handler in previous.items():
        signal.signal(signum, handler)


def honor_stop(server: _ExitFlag, notice: StopNotice) -> None:
    if notice.requested:
        server.should_exit = True


async def wait_hold_window(notice: StopNotice) -> None:
    """Pause only when the test-only ``OI_WORKER_HOLD_READY`` hook is set."""
    path = os.environ.get(HOLD_READY)
    if not path:
        return
    _write_ready(path)
    loop = asyncio.get_running_loop()
    deadline = loop.time() + _HOLD_WAIT_S
    while not notice.requested and loop.time() < deadline:
        await asyncio.sleep(_POLL_S)


def stop_signals() -> tuple[int, ...]:
    signums: list[int] = [signal.SIGINT, signal.SIGTERM]
    sigbreak = getattr(signal, "SIGBREAK", None)
    if isinstance(sigbreak, int):
        signums.append(sigbreak)
    return tuple(signums)


def _quiet_exit(_signum: int, _frame: object) -> None:
    # Installed only until uvicorn takes over. On Windows, SystemExit still
    # finalizes while the token thread is inside ReadFile and can hang.
    # os._exit skips that, prints nothing, and does not run after the hold
    # handler replaces this one.
    if sys.platform == "win32":
        os._exit(0)
    raise SystemExit(0)


def _write_ready(path: str | None) -> None:
    if not path:
        return
    with open(path, "w", encoding="utf-8") as handle:
        handle.write("ready\n")

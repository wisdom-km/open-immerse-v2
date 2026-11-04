"""Serve the ASGI app on a loopback socket until a stop signal ends it."""

import asyncio
import json
import os
import signal
import socket
import sys
from collections.abc import Callable
from typing import cast

import uvicorn
from fastapi import FastAPI

from oi_worker.api.listen_port import LISTEN_ERROR, resolve_port
from oi_worker.api.loopback import bind_loopback, bound_port

_START_ATTEMPTS = 2000
_START_PAUSE_S = 0.01
_HOLD_WAIT_S = 5.0
_STOP_READY = "OI_WORKER_STOP_READY"
_HOLD_READY = "OI_WORKER_HOLD_READY"


class _StopNotice:
    def __init__(self) -> None:
        self.requested = False

    def note(self, _signum: int, _frame: object) -> None:
        self.requested = True


def arm_quiet_stop() -> None:
    """Exit 0 on SIGINT, SIGTERM, and SIGBREAK before uvicorn takes them."""
    for signum in _stop_signals():
        signal.signal(signum, _quiet_exit)
    _write_ready(os.environ.get(_STOP_READY))


def _quiet_exit(_signum: int, _frame: object) -> None:
    raise SystemExit(0)


def serve_local(app: FastAPI, argv: list[str], env: dict[str, str]) -> None:
    sock = bind_loopback(resolve_port(argv, env))
    try:
        asyncio.run(_serve(app, sock))
    finally:
        sock.close()


async def _serve(app: FastAPI, sock: socket.socket) -> None:
    notice = _StopNotice()
    server = uvicorn.Server(_config(app, bound_port(sock)))
    task = asyncio.create_task(_run_until_stop(server, sock, notice))
    try:
        await _wait_started(server, task, notice)
        _report(bound_port(sock))
        await task
        _mark_exit()
    finally:
        if not task.done():
            server.should_exit = True
            await task


def _config(app: FastAPI, port: int) -> uvicorn.Config:
    return uvicorn.Config(
        app,
        host="127.0.0.1",
        port=port,
        access_log=False,
        log_level="warning",
    )


async def _run_until_stop(
    server: uvicorn.Server,
    sock: socket.socket,
    notice: _StopNotice,
) -> None:
    """Remember a stop that arrives before uvicorn installs its own handler.

    uvicorn 0.38.0 saves the handler it finds, restores it, then re-raises.
    This handler only records the signal, so that re-raise does not set a
    non-zero status. A signal during the hand-off sets ``should_exit`` once
    the server is up. Tests pin the uvicorn version.
    """
    previous = _install_exit_handlers(notice.note)
    try:
        await _wait_hold_window(notice)
        await server.serve(sockets=[sock])
    finally:
        _restore_exit_handlers(previous)


_Handler = Callable[[int, object], object] | int


def _install_exit_handlers(
    handler: Callable[[int, object], None],
) -> dict[int, _Handler]:
    previous: dict[int, _Handler] = {}
    for signum in _stop_signals():
        previous[signum] = cast(_Handler, signal.signal(signum, handler))
    return previous


def _restore_exit_handlers(previous: dict[int, _Handler]) -> None:
    for signum, handler in previous.items():
        signal.signal(signum, handler)


def _stop_signals() -> tuple[int, ...]:
    signums: list[int] = [signal.SIGINT, signal.SIGTERM]
    sigbreak = getattr(signal, "SIGBREAK", None)
    if isinstance(sigbreak, int):
        signums.append(sigbreak)
    return tuple(signums)


async def _wait_hold_window(notice: _StopNotice) -> None:
    path = os.environ.get(_HOLD_READY)
    if not path:
        return
    _write_ready(path)
    loop = asyncio.get_running_loop()
    deadline = loop.time() + _HOLD_WAIT_S
    while not notice.requested and loop.time() < deadline:
        await asyncio.sleep(_START_PAUSE_S)


def _honor_stop(server: uvicorn.Server, notice: _StopNotice) -> None:
    if notice.requested:
        server.should_exit = True


def _write_ready(path: str | None) -> None:
    if not path:
        return
    with open(path, "w", encoding="utf-8") as handle:
        handle.write("ready\n")


async def _wait_started(
    server: uvicorn.Server,
    task: asyncio.Task[None],
    notice: _StopNotice,
) -> None:
    for _ in range(_START_ATTEMPTS):
        if server.started:
            _honor_stop(server, notice)
            return
        if task.done():
            await task
            raise SystemExit(LISTEN_ERROR)
        await asyncio.sleep(_START_PAUSE_S)
    server.should_exit = True
    raise SystemExit(LISTEN_ERROR)


def _report(port: int) -> None:
    _write_line({"port": port})


def _mark_exit() -> None:
    _write_line({"event": "exited"})


def _write_line(payload: dict[str, int] | dict[str, str]) -> None:
    sys.stdout.write(json.dumps(payload) + "\n")
    sys.stdout.flush()

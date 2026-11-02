"""Serve the ASGI app on a loopback socket until uvicorn handles a stop signal."""

import asyncio
import json
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


def serve_local(app: FastAPI, argv: list[str], env: dict[str, str]) -> None:
    sock = bind_loopback(resolve_port(argv, env))
    try:
        asyncio.run(_serve(app, sock))
    finally:
        sock.close()


async def _serve(app: FastAPI, sock: socket.socket) -> None:
    server = uvicorn.Server(_config(app, bound_port(sock)))
    task = asyncio.create_task(_run_until_stop(server, sock))
    try:
        await _wait_started(server, task)
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


async def _run_until_stop(server: uvicorn.Server, sock: socket.socket) -> None:
    """Hold stop signals only for uvicorn 0.38.0's re-raise.

    That version saves the handlers it finds, restores them, then re-raises.
    The hold is the handler it restores, so the re-raise does not set a
    non-zero status. Re-run the Windows health job on any uvicorn bump.
    Before this call and after it returns, SIGINT and SIGTERM stay as they
    were, so an early or late signal still ends the process.
    """
    previous = _install_exit_handlers()
    try:
        await server.serve(sockets=[sock])
    finally:
        _restore_exit_handlers(previous)


_Handler = Callable[[int, object], object] | int


def _install_exit_handlers() -> dict[int, _Handler]:
    previous: dict[int, _Handler] = {}
    for signum in _stop_signals():
        previous[signum] = cast(_Handler, signal.signal(signum, _hold))
    return previous


def _restore_exit_handlers(previous: dict[int, _Handler]) -> None:
    for signum, handler in previous.items():
        signal.signal(signum, handler)


def _hold(_signum: int, _frame: object) -> None:
    return None


def _stop_signals() -> tuple[int, ...]:
    signums: list[int] = [signal.SIGINT, signal.SIGTERM]
    sigbreak = getattr(signal, "SIGBREAK", None)
    if isinstance(sigbreak, int):
        signums.append(sigbreak)
    return tuple(signums)


async def _wait_started(server: uvicorn.Server, task: asyncio.Task[None]) -> None:
    for _ in range(_START_ATTEMPTS):
        if server.started:
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

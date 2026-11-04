"""Serve the ASGI app on a loopback socket until a stop signal ends it."""

import asyncio
import json
import socket
import sys

import uvicorn
from fastapi import FastAPI

from oi_worker.api.listen_port import LISTEN_ERROR, resolve_port
from oi_worker.api.loopback import bind_loopback, bound_port
from oi_worker.api.stop_signals import (
    StopNotice,
    honor_stop,
    install_hold,
    restore_handlers,
    wait_hold_window,
)

_START_ATTEMPTS = 2000
_START_PAUSE_S = 0.01


def serve_local(app: FastAPI, argv: list[str], env: dict[str, str]) -> None:
    sock = bind_loopback(resolve_port(argv, env))
    try:
        asyncio.run(_serve(app, sock))
    finally:
        sock.close()


async def _serve(app: FastAPI, sock: socket.socket) -> None:
    notice = StopNotice()
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
    notice: StopNotice,
) -> None:
    """Remember a stop that arrives before uvicorn installs its own handler.

    uvicorn 0.38.0 saves the handler it finds, restores it, then re-raises.
    The hold handler only records the signal, so that re-raise does not set a
    non-zero status. A signal during the hand-off sets ``should_exit`` once
    the server is up. Tests pin the uvicorn version.
    """
    previous = install_hold(notice)
    try:
        await wait_hold_window(notice)
        await server.serve(sockets=[sock])
    finally:
        restore_handlers(previous)


async def _wait_started(
    server: uvicorn.Server,
    task: asyncio.Task[None],
    notice: StopNotice,
) -> None:
    for _ in range(_START_ATTEMPTS):
        if server.started:
            honor_stop(server, notice)
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

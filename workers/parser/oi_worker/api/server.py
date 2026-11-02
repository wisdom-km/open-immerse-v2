"""Serve the ASGI app on a loopback socket until uvicorn handles a stop signal."""

import asyncio
import json
import socket
import sys

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
    task = asyncio.create_task(server.serve(sockets=[sock]))
    try:
        await _wait_started(server, task)
        _report(bound_port(sock))
        await task
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
    sys.stdout.write(json.dumps({"port": port}) + "\n")
    sys.stdout.flush()

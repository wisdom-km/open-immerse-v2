"""Bind 127.0.0.1 and nothing else. ARCHITECTURE §10.1."""

import socket
import sys

from oi_worker.api.listen_port import LISTEN_ERROR

LOOPBACK_HOST = "127.0.0.1"


def bind_loopback(port: int) -> socket.socket:
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    try:
        _prepare(sock, port)
    except OSError:
        sock.close()
        raise SystemExit(LISTEN_ERROR) from None
    return sock


def bound_port(sock: socket.socket) -> int:
    host, port = _endpoint(sock)
    if host != LOOPBACK_HOST:
        sock.close()
        raise SystemExit(LISTEN_ERROR)
    return port


def _prepare(sock: socket.socket, port: int) -> None:
    if sys.platform != "win32":
        sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    sock.bind((LOOPBACK_HOST, port))
    sock.listen(socket.SOMAXCONN)
    host, _bound = _endpoint(sock)
    if host != LOOPBACK_HOST:
        raise OSError(LISTEN_ERROR)


def _endpoint(sock: socket.socket) -> tuple[str, int]:
    host, port = sock.getsockname()
    if not isinstance(host, str) or not isinstance(port, int):
        raise OSError(LISTEN_ERROR)
    return host, port

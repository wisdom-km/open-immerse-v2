"""Choose the listen port from --port, else OI_WORKER_PORT, else 0."""

import argparse
from collections.abc import Mapping, Sequence

PORT_ENV = "OI_WORKER_PORT"
LISTEN_ERROR = "listen.port"
MAX_PORT = 65535


def resolve_port(argv: Sequence[str], env: Mapping[str, str]) -> int:
    chosen = _from_args(argv)
    if chosen is not None:
        return chosen
    chosen = _from_env(env)
    if chosen is not None:
        return chosen
    return 0


def _from_args(argv: Sequence[str]) -> int | None:
    parser = argparse.ArgumentParser(prog="oi_worker")
    parser.add_argument("--port", type=int, default=None)
    try:
        parsed = parser.parse_args(list(argv))
    except SystemExit as exc:
        if exc.code == 0:
            raise
        raise SystemExit(LISTEN_ERROR) from None
    value: object = getattr(parsed, "port", None)
    if value is None:
        return None
    if not isinstance(value, int):
        raise SystemExit(LISTEN_ERROR)
    return _in_range(value)


def _from_env(env: Mapping[str, str]) -> int | None:
    raw = env.get(PORT_ENV)
    if raw is None or raw == "":
        return None
    if not raw.isascii() or not raw.isdigit():
        raise SystemExit(LISTEN_ERROR)
    return _in_range(int(raw))


def _in_range(port: int) -> int:
    if port < 0 or port > MAX_PORT:
        raise SystemExit(LISTEN_ERROR)
    return port

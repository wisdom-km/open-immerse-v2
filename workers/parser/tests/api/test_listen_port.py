"""Port selection for the local worker."""

import pytest

from oi_worker.api.listen_port import resolve_port


def test_uses_zero_when_neither_arg_nor_env_is_set() -> None:
    assert resolve_port([], {}) == 0


def test_uses_the_env_when_no_arg_is_set() -> None:
    assert resolve_port([], {"OI_WORKER_PORT": "8765"}) == 8765


def test_uses_the_arg_when_the_env_is_also_set() -> None:
    assert resolve_port(["--port", "9"], {"OI_WORKER_PORT": "8"}) == 9


def test_treats_zero_as_an_ephemeral_port() -> None:
    assert resolve_port(["--port", "0"], {}) == 0
    assert resolve_port([], {"OI_WORKER_PORT": "0"}) == 0


@pytest.mark.parametrize(
    ("argv", "env"),
    [
        (["--port", "nope"], {}),
        (["--port", "-1"], {}),
        (["--port", "65536"], {}),
        ([], {"OI_WORKER_PORT": "nope"}),
        ([], {"OI_WORKER_PORT": "-1"}),
        ([], {"OI_WORKER_PORT": "65536"}),
        ([], {"OI_WORKER_PORT": "080 "}),
        (["--host", "0.0.0.0"], {}),
    ],
)
def test_rejects_a_port_when_it_is_not_a_tcp_port(argv: list[str], env: dict[str, str]) -> None:
    with pytest.raises(SystemExit) as caught:
        resolve_port(argv, env)
    assert caught.value.code == "listen.port"

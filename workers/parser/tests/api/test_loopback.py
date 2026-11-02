"""The listen socket is 127.0.0.1."""

from oi_worker.api.loopback import LOOPBACK_HOST, bind_loopback, bound_port


def test_binds_loopback_when_the_port_is_ephemeral() -> None:
    sock = bind_loopback(0)
    try:
        host, port = sock.getsockname()
        assert host == LOOPBACK_HOST
        assert host == "127.0.0.1"
        assert bound_port(sock) == port
        assert port != 0
    finally:
        sock.close()

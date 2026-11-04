"""Local worker entry. Read the token, assemble the app, serve it."""

import os
import sys

from oi_worker.api.app import create_app
from oi_worker.api.server import serve_local
from oi_worker.api.stop_signals import arm_quiet_stop, read_token_unless_stopped


def main(argv: list[str] | None = None) -> None:
    arm_quiet_stop()
    token = read_token_unless_stopped()
    args = sys.argv[1:] if argv is None else argv
    serve_local(create_app("local", token), args, dict(os.environ))


if __name__ == "__main__":
    main()

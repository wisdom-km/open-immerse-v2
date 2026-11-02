"""Local worker entry. Read the token, assemble the app, serve it."""

import os
import sys

from oi_worker.api.app import create_app
from oi_worker.api.launch_token import read_launch_token
from oi_worker.api.server import serve_local


def main(argv: list[str] | None = None) -> None:
    token = read_launch_token()
    args = sys.argv[1:] if argv is None else argv
    serve_local(create_app("local", token), args, dict(os.environ))


if __name__ == "__main__":
    main()

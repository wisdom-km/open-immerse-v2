"""Local worker entry. Read the port, assemble the app, serve it."""

import os
import sys

from oi_worker.api.app import create_app
from oi_worker.api.server import serve_local


def main(argv: list[str] | None = None) -> None:
    serve_local(create_app("local"), sys.argv[1:] if argv is None else argv, dict(os.environ))


if __name__ == "__main__":
    main()

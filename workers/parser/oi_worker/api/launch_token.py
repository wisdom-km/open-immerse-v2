"""Read the one-time bearer from stdin. ARCHITECTURE §10.1.

A missing token refuses startup. The value is not written to stdout or stderr.
"""

import sys
from typing import TextIO

MISSING_TOKEN_STATUS = 1


def read_launch_token(stream: TextIO | None = None) -> str:
    source = sys.stdin if stream is None else stream
    token = _one_line(source.readline())
    if token == "":
        raise SystemExit(MISSING_TOKEN_STATUS)
    return token


def _one_line(line: str) -> str:
    if line.endswith("\n"):
        line = line[:-1]
    if line.endswith("\r"):
        line = line[:-1]
    return line

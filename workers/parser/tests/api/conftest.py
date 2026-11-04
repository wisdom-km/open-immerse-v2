"""Shared process helpers for the local worker tests."""

import os
import subprocess
import sys
import time
from collections.abc import Callable
from pathlib import Path

import pytest

Spawn = Callable[..., subprocess.Popen[str]]
Ready = Callable[[Path], None]

PARSER = Path(__file__).resolve().parents[2]
LAUNCH_TOKEN = "oitest_launchhealth"


def wait_ready(path: Path, timeout: float = 15) -> None:
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        if path.is_file():
            return
        time.sleep(0.02)
    raise AssertionError("ready file")


def spawn_worker(
    stdin: int | None,
    command: list[str] | None = None,
    extra_env: dict[str, str] | None = None,
) -> subprocess.Popen[str]:
    env = dict(os.environ)
    env.pop("OI_WORKER_PORT", None)
    if extra_env is not None:
        env.update(extra_env)
    env["PYTHONUNBUFFERED"] = "1"
    assert all(LAUNCH_TOKEN not in value for value in env.values())
    kwargs: dict[str, object] = {}
    if sys.platform == "win32":
        kwargs["creationflags"] = subprocess.CREATE_NEW_PROCESS_GROUP
    else:
        kwargs["start_new_session"] = True
    if command is None:
        command = [sys.executable, "-m", "oi_worker"]
    assert all(LAUNCH_TOKEN not in part for part in command)
    return subprocess.Popen(
        command,
        cwd=PARSER,
        env=env,
        stdin=stdin,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        **kwargs,  # type: ignore[arg-type]
    )


@pytest.fixture
def worker_spawn() -> Spawn:
    return spawn_worker


@pytest.fixture
def worker_ready() -> Ready:
    return wait_ready

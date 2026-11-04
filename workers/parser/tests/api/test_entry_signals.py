"""Stop signals on the real ``python -m oi_worker`` entry."""

import os
import signal
import subprocess
import sys
import time
from pathlib import Path

import pytest
import uvicorn

PARSER = Path(__file__).resolve().parents[2]
TOKEN = "oitest_launchhealth"


def test_uvicorn_stop_behavior_is_pinned_to_0_38_0() -> None:
    assert uvicorn.__version__ == "0.38.0"


def _wait_ready(path: Path, timeout: float = 15) -> None:
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        if path.is_file():
            return
        time.sleep(0.02)
    raise AssertionError("ready file")


def _spawn(ready: Path) -> subprocess.Popen[str]:
    env = dict(os.environ)
    env.pop("OI_WORKER_PORT", None)
    env["PYTHONUNBUFFERED"] = "1"
    env["OI_WORKER_STOP_READY"] = str(ready)
    assert all(TOKEN not in value for value in env.values())
    command = [sys.executable, "-m", "oi_worker"]
    assert all(TOKEN not in part for part in command)
    kwargs: dict[str, object] = {}
    if sys.platform == "win32":
        kwargs["creationflags"] = subprocess.CREATE_NEW_PROCESS_GROUP
    else:
        kwargs["start_new_session"] = True
    return subprocess.Popen(
        command,
        cwd=PARSER,
        env=env,
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        **kwargs,  # type: ignore[arg-type]
    )


@pytest.mark.skipif(
    sys.platform == "win32",
    reason="subprocess SIGTERM on Windows is TerminateProcess",
)
def test_real_entry_sigterm_exits_zero_before_the_token_is_read(tmp_path: Path) -> None:
    proc = _spawn(tmp_path / "stop-ready")
    assert proc.stdin is not None
    assert proc.stdout is not None
    assert proc.stderr is not None
    code: int | None = None
    stdout = ""
    stderr = ""
    try:
        _wait_ready(tmp_path / "stop-ready")
        proc.send_signal(signal.SIGTERM)
        code = proc.wait(timeout=15)
        stdout = proc.stdout.read()
        stderr = proc.stderr.read()
    finally:
        if proc.poll() is None:
            proc.kill()
            proc.wait(timeout=5)
        proc.stdin.close()
    assert code == 0
    assert stdout == ""
    assert TOKEN not in stdout
    assert TOKEN not in stderr
    assert "Traceback" not in stderr

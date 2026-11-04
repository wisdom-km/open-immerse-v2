"""Stop signals on the real ``python -m oi_worker`` entry."""

import signal
import subprocess
import sys
from collections.abc import Callable
from pathlib import Path

import pytest
import uvicorn

from tests.api.conftest import LAUNCH_TOKEN

TOKEN = LAUNCH_TOKEN
Spawn = Callable[..., subprocess.Popen[str]]
Ready = Callable[[Path], None]


def test_uvicorn_stop_behavior_is_pinned_to_0_38_0() -> None:
    assert uvicorn.__version__ == "0.38.0"


@pytest.mark.skipif(
    sys.platform == "win32",
    reason="subprocess SIGTERM on Windows is TerminateProcess",
)
def test_real_entry_sigterm_exits_zero_before_the_token_is_read(
    tmp_path: Path,
    worker_spawn: Spawn,
    worker_ready: Ready,
) -> None:
    ready = tmp_path / "stop-ready"
    proc = worker_spawn(subprocess.PIPE, extra_env={"OI_WORKER_STOP_READY": str(ready)})
    assert proc.stdin is not None
    assert proc.stdout is not None
    assert proc.stderr is not None
    code: int | None = None
    stdout = ""
    stderr = ""
    try:
        worker_ready(ready)
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

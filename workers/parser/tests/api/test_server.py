"""Start python -m oi_worker, hit health, then stop the process."""

import json
import signal
import subprocess
import sys
import threading
from collections.abc import Callable
from pathlib import Path

import httpx

from tests.api.conftest import LAUNCH_TOKEN

TOKEN = LAUNCH_TOKEN
Spawn = Callable[..., subprocess.Popen[str]]
Ready = Callable[[Path], None]


def _stop(proc: subprocess.Popen[str]) -> None:
    if sys.platform == "win32":
        proc.send_signal(signal.CTRL_BREAK_EVENT)
        return
    proc.send_signal(signal.SIGTERM)


def _assert_linux_refused(port: int) -> None:
    try:
        httpx.get(
            f"http://127.0.0.1:{port}/v1/health",
            headers={"Authorization": f"Bearer {TOKEN}"},
            timeout=2,
        )
    except httpx.ConnectError:
        return
    raise AssertionError("port stayed open")


def _read_line(
    stream: object,
    timeout: float,
    waiter: list[threading.Thread] | None = None,
) -> str:
    holder: list[str] = []

    def _read() -> None:
        holder.append(stream.readline())  # type: ignore[attr-defined]

    thread = threading.Thread(target=_read)
    thread.start()
    if waiter is not None:
        waiter.append(thread)
    thread.join(timeout)
    if thread.is_alive() or not holder or holder[0] == "":
        raise AssertionError("stdout line")
    return holder[0]


def _signal_before_takeover() -> int:
    if sys.platform == "win32":
        return signal.CTRL_BREAK_EVENT
    return signal.SIGINT


def _start(spawn: Spawn) -> subprocess.Popen[str]:
    proc = spawn(subprocess.PIPE)
    assert proc.stdin is not None
    proc.stdin.write(TOKEN + "\n")
    proc.stdin.close()
    return proc


def test_sigint_ends_the_process_outside_the_uvicorn_hold(
    tmp_path: Path,
    worker_spawn: Spawn,
    worker_ready: Ready,
) -> None:
    # Real entry: python -m oi_worker. The ready file appears only after
    # main() has installed the quiet handler and before the token is read.
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
        proc.send_signal(_signal_before_takeover())
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


def test_hold_window_exits_zero_and_marks_exited(
    tmp_path: Path,
    worker_spawn: Spawn,
    worker_ready: Ready,
) -> None:
    ready = tmp_path / "hold-ready"
    proc = worker_spawn(subprocess.PIPE, extra_env={"OI_WORKER_HOLD_READY": str(ready)})
    assert proc.stdin is not None
    assert proc.stdout is not None
    assert proc.stderr is not None
    code: int | None = None
    stdout = ""
    stderr = ""
    try:
        proc.stdin.write(TOKEN + "\n")
        proc.stdin.close()
        worker_ready(ready)
        proc.send_signal(_signal_before_takeover())
        code = proc.wait(timeout=15)
        stdout = proc.stdout.read()
        stderr = proc.stderr.read()
    finally:
        if proc.poll() is None:
            proc.kill()
            proc.wait(timeout=5)
    assert code == 0
    lines = [line for line in stdout.splitlines() if line]
    assert json.loads(lines[-1]) == {"event": "exited"}
    assert TOKEN not in stdout
    assert TOKEN not in stderr
    assert "Traceback" not in stderr


def test_exits_nonzero_when_stdin_has_no_token(worker_spawn: Spawn) -> None:
    proc = worker_spawn(subprocess.DEVNULL)
    assert proc.stdout is not None
    assert proc.stderr is not None
    code = proc.wait(timeout=15)
    stdout = proc.stdout.read()
    stderr = proc.stderr.read()
    assert code not in {0, None}
    assert stdout == ""
    assert TOKEN not in stderr
    assert "Traceback" not in stderr


def test_ac_80_returns_200_without_paths_or_keys_when_the_worker_is_started(
    worker_spawn: Spawn,
) -> None:
    proc = _start(worker_spawn)
    stderr = ""
    assert proc.stderr is not None
    assert proc.stdout is not None

    def _drain() -> None:
        nonlocal stderr
        assert proc.stderr is not None
        stderr = proc.stderr.read()

    drain = threading.Thread(target=_drain)
    drain.start()
    try:
        line = _read_line(proc.stdout, 30)
        reported = json.loads(line)
        assert set(reported) == {"port"}
        port = reported["port"]
        assert isinstance(port, int)
        assert TOKEN not in line
        assert "/" not in line
        assert "\\" not in line
        response = httpx.get(
            f"http://127.0.0.1:{port}/v1/health",
            headers={"OI-Protocol": "1.0", "Authorization": f"Bearer {TOKEN}"},
            timeout=5,
        )
        assert response.status_code == 200
        text = response.text
        assert TOKEN not in text
        assert "/" not in text
        assert "\\" not in text
        assert "key" not in text.lower()
        body = response.json()
        assert set(body) == {"protocol", "workerVersion", "mode"}
        assert body["mode"] == "local"
        assert body["protocol"] == "1.0"
        denied = httpx.get(
            f"http://127.0.0.1:{port}/v1/health",
            headers={"OI-Protocol": "1.0"},
            timeout=5,
        )
        assert denied.status_code == 401
        assert TOKEN not in denied.text
        _stop(proc)
        marker = _read_line(proc.stdout, 15)
        assert json.loads(marker) == {"event": "exited"}
        assert TOKEN not in marker
        code = proc.wait(timeout=15)
        drain.join(timeout=5)
        assert code == 0
        assert TOKEN not in stderr
        assert "Traceback" not in stderr
        if sys.platform != "win32":
            _assert_linux_refused(port)
    finally:
        drain.join(timeout=5)
        if proc.poll() is None:
            proc.kill()
            proc.wait(timeout=5)

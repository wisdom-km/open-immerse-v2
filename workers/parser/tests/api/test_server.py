"""Start python -m oi_worker, hit health, then stop the process."""

import json
import os
import signal
import subprocess
import sys
import threading
from pathlib import Path

import httpx
import pytest

PARSER = Path(__file__).resolve().parents[2]
TOKEN = "oitest_launchhealth"
# Printed by the test launcher after imports and before main(). The worker
# itself does not emit this line. main() then blocks in readline, which is
# before the no-op handlers around uvicorn.serve.
_BEFORE_HOLD_LINE = "oi-worker-before-hold\n"


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


def _command_before_hold() -> list[str]:
    script = (
        "import sys\n"
        "from oi_worker.__main__ import main\n"
        f"sys.stdout.write({_BEFORE_HOLD_LINE!r})\n"
        "sys.stdout.flush()\n"
        "main()\n"
    )
    command = [sys.executable, "-c", script]
    assert all(TOKEN not in part for part in command)
    return command


def _spawn(stdin: int | None, command: list[str] | None = None) -> subprocess.Popen[str]:
    env = dict(os.environ)
    env.pop("OI_WORKER_PORT", None)
    env["PYTHONUNBUFFERED"] = "1"
    assert all(TOKEN not in value for value in env.values())
    kwargs: dict[str, object] = {}
    if sys.platform == "win32":
        kwargs["creationflags"] = subprocess.CREATE_NEW_PROCESS_GROUP
    else:
        kwargs["start_new_session"] = True
    if command is None:
        command = [sys.executable, "-m", "oi_worker"]
    assert all(TOKEN not in part for part in command)
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


def _start() -> subprocess.Popen[str]:
    proc = _spawn(subprocess.PIPE)
    assert proc.stdin is not None
    proc.stdin.write(TOKEN + "\n")
    proc.stdin.close()
    return proc


@pytest.mark.skipif(sys.platform == "win32", reason="Windows stop signal is SIGBREAK")
def test_sigint_ends_the_process_outside_the_uvicorn_hold() -> None:
    # Do not write the launch token. After the marker, main() is blocked in
    # readline and cannot install the no-op hold. An immediate SIGINT races
    # that hold: the signal is swallowed and the server stays up.
    proc = _spawn(subprocess.PIPE, _command_before_hold())
    assert proc.stdin is not None
    assert proc.stdout is not None
    assert proc.stderr is not None
    waiter: list[threading.Thread] = []
    try:
        line = _read_line(proc.stdout, 30, waiter)
        assert line == _BEFORE_HOLD_LINE
        proc.send_signal(signal.SIGINT)
        code = proc.wait(timeout=15)
    finally:
        if proc.poll() is None:
            proc.kill()
            proc.wait(timeout=5)
        for thread in waiter:
            thread.join(timeout=5)
        proc.stdin.close()
        proc.stdout.read()
        proc.stderr.read()
    assert code == -signal.SIGINT


def test_exits_nonzero_when_stdin_has_no_token() -> None:
    proc = _spawn(subprocess.DEVNULL)
    assert proc.stdout is not None
    assert proc.stderr is not None
    code = proc.wait(timeout=15)
    stdout = proc.stdout.read()
    stderr = proc.stderr.read()
    assert code not in {0, None}
    assert stdout == ""
    assert TOKEN not in stderr
    assert "Traceback" not in stderr


def test_ac_80_returns_200_without_paths_or_keys_when_the_worker_is_started() -> None:
    proc = _start()
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

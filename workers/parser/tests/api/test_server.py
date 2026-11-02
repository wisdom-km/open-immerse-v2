"""Start python -m oi_worker, hit health, then stop the process."""

import json
import os
import signal
import subprocess
import sys
import threading
from pathlib import Path

import httpx

PARSER = Path(__file__).resolve().parents[2]


def _stop(proc: subprocess.Popen[str]) -> None:
    if sys.platform == "win32":
        proc.send_signal(signal.CTRL_BREAK_EVENT)
        return
    proc.send_signal(signal.SIGTERM)


def _assert_refused(port: int) -> None:
    """The worker must not answer after it exits.

    Linux rejects the next connection. After CTRL_BREAK, Windows can drop
    that SYN instead of refusing it. A dropped SYN is not a health response.
    """
    try:
        httpx.get(f"http://127.0.0.1:{port}/v1/health", timeout=2)
    except httpx.ConnectError:
        return
    except httpx.TimeoutException:
        if sys.platform == "win32":
            return
    else:
        raise AssertionError("health still served")
    raise AssertionError("port stayed open")


def _read_line(stream: object, timeout: float) -> str:
    holder: list[str] = []

    def _read() -> None:
        holder.append(stream.readline())  # type: ignore[attr-defined]

    thread = threading.Thread(target=_read)
    thread.start()
    thread.join(timeout)
    if thread.is_alive() or not holder:
        raise AssertionError("port line")
    return holder[0]


def test_ac_80_returns_200_without_paths_or_keys_when_the_worker_is_started() -> None:
    env = dict(os.environ)
    env.pop("OI_WORKER_PORT", None)
    env["PYTHONUNBUFFERED"] = "1"
    kwargs: dict[str, object] = {}
    if sys.platform == "win32":
        kwargs["creationflags"] = subprocess.CREATE_NEW_PROCESS_GROUP
    else:
        kwargs["start_new_session"] = True
    proc = subprocess.Popen(
        [sys.executable, "-m", "oi_worker"],
        cwd=PARSER,
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        **kwargs,  # type: ignore[arg-type]
    )
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
        assert "/" not in line
        assert "\\" not in line
        response = httpx.get(
            f"http://127.0.0.1:{port}/v1/health",
            headers={"OI-Protocol": "1.0"},
            timeout=5,
        )
        assert response.status_code == 200
        text = response.text
        assert "/" not in text
        assert "\\" not in text
        assert "key" not in text.lower()
        body = response.json()
        assert set(body) == {"protocol", "workerVersion", "mode"}
        assert body["mode"] == "local"
        assert body["protocol"] == "1.0"
        _stop(proc)
        code = proc.wait(timeout=15)
        drain.join(timeout=5)
        assert "Traceback" not in stderr
        if sys.platform == "win32":
            assert code is not None
        else:
            assert code in {0, -signal.SIGTERM, 128 + signal.SIGTERM}
        _assert_refused(port)
    finally:
        drain.join(timeout=5)
        if proc.poll() is None:
            proc.kill()
            proc.wait(timeout=5)

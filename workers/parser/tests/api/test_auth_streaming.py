"""Streaming responses pass through the launch bearer middleware."""

import asyncio
import json
import warnings
from collections.abc import AsyncIterator, Coroutine

from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from starlette.types import ASGIApp, Message, Receive, Scope, Send

from oi_worker.api.auth import AUTH_CODE, LaunchBearerMiddleware

TOKEN = "oitest_launchstream"
WRONG = "oitest_wrongtoken"
PATH = "/v1/jobs/oitest/events"


def test_delivers_the_first_chunk_before_later_chunks_are_produced() -> None:
    async def scenario() -> None:
        gate = asyncio.Event()
        hits: list[int] = []
        messages: list[Message] = []
        first_chunk = asyncio.Event()

        async def send(message: Message) -> None:
            messages.append(message)
            if message["type"] == "http.response.body" and message.get("body"):
                first_chunk.set()

        task = asyncio.create_task(_call(_app(gate, hits), f"Bearer {TOKEN}", send))
        try:
            await asyncio.wait_for(first_chunk.wait(), timeout=1)
            assert _bodies(messages) == [b"one"]
            assert not gate.is_set()
            assert hits == [1]
            gate.set()
            await asyncio.wait_for(task, timeout=1)
        finally:
            await _stop(task)

        assert _bodies(messages) == [b"one", b"two", b""]
        assert _status(messages) == 200
        assert TOKEN.encode("ascii") not in b"".join(_bodies(messages))

    _run(scenario())


def test_returns_401_without_calling_the_route_when_the_bearer_is_wrong() -> None:
    async def scenario() -> None:
        gate = asyncio.Event()
        hits: list[int] = []
        messages: list[Message] = []

        async def send(message: Message) -> None:
            messages.append(message)

        task = asyncio.create_task(_call(_app(gate, hits), f"Bearer {WRONG}", send))
        try:
            await asyncio.wait_for(task, timeout=1)
        finally:
            await _stop(task)

        body = b"".join(_bodies(messages))
        assert _status(messages) == 401
        assert json.loads(body) == {"code": AUTH_CODE}
        assert hits == []
        assert not gate.is_set()
        assert TOKEN.encode("ascii") not in body
        assert WRONG.encode("ascii") not in body

    _run(scenario())


def test_passes_lifespan_and_websocket_through_when_the_scope_is_not_http() -> None:
    async def scenario() -> None:
        await _forward("lifespan", "lifespan.startup", "lifespan.startup.complete")
        await _forward("websocket", "websocket.connect", "websocket.accept")

    _run(scenario())


def _run(scenario: Coroutine[object, object, None]) -> None:
    with warnings.catch_warnings(record=True) as caught:
        warnings.simplefilter("always", DeprecationWarning)
        asyncio.run(scenario)
    assert [item for item in caught if issubclass(item.category, DeprecationWarning)] == []


def _app(gate: asyncio.Event, hits: list[int]) -> FastAPI:
    app = FastAPI()
    app.add_middleware(LaunchBearerMiddleware, token=TOKEN)

    async def chunks() -> AsyncIterator[bytes]:
        yield b"one"
        await gate.wait()
        yield b"two"

    async def events() -> StreamingResponse:
        hits.append(1)
        return StreamingResponse(chunks(), media_type="text/event-stream")

    app.add_api_route(PATH, events, methods=["GET"])
    return app


async def _call(app: ASGIApp, authorization: str, send: Send) -> None:
    scope: Scope = {
        "type": "http",
        "asgi": {"version": "3.0", "spec_version": "2.4"},
        "http_version": "1.1",
        "method": "GET",
        "scheme": "http",
        "path": PATH,
        "raw_path": PATH.encode("ascii"),
        "query_string": b"",
        "headers": [(b"authorization", authorization.encode("ascii"))],
        "client": ("127.0.0.1", 50000),
        "server": ("test", 80),
        "root_path": "",
    }
    await app(scope, _receive_once(), send)


def _receive_once() -> Receive:
    sent = False

    async def receive() -> Message:
        nonlocal sent
        if not sent:
            sent = True
            return {"type": "http.request", "body": b"", "more_body": False}
        await asyncio.Event().wait()
        return {"type": "http.disconnect"}

    return receive


async def _forward(kind: str, incoming: str, outgoing: str) -> None:
    seen: list[str] = []

    async def downstream(scope: Scope, receive: Receive, send: Send) -> None:
        seen.append(str(scope["type"]))
        message = await receive()
        await send({"type": outgoing, "got": message["type"]})

    sent: list[Message] = []

    async def receive() -> Message:
        return {"type": incoming}

    async def send(message: Message) -> None:
        sent.append(message)

    await LaunchBearerMiddleware(downstream, TOKEN)({"type": kind}, receive, send)
    assert seen == [kind]
    assert sent == [{"type": outgoing, "got": incoming}]


def _status(messages: list[Message]) -> int:
    for message in messages:
        if message["type"] == "http.response.start":
            return int(message["status"])
    return 0


def _bodies(messages: list[Message]) -> list[bytes]:
    chunks: list[bytes] = []
    for message in messages:
        if message["type"] != "http.response.body":
            continue
        body = message.get("body", b"")
        if isinstance(body, bytes):
            chunks.append(body)
    return chunks


async def _stop(task: asyncio.Task[None]) -> None:
    if task.done():
        return
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        return

"""Build a MiniCPM-OCR-Jev score request. No I/O."""

from collections.abc import Sequence
from typing import Literal, NotRequired, TypedDict

from oi_worker.quality.evaluator import EvalItem

MODEL = "MiniCPM-OCR-Jev"
PNG_PREFIX = "data:image/png;base64,"


class _ImageUrl(TypedDict):
    url: str


class _ImagePart(TypedDict):
    type: Literal["image_url"]
    image_url: _ImageUrl


class _TextPart(TypedDict):
    type: Literal["text"]
    text: str


class _ScoreItem(TypedDict):
    image: str
    ocr_text: str
    category: str
    case_id: NotRequired[str]


class _ScoreConfig(TypedDict):
    mode: str
    items: list[_ScoreItem]


class _Message(TypedDict):
    role: str
    content: list[_ImagePart | _TextPart]


class ScoreRequest(TypedDict):
    model: str
    messages: list[_Message]
    minicpm_ocr_jev: _ScoreConfig
    stream: bool


def score_request(items: Sequence[EvalItem]) -> ScoreRequest:
    content: list[_ImagePart | _TextPart] = []
    payload: list[_ScoreItem] = []
    for item in items:
        url = PNG_PREFIX + item.image_base64
        content.append({"type": "image_url", "image_url": {"url": url}})
        content.append({"type": "text", "text": item.ocr_text})
        entry: _ScoreItem = {
            "image": url,
            "ocr_text": item.ocr_text,
            "category": item.category,
        }
        if item.case_id is not None:
            entry["case_id"] = item.case_id
        payload.append(entry)
    return {
        "model": MODEL,
        "messages": [{"role": "user", "content": content}],
        "minicpm_ocr_jev": {"mode": "score", "items": payload},
        "stream": False,
    }

"""Score request body. mode is score only."""

from oi_worker.quality.evaluator import EvalItem
from oi_worker.quality.request_body import MODEL, PNG_PREFIX, score_request


def _item(text: str, case_id: str | None = None) -> EvalItem:
    return EvalItem(image_base64="YQ==", ocr_text=text, category="text", case_id=case_id)


def test_ac_59_builds_a_score_request_when_items_are_present() -> None:
    body = score_request([_item("alpha", "block-1"), _item("beta")])
    assert set(body) == {"model", "messages", "minicpm_ocr_jev", "stream"}
    assert body["model"] == MODEL
    assert body["stream"] is False
    config = body["minicpm_ocr_jev"]
    assert set(config) == {"mode", "items"}
    assert config["mode"] == "score"
    assert len(config["items"]) == 2
    assert config["items"][0].get("case_id") == "block-1"
    assert config["items"][1].get("case_id") is None
    content = body["messages"][0]["content"]
    assert len(content) == 4
    image = content[0]
    text = content[1]
    assert image["type"] == "image_url"
    assert text["type"] == "text"
    if image["type"] == "image_url":
        assert image["image_url"]["url"] == PNG_PREFIX + "YQ=="
    if text["type"] == "text":
        assert text["text"] == "alpha"
    assert "Authorization" not in str(body)

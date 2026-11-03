"""Batch splits for Jev score requests."""

import pytest

from oi_worker.quality.batching import chunks, split_in_half


def test_ac_59_splits_65_items_into_64_and_1_when_batching() -> None:
    groups = chunks(list(range(65)))
    assert [len(group) for group in groups] == [64, 1]
    assert groups[0][0] == 0
    assert groups[1] == [64]


def test_keeps_one_request_when_the_count_is_64() -> None:
    assert chunks(list(range(64))) == [list(range(64))]


def test_returns_no_batches_when_there_are_no_items() -> None:
    assert chunks([]) == []


def test_splits_in_half_when_the_batch_has_at_least_two_items() -> None:
    assert split_in_half([1, 2, 3, 4]) == ([1, 2], [3, 4])
    assert split_in_half([1, 2, 3, 4, 5]) == ([1, 2], [3, 4, 5])


def test_does_not_split_when_fewer_than_two_items_remain() -> None:
    assert split_in_half([1]) is None
    assert split_in_half([]) is None


def test_rejects_when_the_batch_size_is_not_positive() -> None:
    with pytest.raises(ValueError, match="size"):
        chunks([1], 0)

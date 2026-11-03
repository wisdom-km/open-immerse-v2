"""Split Jev score items into requests of at most 64."""

from collections.abc import Sequence
from typing import TypeVar

T = TypeVar("T")


def chunks(items: Sequence[T], size: int = 64) -> list[list[T]]:
    if size <= 0:
        raise ValueError("size")
    return [list(items[index : index + size]) for index in range(0, len(items), size)]


def split_in_half(items: Sequence[T]) -> tuple[list[T], list[T]] | None:
    if len(items) < 2:
        return None
    middle = len(items) // 2
    return list(items[:middle]), list(items[middle:])
